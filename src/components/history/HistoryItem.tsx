import React, { useState } from 'react';
import { SymptomCheck } from '../../contexts/SymptomContext';
import { ChevronDown, ChevronUp, Calendar, Trash2, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';

interface HistoryItemProps {
  check: SymptomCheck;
  onRemove?: (id: string) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ check, onRemove }) => {
  const [expanded, setExpanded] = useState(false);

  const formattedDate = new Date(check.date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const getHighestUrgency = () => {
    const urgencyLevels: Record<string, number> = {
      emergency: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    let highestLevel = 'low';
    check.conditions.forEach((condition) => {
      if ((urgencyLevels[condition.urgency] || 1) > (urgencyLevels[highestLevel] || 1)) {
        highestLevel = condition.urgency;
      }
    });

    return highestLevel;
  };

  const highestUrgency = getHighestUrgency();

  const getUrgencyBadge = () => {
    switch (highestUrgency) {
      case 'emergency':
        return {
          label: 'Critical / Emergency',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
        };
      case 'high':
        return {
          label: 'High Urgency',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
        };
      case 'medium':
        return {
          label: 'Moderate',
          bg: 'bg-yellow-50 text-yellow-700 border-yellow-200',
          dot: 'bg-yellow-500',
        };
      default:
        return {
          label: 'Standard / Low-Risk',
          bg: 'bg-[rgb(var(--app-raised))] text-[rgb(var(--ink))] border-[rgb(var(--app-border))]',
          dot: 'bg-emerald-500',
        };
    }
  };

  const badge = getUrgencyBadge();
  const primaryCondition = check.conditions[0];

  return (
    <div className="app-panel bg-white/90 rounded-lg border border-slate-200/80 hover:border-[rgb(var(--app-border))]/80 transition-colors duration-200 mb-3 overflow-hidden">
      {/* Header Summary Row */}
      <div
        className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-[rgb(var(--app-raised))] border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
            <Calendar className="w-5 h-5 text-[rgb(var(--ink))]" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-800 text-sm sm:text-base truncate">
                {formattedDate}
              </h3>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.8125rem] font-medium border ${badge.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {badge.label}
              </span>
            </div>
            <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))] mt-1 flex items-center gap-2">
              <span>{check.symptoms.length} symptom{check.symptoms.length === 1 ? '' : 's'}</span>
              {primaryCondition && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-[rgb(var(--ink))] font-medium truncate">
                    Primary: {primaryCondition.name} ({Math.round(primaryCondition.probability * 100)}%)
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(check.id);
              }}
              className="p-2 text-[rgb(var(--ink-soft))] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete this record"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <div className={`p-1.5 rounded-lg bg-[rgb(var(--app-raised))]/70 text-slate-600 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-[rgb(var(--app-ground))]/40 space-y-4">
          {/* Symptoms List */}
          <div>
            <h4 className="text-[0.8125rem] font-bold text-slate-700 mb-2">
              Reported Symptoms
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {check.symptoms.map((symptom) => (
                <div
                  key={symptom.id}
                  className="p-2.5 rounded-lg bg-white border border-slate-200/80 text-[0.8125rem]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{symptom.name}</span>
                    {symptom.severity && (
                      <span className="px-2 py-0.5 rounded-md bg-[rgb(var(--app-raised))] text-[rgb(var(--ink))] font-medium">
                        {symptom.severity}
                      </span>
                    )}
                  </div>
                  {(symptom.duration || symptom.notes) && (
                    <div className="text-[rgb(var(--ink-soft))] text-[11px] mt-1 space-y-0.5">
                      {symptom.duration && <p>Duration: {symptom.duration}</p>}
                      {symptom.notes && <p className="italic">Note: {symptom.notes}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Triggers */}
          {check.triggers && check.triggers.length > 0 && (
            <div>
              <h4 className="text-[0.8125rem] font-bold text-slate-700 mb-1.5">
                Associated Triggers
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {check.triggers.map((trigger) => (
                  <span
                    key={trigger}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[0.8125rem] text-slate-700 font-medium"
                  >
                    {trigger}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Differential Diagnoses */}
          <div>
            <h4 className="text-[0.8125rem] font-bold text-slate-700 mb-2">
              Bayesian Differential Matches
            </h4>
            <div className="space-y-2">
              {check.conditions.slice(0, 4).map((condition, idx) => (
                <div
                  key={condition.id}
                  className="p-3 rounded-lg bg-white border border-slate-200/80 text-[0.8125rem]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[0.8125rem] w-4 h-4 rounded-full bg-[rgb(var(--app-raised))] flex items-center justify-center text-slate-600 font-bold">
                        {idx + 1}
                      </span>
                      <h5 className="font-semibold text-slate-800">{condition.name}</h5>
                    </div>
                    <span className="font-bold text-[rgb(var(--ink))]">
                      {Math.round(condition.probability * 100)}% match
                    </span>
                  </div>
                  <p className="text-[rgb(var(--ink-soft))] text-[11px] leading-relaxed pl-6">
                    {condition.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryItem;