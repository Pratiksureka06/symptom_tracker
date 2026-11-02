import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Pill, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { useMedication } from '../contexts/MedicationContext';
import MedicationForm from '../components/medication/MedicationForm';
import MedicationLogList from '../components/medication/MedicationLogList';

const MedicationPage: React.FC = () => {
  const { medications, addMedication, medicationLog, logMedication } = useMedication();

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-[rgb(var(--ink))] hover:border-[rgb(var(--app-border))] transition-colors"
              title="Return to Home"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Medication & Regimen Tracker</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.8125rem] font-semibold bg-[rgb(var(--app-raised))] text-[rgb(var(--ink))] border border-[rgb(var(--app-border))]">
                  Rx Safety
                </span>
              </div>
              <p className="text-sm text-[rgb(var(--ink-soft))]">
                Log prescriptions, track daily adherence, and correlate therapies with symptom patterns
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 text-[0.8125rem] text-slate-700">
              <Pill className="w-3.5 h-3.5 text-[rgb(var(--ink))]" />
              <span><strong>{medications.length}</strong> Prescribed</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 text-[0.8125rem] text-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-[rgb(var(--ink))]" />
              <span><strong>{medicationLog.length}</strong> Doses Logged</span>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-4">
            <MedicationForm addMedication={addMedication} />
            
            {/* Clinical Tip Box */}
            <div className="p-4 rounded-lg bg-[rgb(var(--app-raised))]/60 border border-[rgb(var(--app-border))]/60 text-[0.8125rem] text-[rgb(var(--ink))] flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[rgb(var(--ink))] shrink-0 mt-0.5" />
              <p>
                <strong>Clinical Integration:</strong> Registered medications are cross-referenced with your symptom logs in the Health Analytics dashboard to evaluate therapy effectiveness and monitor adverse side effects.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <MedicationLogList 
              medications={medications} 
              medicationLog={medicationLog} 
              logMedication={logMedication} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicationPage;
