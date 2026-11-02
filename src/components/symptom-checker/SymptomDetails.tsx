import React, { useState } from 'react';
import { useSymptoms, Symptom } from '../../contexts/SymptomContext';
import { Activity, Clock, FileText } from 'lucide-react';

interface SymptomDetailsProps {
  symptom: Symptom;
}

const SymptomDetails: React.FC<SymptomDetailsProps> = ({ symptom }) => {
  const { updateSymptom } = useSymptoms();
  const [severity, setSeverity] = useState<Symptom['severity']>(symptom.severity || 'mild');
  const [duration, setDuration] = useState<string>(symptom.duration || '');
  const [notes, setNotes] = useState(symptom.notes || '');

  const handleSeverityChange = (newSeverity: Symptom['severity']) => {
    setSeverity(newSeverity);
    updateSymptom(symptom.id, { severity: newSeverity });
  };

  const handleDurationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newDuration = event.target.value;
    setDuration(newDuration);
    updateSymptom(symptom.id, { duration: newDuration });
  };

  const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = event.target.value;
    setNotes(newNotes);
    updateSymptom(symptom.id, { notes: newNotes });
  };

  return (
    <div className="app-panel rounded-lg p-4 border border-slate-200 space-y-3.5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-[rgb(var(--ink))]" />
          {symptom.name}
        </h3>
        <span className={`text-[0.8125rem] font-bold px-2 py-0.5 rounded-full ${
 severity === 'severe' ? 'bg-rose-100 text-rose-800' :
 severity === 'moderate' ? 'bg-amber-100 text-amber-800' :
 'bg-[rgb(var(--app-raised))] text-[rgb(var(--ink))]'
 }`}>
          {severity}
        </span>
      </div>

      {/* Severity Selector */}
      <div>
        <label className="block text-[11px] font-bold text-[rgb(var(--ink-soft))] mb-1.5">
          Symptom Acuity / Severity
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {(['mild', 'moderate', 'severe'] as const).map((level) => {
            const active = severity === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => handleSeverityChange(level)}
                className={`py-1.5 text-[0.8125rem] font-semibold rounded-lg border transition-colors ${
 active && level === 'mild' ? 'bg-[rgb(var(--ink))] text-white border-[rgb(var(--app-border))] ' :
 active && level === 'moderate' ? 'bg-amber-500 text-white border-amber-500 ' :
 active && level === 'severe' ? 'bg-rose-600 text-white border-rose-600 ' :
 'bg-white text-slate-700 hover:bg-[rgb(var(--app-ground))] border-slate-200'
 }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Duration Selector */}
      <div>
        <label className="block text-[11px] font-bold text-[rgb(var(--ink-soft))] mb-1.5 flex items-center gap-1">
          <Clock className="h-3 w-3 text-[rgb(var(--ink-soft))]" />
          Duration of Complaint
        </label>
        <select
          value={duration}
          onChange={handleDurationChange}
          className="bg-[rgb(var(--app-ground))]/80 border border-slate-200 text-slate-800 text-[0.8125rem] rounded-lg block w-full px-2.5 py-1.5 focus:ring-2 focus:ring-[rgb(var(--app-border))] focus:border-[rgb(var(--app-border))]"
        >
          <option value="">Select duration...</option>
          <option value="Less than 24 hours">Less than 24 hours (Acute onset)</option>
          <option value="1-3 days">1–3 days</option>
          <option value="4-7 days">4–7 days (Subacute)</option>
          <option value="1-2 weeks">1–2 weeks</option>
          <option value="More than 2 weeks">More than 2 weeks (Persistent / Chronic)</option>
        </select>
      </div>

      {/* Clinical Notes */}
      <div>
        <label className="block text-[11px] font-bold text-[rgb(var(--ink-soft))] mb-1 flex items-center gap-1">
          <FileText className="h-3 w-3 text-[rgb(var(--ink-soft))]" />
          Clinical Notes / Quality
        </label>
        <textarea
          value={notes}
          onChange={handleNotesChange}
          rows={2}
          className="bg-[rgb(var(--app-ground))]/80 border border-slate-200 text-slate-800 text-[0.8125rem] rounded-lg block w-full px-2.5 py-1.5 focus:ring-2 focus:ring-[rgb(var(--app-border))] focus:border-[rgb(var(--app-border))]"
          placeholder="e.g. Worse in morning, relieved by rest, sharp pain..."
        />
      </div>
    </div>
  );
};

export default SymptomDetails;