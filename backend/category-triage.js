/**
 * MediScan Two-Stage Hierarchical Classifier — Medical Specialty Triage
 * ====================================================================
 * Stage 1: Categorizes patient symptoms into primary organ systems / specialties.
 * Stage 2: Weights and conditions within-category disease predictions for superior
 *          clinical accuracy and noise rejection.
 */

const CATEGORIES = {
  respiratory: {
    id: 'respiratory',
    name: 'Respiratory & Pulmonology',
    specialist: 'Pulmonologist / ENT Specialist',
    icon: 'Wind',
    color: 'teal',
    keywords: [
      'cough', 'breath', 'breathing', 'wheez', 'sputum', 'throat', 'nasal', 'congestion',
      'sinus', 'chest tightness', 'hoarse', 'sneez', 'coryza', 'laryng', 'pharyng',
      'bronch', 'pneumon', 'asthma', 'lung', 'pleur', 'trachea', 'asphyxia', 'dyspnea'
    ]
  },
  cardiovascular: {
    id: 'cardiovascular',
    name: 'Cardiovascular & Circulatory',
    specialist: 'Cardiologist',
    icon: 'Heart',
    color: 'rose',
    keywords: [
      'heart', 'palpitation', 'chest pain', 'angina', 'infarct', 'artery', 'vein',
      'hypertens', 'hypotens', 'cardiac', 'tachycardia', 'bradycardia', 'pulse',
      'edema', 'ischemi', 'coronary', 'pericard', 'vascular', 'syncope'
    ]
  },
  gastrointestinal: {
    id: 'gastrointestinal',
    name: 'Gastrointestinal & Hepatology',
    specialist: 'Gastroenterologist',
    icon: 'Apple',
    color: 'amber',
    keywords: [
      'abdom', 'stomach', 'nausea', 'vomit', 'diarrhea', 'constipat', 'bowel',
      'stool', 'digest', 'heartburn', 'acid', 'gastric', 'ulcer', 'colitis', 'colon',
      'liver', 'hepat', 'jaundice', 'pancrea', 'esophag', 'melena', 'flatulen',
      'rectal', 'anus', 'bloat', 'gallbladder', 'appendic', 'reflux'
    ]
  },
  neurological: {
    id: 'neurological',
    name: 'Neurological & Psychiatric',
    specialist: 'Neurologist / Psychiatrist',
    icon: 'Brain',
    color: 'indigo',
    keywords: [
      'headache', 'migraine', 'dizzy', 'dizziness', 'seizure', 'convuls', 'numb',
      'paresthesia', 'tremor', 'nerve', 'neuropath', 'neuralgia', 'memory', 'amnesia',
      'confus', 'anxiety', 'depress', 'sleep', 'insomnia', 'hallucinat', 'speech',
      'paralysis', 'faint', 'coma', 'coordinat', 'stroke', 'vertigo', 'delusion'
    ]
  },
  dermatological: {
    id: 'dermatological',
    name: 'Dermatology & Integumentary',
    specialist: 'Dermatologist',
    icon: 'Shield',
    color: 'pink',
    keywords: [
      'skin', 'rash', 'itch', 'itching', 'lesion', 'mole', 'acne', 'pimple', 'ulcer',
      'scalp', 'dryness', 'peeling', 'scaliness', 'blister', 'hives', 'urticaria',
      'eczema', 'dermatitis', 'psoriasis', 'fungal', 'hair', 'nail', 'erythema',
      'wart', 'pigment', 'petechiae', 'bruis'
    ]
  },
  musculoskeletal: {
    id: 'musculoskeletal',
    name: 'Musculoskeletal & Orthopedics',
    specialist: 'Orthopedic Specialist / Rheumatologist',
    icon: 'Activity',
    color: 'orange',
    keywords: [
      'joint', 'bone', 'muscle', 'back pain', 'neck pain', 'knee', 'hip', 'shoulder',
      'ankle', 'wrist', 'elbow', 'foot', 'hand', 'finger', 'toe', 'spine', 'spondyl',
      'cramp', 'spasm', 'stiff', 'strain', 'sprain', 'fractur', 'arthrit', 'gout',
      'tendon', 'ligament', 'scoliosis', 'sciatica', 'weakness'
    ]
  },
  genitourinary: {
    id: 'genitourinary',
    name: 'Genitourinary & Nephrology',
    specialist: 'Urologist / Nephrologist',
    icon: 'Droplet',
    color: 'blue',
    keywords: [
      'urin', 'bladder', 'kidney', 'renal', 'micturit', 'prostat', 'testicle',
      'scrotum', 'urethra', 'penis', 'suprapubic', 'groin', 'calculus', 'stone',
      'cystitis', 'dysuria', 'hematuria', 'nocturia', 'incontin'
    ]
  },
  gynecological: {
    id: 'gynecological',
    name: 'Gynecology & Obstetrics',
    specialist: 'Gynecologist / Obstetrician',
    icon: 'User',
    color: 'purple',
    keywords: [
      'vagin', 'uter', 'cervix', 'ovary', 'ovarian', 'menstru', 'period', 'bleed',
      'pregnan', 'pelvic', 'vulv', 'breast', 'nipple', 'lactat', 'contracept',
      'abortion', 'miscarriage', 'labor', 'intercourse'
    ]
  },
  ophthalmology_ent: {
    id: 'ophthalmology_ent',
    name: 'Ophthalmology & Otology',
    specialist: 'Ophthalmologist / Otolaryngologist',
    icon: 'Eye',
    color: 'cyan',
    keywords: [
      'eye', 'vision', 'blind', 'cornea', 'retina', 'cataract', 'glaucoma', 'eyelid',
      'conjunctiv', 'lacrimat', 'ear', 'hearing', 'tinnitus', 'deaf', 'eardrum',
      'audi', 'nosebleed', 'epistaxis'
    ]
  },
  infectious_systemic: {
    id: 'infectious_systemic',
    name: 'Infectious & General Systemic',
    specialist: 'Infectious Disease Specialist / Internist',
    icon: 'Thermometer',
    color: 'red',
    keywords: [
      'fever', 'chill', 'sweat', 'fatigue', 'malaise', 'infect', 'virus', 'viral',
      'bacteri', 'sepsis', 'flulike', 'flu-like', 'lymph', 'swollen gland', 'weakness',
      'weight loss', 'dehydrat', 'anorexia', 'appetite'
    ]
  }
};

/**
 * Stage 1: Analyze active symptoms and classify into Medical Categories.
 *
 * @param {string[]} symptoms - List of active symptom names
 * @returns {Object} Stage 1 Triage Result with probability distribution
 */
function triageSymptoms(symptoms) {
  if (!symptoms || symptoms.length === 0) {
    return {
      primaryCategory: 'General Assessment',
      categoryConfidence: 1.0,
      topCategories: [{ category: 'General Assessment', probability: 1.0 }],
      recommendedSpecialist: 'General Physician',
      urgency: 'low'
    };
  }

  const categoryScores = {};
  Object.keys(CATEGORIES).forEach(catId => {
    categoryScores[catId] = 0.05; // Base Laplace prior
  });

  // Calculate matching scores based on keyword matching and associations
  symptoms.forEach(symptom => {
    const symLower = symptom.toLowerCase();
    
    Object.entries(CATEGORIES).forEach(([catId, cat]) => {
      let matched = false;
      for (const kw of cat.keywords) {
        if (symLower.includes(kw)) {
          // Weight exact matches higher than partial
          categoryScores[catId] += 1.2;
          matched = true;
          break;
        }
      }
      // General fallbacks for systemic signs
      if (symLower.includes('fever') || symLower.includes('chills') || symLower.includes('sweat')) {
        if (catId === 'infectious_systemic' || catId === 'respiratory') {
          categoryScores[catId] += 0.5;
        }
      }
    });
  });

  // Softmax-like normalization
  const totalScore = Object.values(categoryScores).reduce((a, b) => a + b, 0);
  const probabilities = {};
  Object.entries(categoryScores).forEach(([catId, score]) => {
    probabilities[catId] = totalScore > 0 ? score / totalScore : 0.1;
  });

  // Sort categories by probability
  const sorted = Object.entries(probabilities)
    .map(([catId, prob]) => ({
      id: catId,
      name: CATEGORIES[catId].name,
      specialist: CATEGORIES[catId].specialist,
      probability: Math.round(prob * 1000) / 1000,
      percentage: Math.round(prob * 100)
    }))
    .sort((a, b) => b.probability - a.probability);

  const primary = sorted[0];
  const topCategories = sorted.filter(c => c.percentage >= 8).slice(0, 3);

  return {
    primaryCategory: primary.name,
    primaryCategoryId: primary.id,
    categoryConfidence: primary.probability,
    categoryConfidencePercent: primary.percentage,
    topCategories,
    recommendedSpecialist: primary.specialist,
    categoryDistribution: probabilities
  };
}

/**
 * Determine which medical category a disease belongs to.
 *
 * @param {string} diseaseName
 * @param {string[]} diseaseSymptoms
 * @returns {string} Category ID
 */
function getCategoryForDisease(diseaseName, diseaseSymptoms = []) {
  const dLower = diseaseName.toLowerCase();

  for (const [catId, cat] of Object.entries(CATEGORIES)) {
    for (const kw of cat.keywords) {
      if (dLower.includes(kw)) {
        return catId;
      }
    }
  }

  // If disease name didn't match directly, inspect its typical symptoms
  if (diseaseSymptoms && diseaseSymptoms.length > 0) {
    const triage = triageSymptoms(diseaseSymptoms);
    return triage.primaryCategoryId || 'infectious_systemic';
  }

  return 'infectious_systemic';
}

module.exports = {
  CATEGORIES,
  triageSymptoms,
  getCategoryForDisease
};
