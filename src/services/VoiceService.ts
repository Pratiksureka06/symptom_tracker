import { Symptom } from '../contexts/SymptomContext';

// Define the interface for the voice service
interface VoiceServiceInterface {
  startListening: () => Promise<void>;
  stopListening: () => void;
  isListening: boolean;
  transcript: string;
  error: string | null;
  analyzeSpeech: (text: string) => Promise<Symptom[]>;
  speak: (text: string) => void;
}

// Function to check if SpeechRecognition is available
const isSpeechRecognitionSupported = (): boolean => {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

// Function to check if Speech Synthesis is available
const isSpeechSynthesisSupported = (): boolean => {
  return 'speechSynthesis' in window;
};

// Main Voice Service class
class VoiceService implements VoiceServiceInterface {
  private recognition: any;
  private _isListening: boolean = false;
  private _transcript: string = '';
  private _error: string | null = null;
  private synth: SpeechSynthesis | null = null;

  constructor() {
    // Initialize speech recognition if supported
    if (isSpeechRecognitionSupported()) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      
      this.recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          this._transcript = finalTranscript;
        }
      };
      
      this.recognition.onerror = (event: any) => {
        this._error = event.error;
      };
    } else {
      this._error = 'Speech recognition not supported in this browser.';
    }
    
    // Initialize speech synthesis if supported
    if (isSpeechSynthesisSupported()) {
      this.synth = window.speechSynthesis;
    }
  }

  // Getters
  get isListening(): boolean {
    return this._isListening;
  }
  
  get transcript(): string {
    return this._transcript;
  }
  
  get error(): string | null {
    return this._error;
  }
  
  // Start listening for voice input
  async startListening(): Promise<void> {
    if (!this.recognition) {
      this._error = 'Speech recognition not supported in this browser.';
      return Promise.reject(this._error);
    }
    
    try {
      this._isListening = true;
      this._transcript = '';
      this._error = null;
      this.recognition.start();
      return Promise.resolve();
    } catch (error) {
      this._error = 'Error starting speech recognition.';
      this._isListening = false;
      return Promise.reject(this._error);
    }
  }
  
  // Stop listening
  stopListening(): void {
    if (this.recognition && this._isListening) {
      this.recognition.stop();
      this._isListening = false;
    }
  }
  
  // Analyze speech to extract symptoms - in a real app, this would call an AI service
  async analyzeSpeech(text: string): Promise<Symptom[]> {
    // This is a mock implementation. In a real application, you would send this text
    // to a natural language processing service to extract symptoms
    
    // Simple keyword matching for demo purposes
    const keywordMap: Record<string, Symptom> = {
      'headache': {
        id: 'headache-1',
        name: 'Headache',
        bodyArea: 'Head',
      },
      'head pain': {
        id: 'headache-2',
        name: 'Headache',
        bodyArea: 'Head',
      },
      'migraine': {
        id: 'headache-3',
        name: 'Migraine',
        bodyArea: 'Head',
      },
      'fever': {
        id: 'fever-1',
        name: 'Fever',
        bodyArea: 'Whole body',
      },
      'high temperature': {
        id: 'fever-2',
        name: 'Fever',
        bodyArea: 'Whole body',
      },
      'cough': {
        id: 'cough-1',
        name: 'Cough',
        bodyArea: 'Chest',
      },
      'sore throat': {
        id: 'throat-1',
        name: 'Sore Throat',
        bodyArea: 'Throat',
      },
      'runny nose': {
        id: 'nose-1',
        name: 'Runny Nose',
        bodyArea: 'Nose',
      },
      'chest pain': {
        id: 'chest-pain-1',
        name: 'Chest Pain',
        bodyArea: 'Chest',
      }
    };
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const foundSymptoms: Symptom[] = [];
    const lowerText = text.toLowerCase();
    
    // Simple keyword matching
    Object.keys(keywordMap).forEach(keyword => {
      if (lowerText.includes(keyword)) {
        // Prevent duplicates (simplified approach)
        const symptomExists = foundSymptoms.some(s => 
          s.name.toLowerCase() === keywordMap[keyword].name.toLowerCase()
        );
        
        if (!symptomExists) {
          foundSymptoms.push({...keywordMap[keyword]});
        }
      }
    });
    
    return foundSymptoms;
  }
  
  // Text to speech function
  speak(text: string): void {
    if (!this.synth) {
      console.error('Speech synthesis not supported in this browser.');
      return;
    }
    
    // Cancel any ongoing speech
    this.synth.cancel();
    
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Speak the text
    this.synth.speak(utterance);
  }
}

// Create a singleton instance
const voiceService = new VoiceService();

export default voiceService;