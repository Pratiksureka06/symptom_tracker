import React from 'react';
import { Medication, MedicationLog, useMedication } from '../../contexts/MedicationContext';
import { CheckCircle2, Pill, Clock, Trash2, CalendarCheck, AlertCircle } from 'lucide-react';

interface MedicationLogListProps {
  medications: Medication[];
  medicationLog: MedicationLog[];
  logMedication: (log: MedicationLog) => void;
}

const MedicationLogList: React.FC<MedicationLogListProps> = ({ medications, medicationLog, logMedication }) => {
  const { removeMedication } = useMedication();

  const handleLogMedication = (medication: Medication) => {
    const newLog: MedicationLog = {
      id: Date.now().toString(),
      date: new Date(),
      medication,
      taken: true,
    };
    logMedication(newLog);
  };

  return (
    <div className="app-panel bg-white/90 p-6 rounded-lg border border-teal-100/70">
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="bg-[rgb(var(--ink))] hover:bg-[rgb(var(--field-low))] w-10 h-10 rounded-lg flex items-center justify-center text-white">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-base">Active Prescriptions</h3>
            <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))]">{medications.length} active schedule{medications.length === 1 ? '' : 's'}</p>
          </div>
        </div>
      </div>

      {medications.length === 0 ? (
        <div className="text-center py-10 px-4 bg-[rgb(var(--app-ground))]/50 rounded-lg border border-dashed border-slate-200">
          <div className="w-12 h-12 rounded-full bg-[rgb(var(--app-raised))] border border-[rgb(var(--app-border))] flex items-center justify-center mx-auto mb-3 text-[rgb(var(--ink))]">
            <Pill className="w-6 h-6 opacity-60" />
          </div>
          <p className="text-sm font-medium text-slate-700">No active medications</p>
          <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))] mt-1 max-w-xs mx-auto">
            Use the form on the left to add your current medications and monitor adherence.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {medications.map((med) => (
            <div
              key={med.id}
              className="p-3.5 rounded-lg border border-slate-200/80 bg-[rgb(var(--app-ground))]/40 hover:bg-white hover:border-[rgb(var(--app-border))] transition-colors flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-slate-800 text-sm truncate">{med.name}</h4>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.8125rem] font-medium bg-[rgb(var(--app-raised))] text-[rgb(var(--ink))] border border-[rgb(var(--app-border))]">
                    {med.dosage}
                  </span>
                </div>
                <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))] flex items-center gap-1.5 mt-1">
                  <Clock className="w-3.5 h-3.5 text-[rgb(var(--ink-soft))]" />
                  <span>{med.frequency}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleLogMedication(med)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[0.8125rem] font-semibold rounded-lg bg-[rgb(var(--app-raised))] text-[rgb(var(--ink))] border border-[rgb(var(--app-border))] hover:bg-[rgb(var(--ink))] hover:text-white transition-colors"
                  title="Record dose taken right now"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Log Taken</span>
                </button>
                <button
                  type="button"
                  onClick={() => removeMedication(med.id)}
                  className="p-1.5 text-[rgb(var(--ink-soft))] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Remove medication from regimen"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {medicationLog.length > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[0.8125rem] font-bold text-slate-700">
              Recent Adherence Logs
            </h4>
            <span className="text-[0.8125rem] text-[rgb(var(--ink-soft))]">{medicationLog.length} total logged</span>
          </div>
          <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {medicationLog.slice(0, 6).map((log) => (
              <li
                key={log.id}
                className="flex items-center justify-between text-[0.8125rem] px-3 py-2 rounded-lg bg-[rgb(var(--app-ground))] border border-slate-100"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-medium text-slate-700">{log.medication.name}</span>
                  <span className="text-[rgb(var(--ink-soft))] text-[11px]">({log.medication.dosage})</span>
                </div>
                <span className="text-[rgb(var(--ink-soft))] font-mono text-[11px]">
                  {new Date(log.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                  {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MedicationLogList;
