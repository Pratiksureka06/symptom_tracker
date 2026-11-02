// Voice service for speech recognition and synthesis
class VoiceService {
    constructor() {
        this.recognition = null;
        this.synthesis = null;
        this.isListening = false;
        this.transcript = '';
        this.error = null;
        
        this.initializeSpeechRecognition();
        this.initializeSpeechSynthesis();
    }
    
    initializeSpeechRecognition() {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            
            this.recognition.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    }
                }
                
                if (finalTranscript) {
                    this.transcript = finalTranscript;
                    this.updateTranscriptDisplay();
                }
            };
            
            this.recognition.onerror = (event) => {
                this.error = event.error;
                this.showError(this.error);
                this.stopListening();
            };
            
            this.recognition.onend = () => {
                this.isListening = false;
                this.updateVoiceButton();
            };
        } else {
            this.error = 'Speech recognition not supported in this browser.';
        }
    }
    
    initializeSpeechSynthesis() {
        if ('speechSynthesis' in window) {
            this.synthesis = window.speechSynthesis;
        }
    }
    
    async startListening() {
        if (!this.recognition) {
            this.error = 'Speech recognition not supported in this browser.';
            this.showError(this.error);
            return;
        }
        
        try {
            this.isListening = true;
            this.transcript = '';
            this.error = null;
            this.hideError();
            this.recognition.start();
            this.updateVoiceButton();
            this.updateTranscriptDisplay();
        } catch (error) {
            this.error = 'Error starting speech recognition.';
            this.showError(this.error);
            this.isListening = false;
            this.updateVoiceButton();
        }
    }
    
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            this.updateVoiceButton();
            
            if (this.transcript.trim()) {
                this.analyzeTranscript();
            }
        }
    }
    
    async analyzeTranscript() {
        const processingElement = document.getElementById('voice-processing');
        if (processingElement) {
            processingElement.classList.remove('hidden');
        }
        
        try {
            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const symptoms = this.extractSymptomsFromText(this.transcript);
            this.displayDetectedSymptoms(symptoms);
            
            // Add symptoms to the main symptom list
            symptoms.forEach(symptom => {
                window.symptomChecker.addSymptom(symptom);
            });
            
        } catch (error) {
            this.showError('Error analyzing speech');
        } finally {
            if (processingElement) {
                processingElement.classList.add('hidden');
            }
        }
    }
    
    extractSymptomsFromText(text) {
        // Simple keyword matching for demo purposes
        const keywordMap = {
            'headache': { id: 'headache-voice', name: 'Headache', bodyArea: 'Head' },
            'head pain': { id: 'headache-voice-2', name: 'Headache', bodyArea: 'Head' },
            'migraine': { id: 'migraine-voice', name: 'Migraine', bodyArea: 'Head' },
            'fever': { id: 'fever-voice', name: 'Fever', bodyArea: 'Whole body' },
            'high temperature': { id: 'fever-voice-2', name: 'Fever', bodyArea: 'Whole body' },
            'cough': { id: 'cough-voice', name: 'Cough', bodyArea: 'Chest' },
            'sore throat': { id: 'throat-voice', name: 'Sore Throat', bodyArea: 'Throat' },
            'runny nose': { id: 'nose-voice', name: 'Runny Nose', bodyArea: 'Nose' },
            'chest pain': { id: 'chest-pain-voice', name: 'Chest Pain', bodyArea: 'Chest' },
            'stomach pain': { id: 'stomach-pain-voice', name: 'Stomach Pain', bodyArea: 'Abdomen' },
            'nausea': { id: 'nausea-voice', name: 'Nausea', bodyArea: 'Stomach' },
            'dizziness': { id: 'dizziness-voice', name: 'Dizziness', bodyArea: 'Head' },
            'fatigue': { id: 'fatigue-voice', name: 'Fatigue', bodyArea: 'Whole body' },
            'tired': { id: 'fatigue-voice-2', name: 'Fatigue', bodyArea: 'Whole body' }
        };
        
        const foundSymptoms = [];
        const lowerText = text.toLowerCase();
        
        Object.keys(keywordMap).forEach(keyword => {
            if (lowerText.includes(keyword)) {
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
    
    displayDetectedSymptoms(symptoms) {
        const container = document.getElementById('detected-symptoms');
        const list = document.getElementById('detected-symptoms-list');
        
        if (symptoms.length > 0) {
            list.innerHTML = '';
            symptoms.forEach(symptom => {
                const symptomElement = document.createElement('div');
                symptomElement.className = 'bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center';
                symptomElement.innerHTML = `
                    <svg class="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    ${symptom.name}
                `;
                list.appendChild(symptomElement);
            });
            container.classList.remove('hidden');
        }
    }
    
    speak(text) {
        if (!this.synthesis) {
            console.error('Speech synthesis not supported in this browser.');
            return;
        }
        
        this.synthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        this.synthesis.speak(utterance);
    }
    
    updateVoiceButton() {
        const button = document.getElementById('voice-toggle');
        if (!button) return;
        
        if (this.isListening) {
            button.className = 'p-3 rounded-full bg-red-500 text-white animate-pulse transition-colors';
            button.innerHTML = `
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clip-rule="evenodd"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path>
                </svg>
            `;
            button.setAttribute('aria-label', 'Stop listening');
        } else {
            button.className = 'p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors';
            button.innerHTML = `
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                </svg>
            `;
            button.setAttribute('aria-label', 'Start listening');
        }
    }
    
    updateTranscriptDisplay() {
        const transcriptElement = document.getElementById('voice-transcript');
        if (!transcriptElement) return;
        
        if (this.isListening && !this.transcript) {
            transcriptElement.innerHTML = '<p class="text-gray-500 animate-pulse">Listening...</p>';
            transcriptElement.className = 'border rounded-md p-3 min-h-24 border-blue-300 bg-blue-50';
        } else if (this.transcript) {
            transcriptElement.innerHTML = `<p class="text-gray-800">${this.transcript}</p>`;
            transcriptElement.className = 'border rounded-md p-3 min-h-24 border-blue-300 bg-blue-50';
        } else {
            transcriptElement.innerHTML = '<p class="text-gray-500">Click the microphone button and describe your symptoms...</p>';
            transcriptElement.className = 'border rounded-md p-3 min-h-24 border-gray-200';
        }
    }
    
    showError(message) {
        const errorElement = document.getElementById('voice-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    }
    
    hideError() {
        const errorElement = document.getElementById('voice-error');
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
    }
}

// Create global instance
window.voiceService = new VoiceService();