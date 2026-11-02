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

function buildPrompt(symptoms) {
  return [
    'You are a clinical decision-support tool producing an educational differential',
    'diagnosis. You are not giving medical advice and not making a definitive diagnosis.',
    '',
    `Reported symptoms: ${symptoms.join(', ')}.`,
    '',
    'Return exactly 5 candidate conditions, most likely first.',
    'Rules:',
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

/** One attempt against one model. Throws with `.retryable` set on transient faults. */
async function callModel(model, symptoms, apiKey) {
  let res;
  try {
    res = await fetch(`${API_BASE}/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(symptoms) }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema,
          temperature: 0.3,
        },
      }),
      signal: AbortSignal.timeout(25000),
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

async function analyzeWithGemini(symptoms) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set.');

  const primary = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const chain = [primary, ...FALLBACK_MODELS.filter((m) => m !== primary)];

  let text;
  let lastError;
  for (const model of chain) {
    try {
      text = await callModel(model, symptoms, apiKey);
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

module.exports = { analyzeWithGemini, isConfigured, DEFAULT_MODEL };
