# MediScan

A two-stage clinical triage and differential diagnosis system.

You describe what you are feeling. MediScan tells you **which kind of doctor to see**, and gives you **a ranked list of conditions that fit**, each with an urgency level and next steps.

> **This is a student project for education and decision support. It is not a certified medical device, it has not been clinically validated, and it must not be used to make treatment decisions.**

Built as Project-Based Learning coursework (CCE2170), Manipal University Jaipur.

---

## Running it

You need **Node.js 18+** and a **Google Gemini API key**.

```bash
# 1. install
npm install
cd backend && npm install && cd ..

# 2. configure the backend
cp backend/.env.example backend/.env
#    then open backend/.env and set GEMINI_API_KEY

# 3. run — two terminals
cd backend && npm start     # API on http://localhost:3001
npm run dev                 # app on http://localhost:5173
```

Open **http://localhost:5173**.

Start the backend first — the frontend reads `VITE_API_URL` from `.env` and expects it on port 3001. Without a Gemini key the app still runs; it falls back to the local model and says so on screen.

| Command | What it does |
|---|---|
| `npm run dev` | Frontend dev server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | ESLint |
| `cd backend && npm start` | API server |

---

## How it works

### Two stages

**Stage 1 — organ-system triage.** Your symptoms are matched against signatures for ten body systems (respiratory, cardiovascular, gastrointestinal, neurological, dermatological, musculoskeletal, genitourinary, gynaecological, eye/ENT, infectious). This gives the body system, a confidence, and **which specialist to see**.

**Stage 2 — disease scoring.** Every condition is scored on how much of its usual symptom picture you match, weighted by symptom importance and adjusted for how common it is. That score is then modulated by the Stage 1 result, so a condition from an unlikely body system is pushed down.

### Two engines

| Engine | Role |
|---|---|
| **Google Gemini** | Primary. Constrained by a fixed JSON schema: exactly 5 conditions, only the 10 categories, only the 4 urgency levels. The backend clamps every probability to 1–99% and re-normalises if the total drifts outside 0.75–1.25. |
| **Local model** | Offline fallback. Scores from exported JSON, no Python at runtime. |

Transient failures (429, 500, 502, 503, 504, timeout) retry across a chain of models. A permanent failure (404) stops immediately. If every model fails, the local engine answers **and the interface says which engine produced the result and why**.

### The model

A Random Forest was trained offline on an augmented disease–symptom corpus, then its learned knowledge was exported to JSON rather than pickling the model:

| | |
|---|---|
| Records | 246,964 (197,571 train / 49,393 test, stratified) |
| Classes | 773 conditions |
| Features | 377 symptoms, binary |
| Top-1 accuracy | 65.81% |
| Macro F1 | 0.7033 |
| Weighted F1 | 0.7112 |

`backend/ml/output/` holds the four artifacts the server reads at startup: the conditional probability matrix, the label mapping, the symptom list and the evaluation metadata. Retraining needs the source dataset and `backend/ml/train_model.py`; the dataset is not in this repository because of its size.

---

## Honest limitations

- **The local model's numbers are not calibrated.** Each condition is scored independently and clamped at 99%, so several can report high values and the set does not sum to 1. They are a *match strength*, not a probability. This is why Gemini is the primary engine, and it is the main finding of the project.
- **Severity, duration and environmental triggers reach Gemini only.** The local model was trained on symptom presence alone and has no slot for them.
- **Age, sex, comorbidity and medication history are collected but used by neither engine.**
- **The training data is an augmented corpus** derived from published symptom–disease associations, not real patient records, so the priors reflect how the dataset was built rather than real-world prevalence.
- **The primary path needs network access.** It degrades to the local model and discloses this.

---

## Layout

```
backend/
  server.js            Express API
  dataset-engine.js    local scoring (the engine actually used)
  gemini-engine.js     Gemini calls, schema, retry chain
  category-triage.js   Stage 1, the ten body systems
  ml/output/           exported model artifacts
  ml/train_model.py    offline training
src/
  pages/               11 routes
  components/
  contexts/            symptoms, auth, medication, toasts
  services/            voice input
```

Frontend: React 18, TypeScript, Vite, Tailwind CSS. Backend: Node.js, Express 5.

---

## Notes

`backend/.env` is gitignored and must never be committed — the Gemini key belongs on the server only, never in frontend code, where it would ship to every visitor.

Symptom history and medication records are stored per user in the browser's own storage. Nothing is sent anywhere except the symptom analysis request.
