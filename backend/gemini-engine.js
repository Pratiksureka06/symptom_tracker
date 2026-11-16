/**
 * Gemini-backed differential diagnosis.
 *
 * Returns the exact same shape as dataset-engine's analyzeSymptoms(), so the
 * frontend and the /api/analyze contract are unchanged. The local ML engine is
 * kept as the fallback for when no key is configured or a request fails.
 *
 * The API key is read from the environment and never leaves the backend.
 */

const { CATEGORIES, triageSymptoms } = require('./category-triage.js');

const CATEGORY_IDS = Object.keys(CATEGORIES);
const URGENCY_LEVELS = ['low', 'medium', 'high', 'emergency'];

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
// Override with GEMINI_MODEL if this id is retired or unavailable on your key.
//
// Not the newest id on purpose. As of 2026-10-28, gemini-3.8-flash and
// gemini-3.7-flash are listed by models.list with generateContent support but
// never return a response (no first byte in 75s), and gemini-flash-latest
// returns 503 UNAVAILABLE. gemini-3.6-flash answers in ~2.7s.
// Measured on 2026-10-29: gemini-3.6-flash returns 503 "high demand" on
// essentially every structured-output request, while gemini-3-flash-preview
// answers in ~1.5s. Leading with 3.6 just burned a failed call per request, so
// the preview is primary and 3.6 sits in the chain for when capacity returns.
const DEFAULT_MODEL = 'gemini-3-flash-preview';

// Gemini returns intermittent 503 "model is currently experiencing high demand"
// on the heavier structured-output request — measured ~2 failures in 3. Falling
// straight back to the local ML model on a transient blip gives the user the
// worse answer for no reason, so try the next model before giving up.
const FALLBACK_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.6-flash'];
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

function isConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** Schema for structured output, so the reply parses without scraping prose. */
const responseSchema = {
  type: 'OBJECT',
  properties: {
    primaryCategoryId: { type: 'STRING', enum: CATEGORY_IDS },
    conditions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          categoryId: { type: 'STRING', enum: CATEGORY_IDS },
          probability: { type: 'NUMBER' },
          urgency: { type: 'STRING', enum: URGENCY_LEVELS },
          description: { type: 'STRING' },
          nextSteps: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: ['name', 'categoryId', 'probability', 'urgency', 'description', 'nextSteps'],
        propertyOrdering: ['name', 'categoryId', 'probability', 'urgency', 'description', 'nextSteps'],
      },
    },
  },
  required: ['primaryCategoryId', 'conditions'],
};

/**
 * Render the per-symptom detail a person gave: how bad it is, how long it has
 * run, and anything they typed about its quality. Only symptoms that carry at
 * least one of these produce a line.
 */
function buildDetailLines(details) {
  if (!Array.isArray(details)) return [];
  return details
    .map((d) => {
      if (!d || !d.name) return null;
      const parts = [];
      if (d.severity) parts.push(String(d.severity));
      if (d.duration) parts.push(`for ${d.duration}`);
      if (d.notes) parts.push(`described as "${String(d.notes).slice(0, 160)}"`);
      return parts.length ? `- ${d.name}: ${parts.join(', ')}` : null;
    })
    .filter(Boolean);
}

/**
 * The context block is omitted entirely when nothing was reported, so a check
 * with no detail produces exactly the prompt this engine has always sent.
 */
function buildContextBlock(context = {}) {
  const detailLines = buildDetailLines(context.details);
  const triggers = Array.isArray(context.triggers) ? context.triggers.filter(Boolean) : [];
  if (detailLines.length === 0 && triggers.length === 0) return [];

  const block = [];
  if (detailLines.length > 0) {
    block.push('', 'Detail the person gave, where they gave it:', ...detailLines);
  }
  if (triggers.length > 0) {
    block.push('', `Environmental factors the person associates with this: ${triggers.join(', ')}.`);
  }
  return block;
}

function buildPrompt(symptoms, context = {}) {
  const contextBlock = buildContextBlock(context);
  const contextRules = contextBlock.length
    ? [
        '- Weigh the reported severity and duration: a severe or long-running symptom',
        '  should favour conditions whose usual course fits it, and should raise urgency',
        '  where that is clinically reasonable.',
        '- Environmental factors are what the person believes is involved, not established',
        '  cause. Treat them as context that can tip between otherwise similar conditions,',
        '  never as confirmation.',
        '- Where a symptom carries no detail, do not assume it is mild or recent.',
      ]
    : [];

  return [
    'You are a clinical decision-support tool producing an educational differential',
    'diagnosis. You are not giving medical advice and not making a definitive diagnosis.',
    '',
    `Reported symptoms: ${symptoms.join(', ')}.`,
    ...contextBlock,
    '',
    'Return exactly 5 candidate conditions, most likely first.',
    'Rules:',
    ...contextRules,
    '- probability is your confidence for that condition, between 0.01 and 0.99.',
    '- The 5 probabilities should sum to roughly 1.0; do not give several conditions 0.99.',
    '- Weigh how specific each symptom combination is. Common presentations should',
    '  outrank rare or age-inappropriate conditions.',
    '- urgency reflects how fast a person should seek care, not how likely it is.',
    '- description is one plain-language sentence a non-clinician understands.',
    '- nextSteps: 2-3 concrete, actionable steps. Always include seeing a clinician.',
    `- categoryId and primaryCategoryId must come from: ${CATEGORY_IDS.join(', ')}.`,
  ].join('\n');
}

/** Coerce the model's numbers into a sane, normalised distribution. */
function normaliseProbabilities(conditions) {
  const cleaned = conditions.map((c) => ({
    ...c,
    probability: Math.min(0.99, Math.max(0.01, Number(c.probability) || 0.01)),
  }));

  const sum = cleaned.reduce((acc, c) => acc + c.probability, 0);
  // Only rescale when the model ignored the "sum to ~1" instruction.
  if (sum > 1.25 || sum < 0.75) {
    cleaned.forEach((c) => {
      c.probability = Math.min(0.99, Math.max(0.01, c.probability / sum));
    });
  }

  cleaned.forEach((c) => {
    c.probability = Math.round(c.probability * 10000) / 10000;
  });
  return cleaned.sort((a, b) => b.probability - a.probability);
}

/** Rebuild the Stage-1 triage block from the model's category call. */
function buildTriage(symptoms, conditions, primaryCategoryId) {
  // Start from the keyword triage so categoryDistribution keeps its shape.
  const base = triageSymptoms(symptoms);

  const weights = {};
  CATEGORY_IDS.forEach((id) => { weights[id] = 0; });
  conditions.forEach((c) => {
    const id = CATEGORIES[c.categoryId] ? c.categoryId : 'infectious_systemic';
    weights[id] += c.probability;
  });

  const total = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  const distribution = {};
  CATEGORY_IDS.forEach((id) => {
    distribution[id] = weights[id] / total;
  });

  const primaryId = CATEGORIES[primaryCategoryId]
    ? primaryCategoryId
    : Object.keys(distribution).sort((a, b) => distribution[b] - distribution[a])[0];

  const topCategories = Object.keys(distribution)
    .filter((id) => distribution[id] > 0)
    .sort((a, b) => distribution[b] - distribution[a])
    .slice(0, 3)
    .map((id) => ({
      id,
      name: CATEGORIES[id].name,
      specialist: CATEGORIES[id].specialist,
      probability: Math.round(distribution[id] * 1000) / 1000,
      percentage: Math.round(distribution[id] * 100),
    }));

  return {
    ...base,
    primaryCategory: CATEGORIES[primaryId].name,
    primaryCategoryId: primaryId,
    categoryConfidence: Math.round(distribution[primaryId] * 1000) / 1000,
    categoryConfidencePercent: Math.round(distribution[primaryId] * 100),
    topCategories,
    recommendedSpecialist: CATEGORIES[primaryId].specialist,
    categoryDistribution: distribution,
  };
}

/**
 * One attempt against one model, for any prompt and schema.
 * Throws with `.retryable` set on transient faults.
 */
async function callGemini(model, promptText, schema, apiKey, temperature = 0.3, timeoutMs = 25000) {
  let res;
  try {
    res = await fetch(`${API_BASE}/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature,
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (cause) {
    // Timeout / network fault — worth trying the next model.
    const err = new Error(`${model}: ${cause.message}`);
    err.retryable = true;
    throw err;
  }

  if (!res.ok) {
    // Surface Gemini's own message — a retired model id shows up here as a 404.
    const detail = await res.text().catch(() => '');
    const err = new Error(`Gemini ${res.status} on ${model}: ${detail.slice(0, 200)}`);
    err.retryable = RETRYABLE_STATUS.has(res.status);
    throw err;
  }

  const payload = await res.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const err = new Error(`${model} returned no content.`);
    err.retryable = true;
    throw err;
  }
  return text;
}

/** The differential call, unchanged in behaviour: same schema, same temperature. */
function callModel(model, symptoms, apiKey, context) {
  return callGemini(model, buildPrompt(symptoms, context), responseSchema, apiKey, 0.3);
}

async function analyzeWithGemini(symptoms, context) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set.');

  const primary = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const chain = [primary, ...FALLBACK_MODELS.filter((m) => m !== primary)];

  let text;
  let lastError;
  for (const model of chain) {
    try {
      text = await callModel(model, symptoms, apiKey, context);
      if (model !== primary) {
        console.warn(`Gemini: ${primary} unavailable, answered with ${model}`);
      }
      break;
    } catch (error) {
      lastError = error;
      if (!error.retryable) throw error; // 400/404 won't fix themselves
      console.warn(`Gemini: ${error.message} — trying next model`);
    }
  }
  if (!text) throw lastError;

  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed.conditions) || parsed.conditions.length === 0) {
    throw new Error('Gemini returned no conditions.');
  }

  const ranked = normaliseProbabilities(parsed.conditions).slice(0, 5);

  const top5 = ranked.map((c, idx) => {
    const rank = idx + 1;
    let tier = 'Alternative Consideration (Top-5)';
    if (rank === 1) tier = 'Primary Match (Top-1)';
    else if (rank <= 3) tier = 'Differential Candidate (Top-3)';

    const catId = CATEGORIES[c.categoryId] ? c.categoryId : 'infectious_systemic';
    const cat = CATEGORIES[catId];
    const name = c.name.charAt(0).toUpperCase() + c.name.slice(1);

    return {
      id: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      name,
      diseaseRaw: c.name.toLowerCase(),
      probability: c.probability,
      description: c.description,
      nextSteps: Array.isArray(c.nextSteps) ? c.nextSteps : [],
      urgency: URGENCY_LEVELS.includes(c.urgency) ? c.urgency : 'medium',
      category: cat.name,
      specialist: cat.specialist,
      rank,
      tier,
    };
  });

  const top3 = top5.slice(0, 3);
  const sumTop5 = top5.reduce((s, c) => s + c.probability, 0) || 1;
  const sumTop3 = top3.reduce((s, c) => s + c.probability, 0);

  return {
    conditions: top5,
    triage: buildTriage(symptoms, ranked, parsed.primaryCategoryId),
    differentialDiagnosis: {
      top1: top5[0] || null,
      top3,
      top5,
      cumulativeProbabilityTop3: Math.round(sumTop3 * 100) / 100,
      top3CoveragePercent: Math.min(99, Math.round((sumTop3 / sumTop5) * 100)),
      totalEvaluatedDiseases: null, // not a fixed catalogue when the model ranks
    },
  };
}

/* ---------------------------------------------------------------------------
   Turning spoken words into symptoms.

   The old implementation matched a transcript against nine hardcoded phrases,
   so "my chest hurts" found nothing because the literal string was
   "chest pain". This asks Gemini to map what the person actually said onto
   the real catalogue, and then keeps only names that genuinely exist in it:
   the model never invents a symptom the rest of the app cannot handle.
--------------------------------------------------------------------------- */

const extractSchema = {
  type: 'object',
  properties: {
    symptoms: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['symptoms'],
};

function buildExtractPrompt(transcript, canonical) {
  return [
    'A person described how they feel, in their own words. Map what they said',
    'onto a fixed catalogue of symptom names.',
    '',
    `What they said: "${String(transcript).slice(0, 2000)}"`,
    '',
    'Rules:',
    '- Return only names copied exactly from the catalogue below. Never invent one.',
    '- Map everyday wording onto the catalogue: "my chest hurts" is chest pain,',
    '  "throwing up" is vomiting, "can\'t sleep" is insomnia.',
    '- Include a symptom only if the person says they have it. Ignore anything they',
    '  deny ("no fever"), ask about, or mention as past history.',
    '- Return an empty list if nothing in the catalogue matches.',
    '- At most 12 symptoms.',
    '',
    'Catalogue:',
    canonical.join('; '),
  ].join('\n');
}

/**
 * @param {string} transcript what the person said
 * @param {string[]} canonical the full symptom catalogue
 * @returns {Promise<string[]>} names guaranteed to exist in `canonical`
 */
async function extractSymptomsWithGemini(transcript, canonical) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set.');
  if (!transcript || !String(transcript).trim()) return [];

  const primary = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const chain = [primary, ...FALLBACK_MODELS.filter((m) => m !== primary)];
  const prompt = buildExtractPrompt(transcript, canonical);

  /* Two sweeps of the chain. In testing all three models returned 503
     ("high demand") within the same second, and the identical request
     succeeded moments later, so one sweep gives up too easily on what is a
     momentary spike. The analysis path keeps its single sweep: this one is
     short (20s per call) and a person is waiting on it. */
  let text;
  let lastError;
  outer: for (let sweep = 0; sweep < 2; sweep++) {
    if (sweep > 0) await new Promise((r) => setTimeout(r, 700));
    for (const model of chain) {
      try {
        // Temperature 0: this is a lookup, not a judgement call.
        text = await callGemini(model, prompt, extractSchema, apiKey, 0, 20000);
        break outer;
      } catch (error) {
        lastError = error;
        if (!error.retryable) throw error;
      }
    }
  }
  if (!text) throw lastError || new Error('No Gemini model answered.');

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Gemini returned unparseable JSON for symptom extraction.');
  }

  // Keep only names that really exist in the catalogue, in catalogue spelling.
  const byLower = new Map(canonical.map((n) => [n.toLowerCase(), n]));
  const seen = new Set();
  const out = [];
  for (const raw of Array.isArray(parsed.symptoms) ? parsed.symptoms : []) {
    const hit = byLower.get(String(raw).trim().toLowerCase());
    if (hit && !seen.has(hit)) {
      seen.add(hit);
      out.push(hit);
    }
  }
  return out.slice(0, 12);
}

module.exports = {
  analyzeWithGemini,
  extractSymptomsWithGemini,
  isConfigured,
  DEFAULT_MODEL,
};
