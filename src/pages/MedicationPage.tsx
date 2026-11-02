import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Pill, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { useMedication } from '../contexts/MedicationContext';
import MedicationForm from '../components/medication/MedicationForm';
import MedicationLogList from '../components/medication/MedicationLogList';

const MedicationPage: React.FC = () => {
  const { medications, addMedication, medicationLog, logMedication } = useMedication();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-teal-50/20 to-slate-50 px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-teal-700 hover:border-teal-200 shadow-sm transition-all"
              title="Return to Home"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Medication & Regimen Tracker</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200">
                  Rx Safety
                </span>
              </div>
              <p className="text-sm text-slate-500">
                Log prescriptions, track daily adherence, and correlate therapies with symptom patterns
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-sm text-xs text-slate-700">
              <Pill className="w-3.5 h-3.5 text-teal-700" />
              <span><strong>{medications.length}</strong> Prescribed</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-sm text-xs text-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span><strong>{medicationLog.length}</strong> Doses Logged</span>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-4">
            <MedicationForm addMedication={addMedication} />
            
            {/* Clinical Tip Box */}
            <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200/60 text-xs text-teal-900 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
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
