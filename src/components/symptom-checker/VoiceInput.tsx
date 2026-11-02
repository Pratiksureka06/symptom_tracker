import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Check, Sparkles, Volume2 } from 'lucide-react';
import voiceService from '../../services/VoiceService';
import { useSymptoms, Symptom } from '../../contexts/SymptomContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface VoiceInputProps {
  onSymptomsDetected?: (symptoms: Symptom[]) => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onSymptomsDetected }) => {
  const { t } = useLanguage();
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
    <div className="glass-card rounded-xl p-5 mt-5 border border-slate-200 shadow-xs transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
            <Volume2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              Clinical Voice Dictation
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-teal-100/70 text-teal-800">
                AI Speech
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">Speak naturally to extract symptoms automatically</p>
          </div>
        </div>
        
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={processing}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 shadow-sm ${
            isListening 
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25 ring-4 ring-rose-500/20' 
              : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-teal-600/20 active:scale-95'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label={isListening ? 'Stop listening' : 'Start listening'}
        >
          {isListening ? (
            <>
              <MicOff className="h-4 w-4 animate-pulse" />
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
        <div className="bg-rose-50 text-rose-700 border border-rose-200 p-3 rounded-lg text-xs mb-3">
          {error}
        </div>
      )}

      {/* Waveform Indicator when active */}
      {isListening && (
        <div className="flex items-center justify-center gap-1.5 py-3 mb-2 bg-teal-50/60 rounded-lg border border-teal-100">
          <span className="text-xs font-medium text-teal-800 mr-2">Recording active:</span>
          <div className="flex items-center gap-1 h-6">
            <span className="w-1 bg-teal-500 rounded-full waveform-bar" style={{ height: '8px' }}></span>
            <span className="w-1 bg-teal-600 rounded-full waveform-bar" style={{ height: '18px' }}></span>
            <span className="w-1 bg-teal-500 rounded-full waveform-bar" style={{ height: '12px' }}></span>
            <span className="w-1 bg-teal-700 rounded-full waveform-bar" style={{ height: '22px' }}></span>
            <span className="w-1 bg-teal-500 rounded-full waveform-bar" style={{ height: '14px' }}></span>
            <span className="w-1 bg-teal-600 rounded-full waveform-bar" style={{ height: '20px' }}></span>
            <span className="w-1 bg-teal-400 rounded-full waveform-bar" style={{ height: '9px' }}></span>
          </div>
        </div>
      )}
      
      <div className={`border rounded-xl p-3.5 min-h-[72px] transition-colors ${
        isListening ? 'border-teal-400 bg-teal-50/30' : 'border-slate-200 bg-slate-50/50'
      }`}>
        {isListening && !transcript && (
          <p className="text-xs text-teal-700 italic animate-pulse">Listening to patient narration...</p>
        )}
        {transcript && <p className="text-xs font-medium text-slate-800 leading-relaxed">"{transcript}"</p>}
        {!isListening && !transcript && (
          <p className="text-xs text-slate-500">
            Click "Start Dictation" and describe your condition (e.g. "I have a dry cough, low fever, and fatigue for 3 days").
          </p>
        )}
      </div>
      
      {processing && (
        <div className="mt-3 text-teal-700 text-xs font-medium flex items-center">
          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-teal-600 mr-2"></div>
          AI parsing speech into clinical symptom entities...
        </div>
      )}
      
      {detectedSymptoms.length > 0 && !processing && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-teal-700" />
            Extracted Clinical Symptoms:
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {detectedSymptoms.map(symptom => (
              <div 
                key={symptom.id} 
                className="bg-emerald-50 border border-emerald-200/80 text-emerald-800 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center shadow-2xs"
              >
                <Check className="h-3 w-3 mr-1 text-emerald-600" />
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