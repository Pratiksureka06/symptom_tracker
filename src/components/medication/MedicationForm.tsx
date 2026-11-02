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
    <form onSubmit={handleSubmit} className="glass-card bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-teal-100/70 shadow-lg shadow-teal-900/5">
      <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-600/20">
          <Pill className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 text-base">Register Prescription / Supplement</h3>
          <p className="text-xs text-slate-500">Track dosing adherence and clinical schedules</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="med-name" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Medication Name
          </label>
          <input
            type="text"
            id="med-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-sm bg-slate-50/70 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all"
            placeholder="e.g., Amoxicillin, Metformin, Paracetamol"
            required
          />
        </div>

        <div>
          <label htmlFor="med-dosage" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Dosage & Strength
          </label>
          <input
            type="text"
            id="med-dosage"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            className="w-full text-sm bg-slate-50/70 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all"
            placeholder="e.g., 500mg, 10ml, 1 tablet"
            required
          />
        </div>

        <div>
          <label htmlFor="med-frequency" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Frequency & Timing
          </label>
          <input
            type="text"
            id="med-frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full text-sm bg-slate-50/70 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all"
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
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  frequency === preset
                    ? 'bg-teal-50 text-teal-700 border-teal-300 font-medium'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
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
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-medium text-sm rounded-xl shadow-md shadow-teal-600/25 active:scale-[0.99] transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add to Active Regimen</span>
        </button>
      </div>
    </form>
  );
};

export default MedicationForm;
