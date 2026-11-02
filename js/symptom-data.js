// Symptom data and condition matching logic
const availableSymptoms = [
    { id: 'headache-1', name: 'Headache', bodyArea: 'Head' },
    { id: 'sore-throat-1', name: 'Sore Throat', bodyArea: 'Throat' },
    { id: 'cough-1', name: 'Cough', bodyArea: 'Chest' },
    { id: 'fever-1', name: 'Fever', bodyArea: 'Whole body' },
    { id: 'runny-nose-1', name: 'Runny Nose', bodyArea: 'Nose' },
    { id: 'stomach-pain-1', name: 'Stomach Pain', bodyArea: 'Abdomen' },
    { id: 'nausea-1', name: 'Nausea', bodyArea: 'Stomach' },
    { id: 'vomiting-1', name: 'Vomiting', bodyArea: 'Stomach' },
    { id: 'diarrhea-1', name: 'Diarrhea', bodyArea: 'Digestive' },
    { id: 'fatigue-1', name: 'Fatigue', bodyArea: 'Whole body' },
    { id: 'dizziness-1', name: 'Dizziness', bodyArea: 'Head' },
    { id: 'chest-pain-1', name: 'Chest Pain', bodyArea: 'Chest' },
    { id: 'shortness-of-breath-1', name: 'Shortness of Breath', bodyArea: 'Chest' },
    { id: 'muscle-ache-1', name: 'Muscle Ache', bodyArea: 'Muscles' },
    { id: 'joint-pain-1', name: 'Joint Pain', bodyArea: 'Joints' }
];

// Mock conditions database
const mockConditions = {
    'headache': [
        {
            id: '1',
            name: 'Tension Headache',
            probability: 0.75,
            description: 'A common headache characterized by mild to moderate pain that feels like pressure around the head.',
            nextSteps: ['Rest in a quiet, dark room', 'Over-the-counter pain relievers', 'Stay hydrated', 'Apply a warm compress'],
            urgency: 'low'
        },
        {
            id: '2',
            name: 'Migraine',
            probability: 0.45,
            description: 'A neurological condition that can cause multiple symptoms including throbbing headaches, nausea, and sensitivity to light and sound.',
            nextSteps: ['Rest in a dark, quiet room', 'Apply cold compresses', 'Over-the-counter migraine medication', 'Consult a doctor if severe'],
            urgency: 'medium'
        }
    ],
    'fever': [
        {
            id: '3',
            name: 'Common Cold',
            probability: 0.65,
            description: 'A viral infection of the upper respiratory tract that can cause fever, congestion, and cough.',
            nextSteps: ['Rest', 'Stay hydrated', 'Over-the-counter fever reducers', 'Monitor symptoms'],
            urgency: 'low'
        },
        {
            id: '4',
            name: 'Influenza',
            probability: 0.40,
            description: 'A viral infection that attacks your respiratory system — your nose, throat, and lungs.',
            nextSteps: ['Rest', 'Stay hydrated', 'Antiviral medications if within 48 hours', 'Consult a doctor if symptoms worsen'],
            urgency: 'medium'
        }
    ],
    'cough': [
        {
            id: '5',
            name: 'Bronchitis',
            probability: 0.55,
            description: 'Inflammation of the bronchial tubes, which carry air to your lungs.',
            nextSteps: ['Rest', 'Stay hydrated', 'Use a humidifier', 'Consult a doctor for persistent cough'],
            urgency: 'medium'
        }
    ],
    'chest-pain': [
        {
            id: '6',
            name: 'Possible Heart Attack',
            probability: 0.50,
            description: 'A serious medical emergency where blood flow to the heart is blocked.',
            nextSteps: ['Call emergency services immediately', 'Chew aspirin if advised by emergency services', 'Rest and wait for help'],
            urgency: 'emergency'
        }
    ],
    'sore-throat': [
        {
            id: '7',
            name: 'Viral Pharyngitis',
            probability: 0.70,
            description: 'Inflammation of the throat caused by a viral infection.',
            nextSteps: ['Rest', 'Stay hydrated', 'Gargle with salt water', 'Over-the-counter pain relievers'],
            urgency: 'low'
        }
    ],
    'stomach-pain': [
        {
            id: '8',
            name: 'Gastritis',
            probability: 0.60,
            description: 'Inflammation of the stomach lining that can cause pain and discomfort.',
            nextSteps: ['Avoid spicy foods', 'Eat smaller meals', 'Over-the-counter antacids', 'Consult a doctor if persistent'],
            urgency: 'medium'
        }
    ]
};

// Group symptoms by body area
function groupSymptomsByBodyArea(symptoms) {
    return symptoms.reduce((acc, symptom) => {
        if (!acc[symptom.bodyArea]) {
            acc[symptom.bodyArea] = [];
        }
        acc[symptom.bodyArea].push(symptom);
        return acc;
    }, {});
}

// Analyze symptoms and return possible conditions
function analyzeSymptoms(selectedSymptoms) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const results = [];
            
            selectedSymptoms.forEach(symptom => {
                const symptomKey = symptom.id.split('-')[0];
                if (mockConditions[symptomKey]) {
                    mockConditions[symptomKey].forEach(condition => {
                        if (!results.find(r => r.id === condition.id)) {
                            results.push({...condition});
                        }
                    });
                }
            });
            
            // Sort by probability
            results.sort((a, b) => b.probability - a.probability);
            
            resolve(results);
        }, 1500); // Simulate API call delay
    });
}

// Export for use in other scripts
window.symptomData = {
    availableSymptoms,
    groupSymptomsByBodyArea,
    analyzeSymptoms
};