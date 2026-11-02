import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSymptoms } from '../contexts/SymptomContext';
import { useLanguage } from '../contexts/LanguageContext';
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
  const { t } = useLanguage();
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
    <div className="px-4 py-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Active Clinical Session Banner (from Stitch Design) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl glass-panel border border-slate-200 shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-teal-600/10 text-teal-700 border border-teal-600/20 text-xs font-bold uppercase tracking-wider">
              Diagnostic Session
            </span>
            <h1 className="text-base font-extrabold text-slate-900">
              Clinical Symptom Evaluation
            </h1>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Two-Stage Bayesian ML</span>
              <span className="text-slate-300">•</span>
              <span className="text-teal-700 font-medium">773 Medical Entities</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>Real-time Clinical Triage</span>
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
            <div className="glass-card rounded-xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Assessment Readiness
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  selectedSymptoms.length > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {selectedSymptoms.length} symptom{selectedSymptoms.length !== 1 ? 's' : ''} active
                </span>
              </div>

              <p className="text-xs text-slate-500 mb-4">
                {selectedSymptoms.length === 0
                  ? 'Select symptoms from the catalog or record voice dictation to generate your differential diagnosis.'
                  : 'Ready to evaluate against Bayesian hierarchical medical taxonomy.'}
              </p>

              <button
                onClick={handleAnalyze}
                disabled={selectedSymptoms.length === 0 || isAnalyzing}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                  selectedSymptoms.length === 0 || isAnalyzing
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white shadow-teal-600/25 active:scale-98'
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
                    <span>Analyze Symptoms & Generate Differential</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            {/* Selected Symptoms Acuity & Duration Tuning */}
            {selectedSymptoms.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Symptom Acuity Details ({selectedSymptoms.length})
                  </h3>
                  <span className="text-[11px] text-teal-700 font-medium">Fine-tune severity</span>
                </div>
                {selectedSymptoms.map(symptom => (
                  <SymptomDetails key={symptom.id} symptom={symptom} />
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-xl p-6 border border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No Symptoms Added Yet</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Use the search bar, anatomical domain chips, or voice microphone on the left to add patient observations.
                </p>
              </div>
            )}
            
            {/* Clinical Safety & Medical Guidance */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white/80 space-y-2 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <ShieldCheck className="h-4 w-4 text-teal-700" />
                <span>Clinical Triage Protocol</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                This platform utilizes a Multinomial Naive Bayes & Random Forest ensemble with Laplace smoothing. 
                It is designed to supplement patient awareness and doctor-patient consultations, not replace physical diagnosis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SymptomCheckerPage;