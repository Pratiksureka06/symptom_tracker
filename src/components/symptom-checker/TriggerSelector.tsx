import React, { useState } from 'react';
import { Plus, X, Zap } from 'lucide-react';

interface TriggerSelectorProps {
  selectedTriggers: string[];
  setSelectedTriggers: (triggers: string[]) => void;
}

const PREDEFINED_TRIGGERS = [
  'High Work Stress',
  'Sleep Deficit (<5 hrs)',
  'Cold Weather Exposure',
  'Pollen / Environmental Dust',
  'Diet / Skipping Meals',
  'Physical Exertion'
];

const TriggerSelector: React.FC<TriggerSelectorProps> = ({ selectedTriggers, setSelectedTriggers }) => {
  const [customTrigger, setCustomTrigger] = useState('');

  const handleToggleTrigger = (trigger: string) => {
    if (selectedTriggers.includes(trigger)) {
      setSelectedTriggers(selectedTriggers.filter(t => t !== trigger));
    } else {
      setSelectedTriggers([...selectedTriggers, trigger]);
    }
  };

  const handleAddCustomTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customTrigger.trim();
    if (trimmed && !selectedTriggers.includes(trimmed)) {
      setSelectedTriggers([...selectedTriggers, trimmed]);
      setCustomTrigger('');
    }
  };

  return (
    <div className="glass-card rounded-xl p-5 border border-slate-200 shadow-xs mt-5">
      <div className="flex items-center gap-2 mb-1">
        <Zap className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-bold text-slate-800">Environmental & Lifestyle Triggers</h3>
      </div>
      <p className="text-xs text-slate-500 mb-3.5">
        Identifying triggers assists the AI engine in correlating chronic vs acute symptom flare-ups.
      </p>
      
      {/* Trigger Pills */}
      <div className="flex flex-wrap gap-1.5 mb-3.5">
        {PREDEFINED_TRIGGERS.map(trigger => {
          const isSelected = selectedTriggers.includes(trigger);
          return (
            <button
              key={trigger}
              type="button"
              onClick={() => handleToggleTrigger(trigger)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                isSelected
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {isSelected ? `✓ ${trigger}` : `+ ${trigger}`}
            </button>
          );
        })}
      </div>

      {/* Custom Trigger Input */}
      <form onSubmit={handleAddCustomTrigger} className="flex items-center gap-2">
        <input
          type="text"
          value={customTrigger}
          onChange={(e) => setCustomTrigger(e.target.value)}
          className="bg-slate-50/70 border border-slate-200 text-slate-900 text-xs rounded-xl block w-full px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white shadow-2xs"
          placeholder="Add custom trigger (e.g. Dehydration, Caffeine, Smoke)..."
        />
        <button
          type="submit"
          disabled={!customTrigger.trim()}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white rounded-xl text-xs font-medium transition-colors shrink-0"
        >
          Add
        </button>
      </form>
    </div>
  );
};

export default TriggerSelector;
