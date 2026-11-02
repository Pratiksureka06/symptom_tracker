// Translation system for multilingual support
const translations = {
    en: {
        appName: 'MediScan',
        homepageTitle: 'AI-Powered Symptom Checker',
        startButton: 'Start Symptom Check',
        selectSymptoms: 'Select Your Symptoms',
        voiceInput: 'Voice Input',
        continueButton: 'Continue',
        results: 'Results',
        possibleConditions: 'Possible Conditions',
        nextSteps: 'Recommended Next Steps',
        history: 'History',
        home: 'Home',
        disclaimer: 'Disclaimer: This is not a medical diagnosis. Always consult with a healthcare professional.'
    },
    es: {
        appName: 'MediScan',
        homepageTitle: 'Verificador de síntomas con IA',
        startButton: 'Iniciar verificación de síntomas',
        selectSymptoms: 'Seleccione sus síntomas',
        voiceInput: 'Entrada de voz',
        continueButton: 'Continuar',
        results: 'Resultados',
        possibleConditions: 'Condiciones posibles',
        nextSteps: 'Próximos pasos recomendados',
        history: 'Historial',
        home: 'Inicio',
        disclaimer: 'Descargo de responsabilidad: Esto no es un diagnóstico médico. Consulte siempre con un profesional de la salud.'
    },
    fr: {
        appName: 'MediScan',
        homepageTitle: 'Vérificateur de symptômes alimenté par l\'IA',
        startButton: 'Commencer la vérification des symptômes',
        selectSymptoms: 'Sélectionnez vos symptômes',
        voiceInput: 'Entrée vocale',
        continueButton: 'Continuer',
        results: 'Résultats',
        possibleConditions: 'Conditions possibles',
        nextSteps: 'Prochaines étapes recommandées',
        history: 'Historique',
        home: 'Accueil',
        disclaimer: 'Avertissement : Ceci n\'est pas un diagnostic médical. Consultez toujours un professionnel de la santé.'
    },
    de: {
        appName: 'MediScan',
        homepageTitle: 'KI-gestützter Symptom-Checker',
        startButton: 'Symptomprüfung starten',
        selectSymptoms: 'Wählen Sie Ihre Symptome',
        voiceInput: 'Spracheingabe',
        continueButton: 'Fortfahren',
        results: 'Ergebnisse',
        possibleConditions: 'Mögliche Bedingungen',
        nextSteps: 'Empfohlene nächste Schritte',
        history: 'Verlauf',
        home: 'Startseite',
        disclaimer: 'Haftungsausschluss: Dies ist keine medizinische Diagnose. Konsultieren Sie immer einen Arzt.'
    },
    zh: {
        appName: 'MediScan',
        homepageTitle: '人工智能症状检查器',
        startButton: '开始症状检查',
        selectSymptoms: '选择您的症状',
        voiceInput: '语音输入',
        continueButton: '继续',
        results: '结果',
        possibleConditions: '可能的情况',
        nextSteps: '建议的后续步骤',
        history: '历史',
        home: '首页',
        disclaimer: '免责声明：这不是医疗诊断。始终咨询医疗专业人员。'
    },
    hi: {
        appName: 'MediScan',
        homepageTitle: 'एआई-संचालित लक्षण जांचकर्ता',
        startButton: 'लक्षण जांच शुरू करें',
        selectSymptoms: 'अपने लक्षण चुनें',
        voiceInput: 'आवाज़ इनपुट',
        continueButton: 'जारी रखें',
        results: 'परिणाम',
        possibleConditions: 'संभावित स्थितियां',
        nextSteps: 'अनुशंसित अगले कदम',
        history: 'इतिहास',
        home: 'घर',
        disclaimer: 'अस्वीकरण: यह चिकित्सीय निदान नहीं है। हमेशा स्वास्थ्य देखभाल पेशेवर से परामर्श करें।'
    },
    ar: {
        appName: 'MediScan',
        homepageTitle: 'فاحص الأعراض المدعوم بالذكاء الاصطناعي',
        startButton: 'بدء فحص الأعراض',
        selectSymptoms: 'حدد الأعراض الخاصة بك',
        voiceInput: 'إدخال صوتي',
        continueButton: 'متابعة',
        results: 'النتائج',
        possibleConditions: 'الحالات المحتملة',
        nextSteps: 'الخطوات التالية الموصى بها',
        history: 'التاريخ',
        home: 'الرئيسية',
        disclaimer: 'إخلاء المسؤولية: هذا ليس تشخيصًا طبيًا. استشر دائمًا أخصائي الرعاية الصحية.'
    }
};

const languageNames = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    zh: '中文',
    hi: 'हिन्दी',
    ar: 'العربية'
};

let currentLanguage = 'en';

function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('selectedLanguage', lang);
    updateTranslations();
    updateCurrentLanguageDisplay();
}

function updateTranslations() {
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }
    });
}

function updateCurrentLanguageDisplay() {
    const currentLangElement = document.getElementById('current-language');
    if (currentLangElement) {
        currentLangElement.textContent = languageNames[currentLanguage];
    }
}

function initializeLanguage() {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage && translations[savedLanguage]) {
        currentLanguage = savedLanguage;
    }
    updateTranslations();
    updateCurrentLanguageDisplay();
}

// Export for use in other scripts
window.translations = {
    setLanguage,
    getCurrentLanguage: () => currentLanguage,
    getTranslation: (key) => translations[currentLanguage]?.[key] || key,
    initializeLanguage
};