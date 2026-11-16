import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSymptoms } from '../contexts/SymptomContext';
import { useToast } from '../contexts/ToastContext';
import SymptomSelector from '../components/symptom-checker/SymptomSelector';
import TriggerSelector from '../components/symptom-checker/TriggerSelector';
import SymptomDetails from '../components/symptom-checker/SymptomDetails';
import VoiceInput from '../components/symptom-checker/VoiceInput';
import { 
  AlertTriangle, 
  Sparkles, 
  ShieldCheck, 
  Stethoscope, 
  ArrowRight,
  Info,
  Clock
} from 'lucide-react';

const SymptomCheckerPage: React.FC = () => {
  const { selectedSymptoms, analyzeSymptoms } = useSymptoms();
  const { addToast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const navigate = useNavigate();
  
  // Handle analyze button click
  const handleAnalyze = async () => {
    if (selectedSymptoms.length === 0) {
      addToast('warning', 'Please select at least one symptom before analyzing.');
      return;
    }
    
    setIsAnalyzing(true);
    try {
      const results = await analyzeSymptoms(selectedTriggers);
      if (results.length > 0) {
        addToast('success', `Hierarchical analysis complete — ${results.length} conditions evaluated.`);
      } else {
        addToast('info', 'Analysis complete — no matching conditions found for the selected symptoms.');
      }
      navigate('/results');
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      addToast('error', 'Failed to analyze symptoms. Please check your connection and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  return (
    <div className="px-4 py-8 bg-[rgb(var(--app-ground))] min-h-[100svh]">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Active Clinical Session Banner (from Stitch Design) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg app-panel border border-slate-200">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-[rgb(var(--ink))]/10 text-[rgb(var(--ink))] border border-[rgb(var(--app-border))]/20 text-[0.8125rem] font-bold">
              Symptom check
            </span>
            <h1 className="text-base font-extrabold text-slate-900">
              What are you feeling?
            </h1>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <div className="flex items-center gap-2 text-[0.8125rem] text-[rgb(var(--ink-soft))]">
              <span>Sorted by body system, then ranked</span>
              <span className="text-slate-300">•</span>
              <span className="text-[rgb(var(--ink))] font-medium">773 conditions</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[0.8125rem] text-[rgb(var(--ink-soft))]">
            <Clock className="h-3.5 w-3.5 text-[rgb(var(--ink-soft))]" />
            <span>Takes about two minutes</span>
          </div>
        </div>

        {/* Main 2-Column Clinical Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column — Symptom Selection & Intake (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <SymptomSelector />
            <TriggerSelector selectedTriggers={selectedTriggers} setSelectedTriggers={setSelectedTriggers} />
            <VoiceInput />
          </div>
          
          {/* Right Column — Symptom Acuity, AI Triage Preview & CTA (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Primary Analysis CTA Card */}
            <div className="app-panel rounded-lg p-5 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[0.8125rem] font-bold text-[rgb(var(--ink-soft))]">
                  Ready to check
                </span>
                <span className={`text-[0.8125rem] font-bold px-2 py-0.5 rounded-full ${
 selectedSymptoms.length > 0
 ? 'bg-[rgb(var(--app-raised))] text-[rgb(var(--ink))]'
 : 'bg-[rgb(var(--app-raised))] text-slate-600'
 }`}>
                  {selectedSymptoms.length} symptom{selectedSymptoms.length !== 1 ? 's' : ''} active
                </span>
              </div>

              <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))] mb-4">
                {selectedSymptoms.length === 0
                  ? 'Add what you are feeling, by tapping it or saying it out loud. We will rank what fits.'
                  : 'Ready to evaluate against Bayesian hierarchical medical taxonomy.'}
              </p>

              <button
                onClick={handleAnalyze}
                disabled={selectedSymptoms.length === 0 || isAnalyzing}
                className={`w-full py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
 selectedSymptoms.length === 0 || isAnalyzing
 ? 'bg-[rgb(var(--app-control))] text-[rgb(var(--ink-soft))] cursor-not-allowed'
 : 'bg-[rgb(var(--ink))] hover:bg-[rgb(var(--field-low))] text-white active:scale-98'
 }`}
              >
                {isAnalyzing ? (
                  <>
                    <span className="inline-block animate-spin mr-1">⟳</span>
                    Running Two-Stage Diagnostic Triage...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>See what this could be</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            {/* Selected Symptoms Acuity & Duration Tuning */}
            {selectedSymptoms.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[0.8125rem] font-bold text-[rgb(var(--ink-soft))]">
                    Symptom Acuity Details ({selectedSymptoms.length})
                  </h3>
                  <span className="text-[11px] text-[rgb(var(--ink))] font-medium">Fine-tune severity</span>
                </div>
                {selectedSymptoms.map(symptom => (
                  <SymptomDetails key={symptom.id} symptom={symptom} />
                ))}
              </div>
            ) : (
              <div className="app-panel rounded-lg p-6 border border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[rgb(var(--app-raised))] text-[rgb(var(--ink))] flex items-center justify-center mx-auto">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Nothing added yet</h3>
                <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))] max-w-xs mx-auto">
                  Search for a symptom on the left, pick a part of the body, or use the microphone.
                </p>
              </div>
            )}
            
            {/* Clinical Safety & Medical Guidance */}
            <div className="p-4 rounded-lg border border-slate-200 bg-white/80 space-y-2">
              <div className="flex items-center gap-1.5 text-[0.8125rem] font-bold text-slate-800">
                <ShieldCheck className="h-4 w-4 text-[rgb(var(--ink))]" />
                <span>What this is, and is not</span>
              </div>
              <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))] leading-relaxed">
                MediScan ranks what your symptoms are consistent with. It cannot examine you and it is not a diagnosis.
                Take the result to a doctor rather than acting on it alone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SymptomCheckerPage;