require('dotenv').config();
const express = require('express');
const cors = require('cors');
const {
  Symptoms,
  CommonDiseases,
  CommonSymptomsList,
  SymptomDescriptions,
  DiseaseDescriptions,
  analyzeSymptoms,
  modelLoadPromise,
} = require('./dataset-engine.js');
const {
  analyzeWithGemini,
  extractSymptomsWithGemini,
  isConfigured: isGeminiConfigured,
  DEFAULT_MODEL: GEMINI_DEFAULT_MODEL,
} = require('./gemini-engine.js');

const app = express();
const port = process.env.PORT || 3001;

// CORS — restrict to the frontend origin.
//
// Vite picks the next free port when 5173 is taken (5174, 5175, ...), so
// pinning a single port silently breaks every request with a CORS error.
// In development accept any localhost port; in production pin FRONTEND_URL.
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigin = process.env.FRONTEND_URL;
const LOCALHOST = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]):\d+$/;

app.use(cors({
  origin(origin, callback) {
    // Same-origin / curl / server-to-server requests send no Origin header.
    if (!origin) return callback(null, true);
    if (allowedOrigin && origin === allowedOrigin) return callback(null, true);
    if (!isProduction && LOCALHOST.test(origin)) return callback(null, true);
    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PATCH'],
}));
app.use(express.json());

// Simple rate limiting (max 100 requests per minute per IP)
const rateLimit = {};
app.use((req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  if (!rateLimit[ip]) rateLimit[ip] = [];
  rateLimit[ip] = rateLimit[ip].filter(t => now - t < 60000);
  if (rateLimit[ip].length >= 100) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
  rateLimit[ip].push(now);
  next();
});

app.get('/api/symptoms', (req, res) => {
  res.json(Symptoms);
});

app.get('/api/common-symptoms', (req, res) => {
  res.json(CommonSymptomsList);
});

app.get('/api/symptom-descriptions', (req, res) => {
  res.json(SymptomDescriptions);
});

app.get('/api/disease-descriptions', (req, res) => {
  res.json(DiseaseDescriptions);
});

// Which engines this server can serve, so the UI can show the active source.
app.get('/api/engines', (req, res) => {
  res.json({
    default: isGeminiConfigured() ? 'gemini' : 'ml',
    gemini: { available: isGeminiConfigured(), model: process.env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL },
    ml: { available: true },
  });
});

/* Spoken words -> symptoms from the real catalogue.

   Gemini does the mapping so everyday wording works ("my chest hurts",
   "throwing up"). When no key is set, or the call fails, a plain word-overlap
   match against the same catalogue answers instead, so dictation degrades
   rather than stopping. Either way the result only ever contains names that
   exist in Symptoms. */
const extractLocally = (transcript, canonical) => {
  const text = ` ${String(transcript).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ')} `;
  const STOP = new Set(['or', 'and', 'of', 'the', 'in', 'on', 'a', 'to', 'with']);

  const hits = [];
  for (const name of canonical) {
    const lower = name.toLowerCase();
    if (text.includes(` ${lower} `)) {
      hits.push({ name, score: lower.length + 100 });
      continue;
    }
    const words = lower.split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w));
    if (words.length === 0) continue;
    const matched = words.filter((w) => text.includes(` ${w} `) || text.includes(` ${w}s `));
    // Every significant word must be present, so "pain" alone cannot match
    // "Sharp Chest Pain".
    if (matched.length === words.length) {
      hits.push({ name, score: lower.length });
    }
  }

  // Prefer the most specific match and drop names contained in a better one.
  hits.sort((a, b) => b.score - a.score);
  const kept = [];
  for (const h of hits) {
    if (!kept.some((k) => k.toLowerCase().includes(h.name.toLowerCase()))) kept.push(h.name);
  }
  return kept.slice(0, 12);
};

app.post('/api/extract-symptoms', async (req, res) => {
  const { transcript } = req.body;
  if (typeof transcript !== 'string') {
    return res.status(400).json({ error: '"transcript" must be a string.' });
  }
  if (!transcript.trim()) return res.json({ symptoms: [], engine: 'none' });

  if (isGeminiConfigured()) {
    try {
      const symptoms = await extractSymptomsWithGemini(transcript, Symptoms);
      return res.json({ symptoms, engine: 'gemini' });
    } catch (error) {
      console.error('Gemini symptom extraction failed, matching locally:', error.message);
    }
  }

  return res.json({
    symptoms: extractLocally(transcript, Symptoms),
    engine: 'local',
  });
});

app.post('/api/analyze', async (req, res) => {
  const { symptoms, engine, details, triggers } = req.body;
  if (!symptoms || !Array.isArray(symptoms)) {
    return res.status(400).json({ error: 'Invalid request body. "symptoms" must be an array of strings.' });
  }

  /* Severity, duration, per-symptom notes and environmental factors go to
     Gemini only. The local model is a Naive Bayes over symptom presence that
     was trained without them, so it still receives names alone and its
     results are unchanged. Both fields are optional: a request without them
     produces exactly the prompt this endpoint has always sent. */
  const context = {
    details: Array.isArray(details) ? details : undefined,
    triggers: Array.isArray(triggers) ? triggers : undefined,
  };

  // Gemini is preferred when a key is present; 'ml' forces the local model.
  const wantGemini = engine ? engine === 'gemini' : isGeminiConfigured();

  if (wantGemini) {
    if (!isGeminiConfigured()) {
      return res.status(503).json({ error: 'Gemini requested but GEMINI_API_KEY is not set on the server.' });
    }
    try {
      const results = await analyzeWithGemini(symptoms, context);
      return res.json({ ...results, engine: 'gemini' });
    } catch (error) {
      console.error('Gemini analysis failed, falling back to local model:', error.message);
      try {
        const results = analyzeSymptoms(symptoms);
        return res.json({ ...results, engine: 'ml', fallbackReason: error.message });
      } catch (mlError) {
        console.error('Analysis error:', mlError);
        return res.status(500).json({ error: 'Failed to analyze symptoms. Please try again.' });
      }
    }
  }

  try {
    const results = analyzeSymptoms(symptoms);
    res.json({ ...results, engine: 'ml' });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze symptoms. Please try again.' });
  }
});

// --- DOCTOR & CONSULTATION REGISTRY ---
const doctorsRegistry = [
  {
    id: 'doc-1',
    name: 'Dr. Aris Thorne, MD',
    email: 'dr.thorne@mediscan.org',
    role: 'doctor',
    specialty: 'Pulmonologist / Respiratory Specialist',
    hospital: 'Apollo Institute of Chest Diseases',
    licenseNumber: 'MCI-PULM-88421',
    experienceYears: 14,
    rating: 4.9,
    bio: 'Senior Pulmonologist specializing in chronic obstructive pulmonary disease, asthma, and severe bronchial pathology.',
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  },
  {
    id: 'doc-2',
    name: 'Dr. Sarah Lin, MD, FACC',
    email: 'dr.lin@mediscan.org',
    role: 'doctor',
    specialty: 'Cardiologist',
    hospital: 'Fortis Memorial Heart Institute',
    licenseNumber: 'MCI-CARD-92144',
    experienceYears: 16,
    rating: 4.95,
    bio: 'Consultant Interventional Cardiologist specializing in ischemic heart diseases, arrhythmias, and hypertension management.',
    availableDays: ['Mon', 'Wed', 'Fri', 'Sat'],
  },
  {
    id: 'doc-3',
    name: 'Dr. Marcus Patel, MD, DM',
    email: 'dr.patel@mediscan.org',
    role: 'doctor',
    specialty: 'Neurologist',
    hospital: 'Max Super Speciality Neuro Centre',
    licenseNumber: 'MCI-NEUR-77312',
    experienceYears: 12,
    rating: 4.88,
    bio: 'Specialist in migraine syndromes, neuromuscular disorders, neuropathy, and cerebrovascular risk evaluation.',
    availableDays: ['Tue', 'Thu', 'Fri', 'Sat'],
  },
  {
    id: 'doc-4',
    name: 'Dr. Elena Gomez, MD',
    email: 'dr.gomez@mediscan.org',
    role: 'doctor',
    specialty: 'Dermatologist',
    hospital: 'Apex Clinical Dermatology Center',
    licenseNumber: 'MCI-DERM-65901',
    experienceYears: 9,
    rating: 4.85,
    bio: 'Expert in allergic dermatoses, eczema, psoriasis, autoimmune cutaneous presentations, and systemic manifestations.',
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu'],
  },
  {
    id: 'doc-5',
    name: 'Dr. Vikram Sen, MD, DM',
    email: 'dr.sen@mediscan.org',
    role: 'doctor',
    specialty: 'Gastroenterologist',
    hospital: 'Medanta Digestive Health Institute',
    licenseNumber: 'MCI-GAST-54320',
    experienceYears: 15,
    rating: 4.92,
    bio: 'Senior Gastroenterologist and Hepatologist focusing on peptic conditions, inflammatory bowel syndromes, and biliary health.',
    availableDays: ['Mon', 'Wed', 'Thu', 'Sat'],
  },
  {
    id: 'doc-6',
    name: 'Dr. Priya Sharma, MBBS, MD',
    email: 'dr.sharma@mediscan.org',
    role: 'doctor',
    specialty: 'General Physician / Internist',
    hospital: 'City Central Healthcare Hospital',
    licenseNumber: 'MCI-GENM-31980',
    experienceYears: 11,
    rating: 4.8,
    bio: 'Broad-spectrum Internal Medicine specialist focusing on multi-system illness, metabolic disorders, and primary clinical triage.',
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  },
];

let consultationsStore = [];

app.get('/api/doctors', (req, res) => {
  const { specialty } = req.query;
  if (specialty) {
    const filtered = doctorsRegistry.filter(d =>
      d.specialty.toLowerCase().includes(specialty.toLowerCase())
    );
    return res.json(filtered);
  }
  res.json(doctorsRegistry);
});

app.get('/api/consultations', (req, res) => {
  const { doctorId, patientId } = req.query;
  let results = consultationsStore;
  if (doctorId) {
    results = results.filter(c => c.doctorId === doctorId);
  }
  if (patientId) {
    results = results.filter(c => c.patientId === patientId);
  }
  res.json(results);
});

app.post('/api/consultations', (req, res) => {
  const consultation = req.body;
  if (!consultation || !consultation.doctorId || !consultation.patientId) {
    return res.status(400).json({ error: 'Missing required consultation fields.' });
  }
  const newRecord = {
    ...consultation,
    id: consultation.id || `cons-${Date.now()}`,
    status: consultation.status || 'pending',
    date: consultation.date || new Date().toISOString(),
  };
  consultationsStore.unshift(newRecord);
  res.status(201).json(newRecord);
});

app.patch('/api/consultations/:id/review', (req, res) => {
  const { id } = req.params;
  const { doctorNotes, prescriptions } = req.body;
  const index = consultationsStore.findIndex(c => c.id === id);
  if (index === -1) {
    // If not in in-memory store yet, create or acknowledge
    const created = {
      id,
      status: 'reviewed',
      doctorNotes,
      prescriptions,
      reviewedAt: new Date().toISOString(),
    };
    consultationsStore.unshift(created);
    return res.json(created);
  }
  consultationsStore[index] = {
    ...consultationsStore[index],
    status: 'reviewed',
    doctorNotes: doctorNotes || consultationsStore[index].doctorNotes,
    prescriptions: prescriptions || consultationsStore[index].prescriptions,
    reviewedAt: new Date().toISOString(),
  };
  res.json(consultationsStore[index]);
});

// Wait for the ML model to load before accepting requests
modelLoadPromise.then(() => {
  app.listen(port, () => {
    console.log(`🚀 MediScan backend listening at http://localhost:${port}`);
    if (isGeminiConfigured()) {
      console.log(`   Analysis engine: Gemini (${process.env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL}) — local ML model is the fallback`);
    } else {
      console.log(`   Analysis engine: local ML Bayesian inference (773 diseases, 377 symptoms)`);
      console.log(`   Set GEMINI_API_KEY in backend/.env to use Gemini instead.`);
    }
  });
}).catch(err => {
  console.error('Failed to start server — model could not be loaded:', err);
  process.exit(1);
});
