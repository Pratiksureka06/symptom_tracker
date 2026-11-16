import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Check, Sparkles, Volume2 } from 'lucide-react';
import voiceService from '../../services/VoiceService';
import { useSymptoms, Symptom } from '../../contexts/SymptomContext';

interface VoiceInputProps {
  onSymptomsDetected?: (symptoms: Symptom[]) => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onSymptomsDetected }) => {
  const { addSymptom } = useSymptoms();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [processing, setProcessing] = useState(false);
  const [detectedSymptoms, setDetectedSymptoms] = useState<Symptom[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Effect to update transcript from voice service
  useEffect(() => {
    const interval = setInterval(() => {
      if (voiceService.isListening) {
        setTranscript(voiceService.transcript);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Handle start listening
  const startListening = async () => {
    setError(null);
    try {
      await voiceService.startListening();
      setIsListening(true);
      setTranscript('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error starting voice input');
    }
  };

  // Handle stop listening
  const stopListening = async () => {
    voiceService.stopListening();
    setIsListening(false);
    
    if (transcript.trim()) {
      setProcessing(true);
      try {
        const symptoms = await voiceService.analyzeSpeech(transcript);
        setDetectedSymptoms(symptoms);
        
        // Call the callback if provided
        if (onSymptomsDetected) {
          onSymptomsDetected(symptoms);
        }
        
        // Add the symptoms to context
        symptoms.forEach(symptom => {
          addSymptom(symptom);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error analyzing speech');
      } finally {
        setProcessing(false);
      }
    }
  };

  return (
    <div className="app-panel rounded-lg p-5 mt-5 border border-slate-200 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[rgb(var(--app-raised))] text-[rgb(var(--ink))] flex items-center justify-center">
            <Volume2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              Clinical Voice Dictation
              <span className="text-[0.8125rem] uppercase font-bold px-1.5 py-0.5 rounded bg-[rgb(var(--app-raised))]/70 text-[rgb(var(--ink))]">
                AI Speech
              </span>
            </h3>
            <p className="text-[11px] text-[rgb(var(--ink-soft))]">Speak naturally to extract symptoms automatically</p>
          </div>
        </div>
        
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={processing}
          className={`px-3.5 py-2 rounded-lg text-[0.8125rem] font-semibold flex items-center gap-2 transition-colors duration-200 ${
 isListening 
 ? 'bg-red-700 hover:bg-red-800 text-white' 
 : 'bg-[rgb(var(--ink))] hover:bg-[rgb(var(--field-low))] text-white active:scale-95'
 } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label={isListening ? 'Stop listening' : 'Start listening'}
        >
          {isListening ? (
            <>
              <MicOff className="h-4 w-4" />
              <span>Stop Recording</span>
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              <span>Start Dictation</span>
            </>
          )}
        </button>
      </div>
      
      {error && (
        <div className="bg-rose-50 text-rose-700 border border-rose-200 p-3 rounded-lg text-[0.8125rem] mb-3">
          {error}
        </div>
      )}

      {/* Waveform Indicator when active */}
      {isListening && (
        <div className="flex items-center justify-center gap-1.5 py-3 mb-2 bg-[rgb(var(--app-raised))]/60 rounded-lg border border-teal-100">
          <span className="text-[0.8125rem] font-medium text-[rgb(var(--ink))] mr-2">Recording active:</span>
          <div className="flex items-center gap-1 h-6">
            <span className="w-1 bg-teal-500 rounded-full waveform-bar" style={{ height: '8px' }}></span>
            <span className="w-1 bg-[rgb(var(--ink))] rounded-full waveform-bar" style={{ height: '18px' }}></span>
            <span className="w-1 bg-teal-500 rounded-full waveform-bar" style={{ height: '12px' }}></span>
            <span className="w-1 bg-[rgb(var(--ink))] rounded-full waveform-bar" style={{ height: '22px' }}></span>
            <span className="w-1 bg-teal-500 rounded-full waveform-bar" style={{ height: '14px' }}></span>
            <span className="w-1 bg-[rgb(var(--ink))] rounded-full waveform-bar" style={{ height: '20px' }}></span>
            <span className="w-1 bg-teal-400 rounded-full waveform-bar" style={{ height: '9px' }}></span>
          </div>
        </div>
      )}
      
      <div className={`border rounded-lg p-3.5 min-h-[72px] transition-colors ${
 isListening ? 'border-[rgb(var(--app-border))] bg-[rgb(var(--app-raised))]/30' : 'border-slate-200 bg-[rgb(var(--app-ground))]/50'
 }`}>
        {isListening && !transcript && (
          <p className="text-[0.8125rem] text-[rgb(var(--ink))] italic">Listening to patient narration...</p>
        )}
        {transcript && <p className="text-[0.8125rem] font-medium text-slate-800 leading-relaxed">"{transcript}"</p>}
        {!isListening && !transcript && (
          <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))]">
            Click "Start Dictation" and describe your condition (e.g. "I have a dry cough, low fever, and fatigue for 3 days").
          </p>
        )}
      </div>
      
      {processing && (
        <div className="mt-3 text-[rgb(var(--ink))] text-[0.8125rem] font-medium flex items-center">
          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-[rgb(var(--app-border))] mr-2"></div>
          AI parsing speech into clinical symptom entities...
        </div>
      )}
      
      {detectedSymptoms.length > 0 && !processing && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <h4 className="text-[0.8125rem] font-bold text-slate-700 mb-2 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-[rgb(var(--ink))]" />
            Extracted Clinical Symptoms:
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {detectedSymptoms.map(symptom => (
              <div 
                key={symptom.id} 
                className="bg-[rgb(var(--app-raised))] border border-[rgb(var(--app-border))]/80 text-[rgb(var(--ink))] px-2.5 py-1 rounded-lg text-[0.8125rem] font-medium flex items-center"
              >
                <Check className="h-3 w-3 mr-1 text-[rgb(var(--ink))]" />
                {symptom.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceInput;