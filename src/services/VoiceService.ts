import { Symptom } from '../contexts/SymptomContext';

// Same backend the rest of the app talks to.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
  /**
   * Turn a transcript into symptoms from the real catalogue.
   *
   * This used to match nine hardcoded phrases, so "my chest hurts" found
   * nothing because the literal string was "chest pain". It now asks the
   * server, which maps everyday wording onto the full 377-symptom catalogue
   * with Gemini and falls back to word matching against the same catalogue
   * when Gemini is unavailable.
   *
   * Names come back in catalogue spelling, and the id convention matches the
   * one SymptomSelector uses, so a spoken symptom and a tapped one are the
   * same entry rather than two.
   */
  async analyzeSpeech(text: string): Promise<Symptom[]> {
    const transcript = (text || '').trim();
    if (!transcript) return [];

    try {
      const response = await fetch(`${API_URL}/api/extract-symptoms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });

      if (!response.ok) throw new Error(`Extraction failed: ${response.status}`);

      const data = await response.json();
      const names: string[] = Array.isArray(data?.symptoms) ? data.symptoms : [];

      return names.map((name) => ({
        id: name.toLowerCase().replace(/\s/g, '-'),
        name,
        bodyArea: 'General',
      }));
    } catch (err) {
      console.error('Could not turn speech into symptoms:', err);
      this._error = 'Could not read those symptoms. Try adding them by hand.';
      return [];
    }
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