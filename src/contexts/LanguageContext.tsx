import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Available languages
export type Language = 'en' | 'hi' | 'bn' | 'te' | 'mr' | 'ta' | 'gu' | 'kn' | 'ml' | 'pa' | 'as' | 'or';

// Translation dictionary type
type Translations = {
  [key: string]: {
    [key in Language]: string;
  };
};

// Translations for the app
const translations: Translations = {
  appName: {
    en: 'MediScan',
    hi: 'मेडिस्कैन',
    bn: 'মেডিস্ক্যান',
    te: 'మెడిస్కాన్',
    mr: 'मेडिस्कॅन',
    ta: 'மெடிஸ்கான்',
    gu: 'મેડિસ્કેન',
    kn: 'ಮೆಡಿಸ್ಕ್ಯಾನ್',
    ml: 'മെഡിസ്കാൻ',
    pa: 'ਮੈਡੀਸਕੈਨ',
    as: 'মেഡിѕস্কেন',
    or: 'ମେଡିସ୍କାନ'
  },
  homepageTitle: {
    en: 'AI-Powered Symptom Checker',
    hi: 'एआई-संचालित लक्षण जांचकर्ता',
    bn: 'এআই-চালিত লক্ষণ পরীক্ষক',
    te: 'AI- శక్తితో పనిచేసే లక్షణాల తనిఖీ',
    mr: 'एआय-समर्थित लक्षण तपासक',
    ta: 'AI- శక్తితో పనిచేసే அறிகுறிகள் சரிபார்ப்பு',
    gu: 'એઆઈ-સંચાલિત લક્ષણ તપાસનાર',
    kn: 'ಎಐ-ಚಾಲಿತ ಲಕ್ಷಣ ಪರೀಕ್ಷಕ',
    ml: 'എഐ-പവർഡ് ലക്ഷണ പരിശോധകൻ',
    pa: 'ਏਆਈ-ਸੰਚਾਲਿਤ ਲੱਛਣ ਜਾਂਚਕਰਤਾ',
    as: 'এআই-চালিত লক্ষণ পৰীক্ষক',
    or: 'ଏଆଇ-ଚାଳିତ ଲକ୍ଷଣ ପରୀକ୍ଷକ'
  },
  startButton: {
    en: 'Start Symptom Check',
    hi: 'लक्षण जांच शुरू करें',
    bn: 'লক্ষণ পরীক্ষা শুরু করুন',
    te: 'లక్షణాల తనిఖీని ప్రారంభించండి',
    mr: 'लक्षण तपासणी सुरू करा',
    ta: 'அறிகுறி சரிபார்ப்பைத் தொடங்கவும்',
    gu: 'લક્ષણ તપાસ શરૂ કરો',
    kn: 'ಲಕ್ಷಣ ಪರೀಕ್ಷೆಯನ್ನು ಪ್ರಾರಂಭಿಸಿ',
    ml: 'ലക്ഷണ പരിശോധന ആരംഭിക്കുക',
    pa: 'ਲੱਛਣ ਜਾਂਚ ਸ਼ੁਰੂ ਕਰੋ',
    as: 'ৰোগৰ লক্ষণ পৰীক্ষা আৰম্ভ কৰক',
    or: 'ଲକ୍ଷଣ ଯାଞ୍ଚ ଆରମ୍ଭ କରନ୍ତୁ'
  },
  selectSymptoms: {
    en: 'Select Your Symptoms',
    hi: 'अपने लक्षण चुनें',
    bn: 'আপনার লক্ষণগুলি নির্বাচন করুন',
    te: 'మీ లక్షణాలను ఎంచుకోండి',
    mr: 'तुमची लक्षणे निवडा',
    ta: 'உங்கள் அறிகுறிகளைத் தேர்ந்தெடுக்கவும்',
    gu: 'તમારા લક્ષણો પસંદ કરો',
    kn: 'ನಿಮ್ಮ ಲಕ್ಷಣಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    ml: 'നിങ്ങളുടെ ലക്ഷണങ്ങൾ തിരഞ്ഞെടുക്കുക',
    pa: 'ਆਪਣੇ ਲੱਛਣ ਚੁਣੋ',
    as: 'আপোনাৰ লক্ষণসমূহ বাছনি কৰক',
    or: 'ଆପଣଙ୍କର ଲକ୍ଷଣଗୁଡିକ ଚୟନ କରନ୍ତୁ'
  },
  voiceInput: {
    en: 'Voice Input',
    hi: 'आवाज़ इनपुट',
    bn: 'ভয়েস ইনপুট',
    te: 'వాయిస్ ఇన్పుట్',
    mr: 'व्हॉइस इनपुट',
    ta: 'குரல் உள்ளீடு',
    gu: 'વૉઇસ ઇનપુટ',
    kn: 'ಧ್ವನಿ ಇನ್ಪುಟ್',
    ml: 'വോയിസ് ഇൻപുട്ട്',
    pa: 'ਵੌਇਸ ਇਨਪੁਟ',
    as: 'ድምጽ ইনপুট',
    or: 'ଭଏସ୍ ଇନପୁଟ୍'
  },
  continueButton: {
    en: 'Continue',
    hi: 'जारी रखें',
    bn: 'চালিয়ে যান',
    te: 'కొనసాగించు',
    mr: 'सुरू',
    ta: 'தொடரவும்',
    gu: 'ચાલુ રાખો',
    kn: 'ಮುಂದುವರಿಸಿ',
    ml: 'തുടരുക',
    pa: 'ਜਾਰੀ ਰੱਖੋ',
    as: 'অব্যাহত ৰাখক',
    or: 'ଜାରି ରଖନ୍ତୁ'
  },
  results: {
    en: 'Results',
    hi: 'परिणाम',
    bn: 'ফলাফল',
    te: 'ఫలితాలు',
    mr: 'निकाल',
    ta: 'முடிவுகள்',
    gu: 'પરિણામો',
    kn: 'ಫಲಿತಾಂಶಗಳು',
    ml: 'ഫലങ്ങൾ',
    pa: 'ਨਤੀਜੇ',
    as: 'ফলাফল',
    or: 'ଫଳାଫଳ'
  },
  possibleConditions: {
    en: 'Possible Conditions',
    hi: 'संभावित स्थितियां',
    bn: 'সম্ভাব্য শর্তাবলী',
    te: 'సాధ్యమయ్యే పరిస్థితులు',
    mr: 'संभाव्य परिस्थिती',
    ta: 'சாத்தியமான நிபந்தனைகள்',
    gu: 'શક્ય પરિસ્થિતિઓ',
    kn: 'ಸಂಭವನೀಯ ಪರಿಸ್ಥಿತಿಗಳು',
    ml: 'സാധ്യമായ അവസ്ഥകൾ',
    pa: 'ਸੰਭਾਵਿਤ ਸਥਿਤੀਆਂ',
    as: 'সম্ভাব্য চৰ্তসমূহ',
    or: 'ସମ୍ଭାବ୍ୟ ସର୍ତ୍ତଗୁଡିକ'
  },
  nextSteps: {
    en: 'Recommended Next Steps',
    hi: 'अनुशंसित अगले कदम',
    bn: 'প্রস্তাবিত পরবর্তী পদক্ষেপ',
    te: 'సిఫార్సు చేయబడిన తదుపరి దశలు',
    mr: 'शिफारस केलेले पुढील चरण',
    ta: 'பரிந்துரைக்கப்பட்ட அடுத்த படிகள்',
    gu: 'ભલામણ કરેલ આગલા પગલાં',
    kn: 'ಶಿಫಾರಸು ಮಾಡಲಾದ ಮುಂದಿನ ಹಂತಗಳು',
    ml: 'ശുപാർശ ചെയ്യുന്ന അടുത്ത ഘട്ടങ്ങൾ',
    pa: 'ਸਿਫਾਰਸ਼ ਕੀਤੇ ਅਗਲੇ ਕਦਮ',
    as: 'পৰামৰ্শিত পৰৱৰ্তী পদক্ষেপসমূহ',
    or: 'ସୁପାରିଶ କରାଯାଇଥିବା ପରବର୍ତ୍ତୀ ପଦକ୍ଷେପଗୁଡିକ'
  },
  history: {
    en: 'History',
    hi: 'इतिहास',
    bn: 'ইতিহাস',
    te: 'చరిత్ర',
    mr: 'इतिहास',
    ta: 'வரலாறு',
    gu: 'ઇતિહાસ',
    kn: 'ಇತಿಹಾಸ',
    ml: 'ചരിത്രം',
    pa: 'ਇਤਿਹਾਸ',
    as: 'ইতিহাস',
    or: 'ଇତିହାସ'
  },
  disclaimer: {
    en: 'Disclaimer: This is not a medical diagnosis. Always consult with a healthcare professional.',
    hi: 'अस्वीकरण: यह चिकित्सीय निदान नहीं है। हमेशा स्वास्थ्य देखभाल पेशेवर से परामर्श करें।',
    bn: 'দাবিত্যাগ: এটি একটি মেডিকেল নির্ণয় নয়। সর্বদা একজন স্বাস্থ্যসেবা পেশাদারের সাথে পরামর্শ করুন।',
    te: 'నిరాకరణ: ఇది వైద్య నిర్ధారణ కాదు. ఎల్లప్పుడూ ఆరోగ్య సంరక్షణ నిపుణులను సంప్రదించండి।',
    mr: 'अस्वीकरण: हे वैद्यकीय निदान नाही। नेहमी आरोग्यसेवा व्यावसायिकांचा सल्ला घ्या।',
    ta: 'பொறுப்புத் துறப்பு: இது மருத்துவ निदानம் அல்ல। எப்போதும் ஒரு சுகாதார நிபுணரை அணுகவும்।',
    gu: 'અસ્વીકરણ: આ તબીબી નિદાન નથી। હંમેશા આરોગ્યસંભાળ વ્યવસાયિકની સલાહ લો।',
    kn: 'ಹಕ್ಕುತ್ಯಾಗ: ಇದು ವೈದ್ಯಕೀಯ ರೋಗನಿರ್ಣಯವಲ್ಲ। ಯಾವಾಗಲೂ ಆರೋಗ್ಯ ವೃತ್ತಿಪರರನ್ನು ಸಂಪರ್ಕಿಸಿ।',
    ml: 'നിരാകരണം: ഇതൊരു മെഡിക്കൽ രോഗനിർണയമല്ല। എല്ലായ്പ്പോഴും ഒരു ആരോഗ്യ പ്രൊഫഷണലുമായി ബന്ധപ്പെടുക।',
    pa: 'ਬੇਦਾਅਵਾ: ਇਹ ਡਾਕਟਰੀ ਨਿਦਾਨ ਨਹੀਂ ਹੈ। ਹਮੇਸ਼ਾਂ ਸਿਹਤ ਸੰਭਾਲ ਪੇਸ਼ੇਵਰ ਨਾਲ ਸਲਾਹ ਕਰੋ।',
    as: 'অস্বীকৃতি: এইটো এটা চিকিৎসাৰ ৰোগ নিৰ্ণয় নহয়। সদায় এজন স্বাস্থ্যসেৱা পেছাদাৰীৰ সৈতে পৰামৰ্শ কৰক।',
    or: 'ଅସ୍ୱୀକାର: ଏହା ଏକ ଚିକିତ୍ସା ନିଦାନ ନୁହେଁ। ସର୍ବଦା ଜଣେ ସ୍ୱାସ୍ଥ୍ୟସେବା ପେସାଦାରଙ୍କ ସହିତ ପରାମର୍ଶ କରନ୍ତୁ।'
  }
};
// Language context type
interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
  availableLanguages: Language[];
}

// Create context with default values
const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: () => '',
  availableLanguages: ['en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml', 'pa', 'as', 'or']
});

// Provider component
export const LanguageProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  // Keep <html lang> in step with the switcher so screen readers pick the right
  // pronunciation and the browser picks the right font for each Indic script.
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Translation function
  const t = (key: string): string => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    // Fallback to English if translation not found
    return translations[key]?.['en'] || key;
  };

  const availableLanguages: Language[] = ['en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml', 'pa', 'as', 'or'];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, availableLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook for using the language context
export const useLanguage = () => useContext(LanguageContext);