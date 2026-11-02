import React, { useState } from 'react';
import { Medication } from '../../contexts/MedicationContext';
import { Plus, Pill, Clock, Sparkles } from 'lucide-react';

interface MedicationFormProps {
  addMedication: (medication: Medication) => void;
}

const FREQUENCY_PRESETS = [
  'Once daily (AM)',
  'Twice daily (AM/PM)',
  'Every 8 hours',
  'Before meals',
  'As needed (PRN)',
];

const MedicationForm: React.FC<MedicationFormProps> = ({ addMedication }) => {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dosage.trim() || !frequency.trim()) return;

    const newMedication: Medication = {
      id: Date.now().toString(),
      name: name.trim(),
      dosage: dosage.trim(),
      frequency: frequency.trim(),
    };

    addMedication(newMedication);
    setName('');
    setDosage('');
    setFrequency('');
  };

  return (
    <form onSubmit={handleSubmit} className="app-panel bg-white/90 p-6 rounded-lg border border-teal-100/70">
      <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
        <div className="bg-[rgb(var(--ink))] hover:bg-[rgb(var(--field-low))] w-10 h-10 rounded-lg flex items-center justify-center text-white">
          <Pill className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 text-base">Register Prescription / Supplement</h3>
          <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))]">Track dosing adherence and clinical schedules</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="med-name" className="block text-[0.8125rem] font-semibold text-slate-700 mb-1.5">
            Medication Name
          </label>
          <input
            type="text"
            id="med-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-sm bg-[rgb(var(--app-ground))]/70 border border-slate-200/90 rounded-lg px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[rgb(var(--app-border))] focus:ring-4 focus:ring-[rgb(var(--app-border))]/10 transition-colors"
            placeholder="e.g., Amoxicillin, Metformin, Paracetamol"
            required
          />
        </div>

        <div>
          <label htmlFor="med-dosage" className="block text-[0.8125rem] font-semibold text-slate-700 mb-1.5">
            Dosage & Strength
          </label>
          <input
            type="text"
            id="med-dosage"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            className="w-full text-sm bg-[rgb(var(--app-ground))]/70 border border-slate-200/90 rounded-lg px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[rgb(var(--app-border))] focus:ring-4 focus:ring-[rgb(var(--app-border))]/10 transition-colors"
            placeholder="e.g., 500mg, 10ml, 1 tablet"
            required
          />
        </div>

        <div>
          <label htmlFor="med-frequency" className="block text-[0.8125rem] font-semibold text-slate-700 mb-1.5">
            Frequency & Timing
          </label>
          <input
            type="text"
            id="med-frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full text-sm bg-[rgb(var(--app-ground))]/70 border border-slate-200/90 rounded-lg px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[rgb(var(--app-border))] focus:ring-4 focus:ring-[rgb(var(--app-border))]/10 transition-colors"
            placeholder="e.g., Twice a day after meals"
            required
          />
          {/* Presets */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {FREQUENCY_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setFrequency(preset)}
                className={`text-[0.8125rem] px-2.5 py-1 rounded-lg border transition-colors ${
 frequency === preset
 ? 'bg-[rgb(var(--app-raised))] text-[rgb(var(--ink))] border-[rgb(var(--app-border))] font-medium'
 : 'bg-[rgb(var(--app-ground))] text-slate-600 border-slate-200 hover:bg-[rgb(var(--app-raised))]'
 }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-2">
        <button
          type="submit"
          className="bg-[rgb(var(--ink))] hover:bg-[rgb(var(--field-low))] w-full flex items-center justify-center gap-2 px-4 py-2.5 text-white font-medium text-sm rounded-lg active:scale-[0.99] transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add to Active Regimen</span>
        </button>
      </div>
    </form>
  );
};

export default MedicationForm;
