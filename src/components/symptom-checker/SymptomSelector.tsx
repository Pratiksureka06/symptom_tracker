import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Plus, X, Loader2, Sparkles, Filter, Check } from 'lucide-react';
import { useSymptoms, Symptom } from '../../contexts/SymptomContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Anatomical Domain Category Chips matching Stitch design
const DOMAINS = [
  { id: 'all', label: 'All Domains', count: null },
  { id: 'respiratory', label: 'Respiratory', keywords: ['cough', 'breath', 'wheez', 'sputum', 'throat', 'nasal', 'chest tightness'] },
  { id: 'cardiovascular', label: 'Cardiovascular', keywords: ['chest pain', 'heart', 'palpitation', 'pulse', 'swelling', 'edema'] },
  { id: 'neurological', label: 'Neurological', keywords: ['headache', 'dizzy', 'numb', 'seizure', 'memory', 'tremor', 'faint'] },
  { id: 'dermatology', label: 'Dermatology', keywords: ['skin', 'rash', 'itch', 'lesion', 'acne', 'pimple', 'scalp'] },
  { id: 'musculoskeletal', label: 'Musculoskeletal', keywords: ['pain', 'joint', 'back', 'neck', 'knee', 'muscle', 'cramp', 'stiff'] },
  { id: 'gastrointestinal', label: 'Digestive', keywords: ['abdom', 'nausea', 'vomit', 'diarrhea', 'constipat', 'stomach', 'heartburn'] }
];

const POPULAR_TAGS = [
  'Cough',
  'Shortness of breath',
  'Headache',
  'Fever',
  'Chest pain',
  'Fatigue',
  'Skin rash',
  'Nausea'
];

const SymptomSelector: React.FC = () => {
  const { t } = useLanguage();
  const { selectedSymptoms, addSymptom, removeSymptom } = useSymptoms();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDomain, setActiveDomain] = useState('all');
  const [availableSymptoms, setAvailableSymptoms] = useState<Symptom[]>([]);
  const [commonSymptoms, setCommonSymptoms] = useState<Symptom[]>([]);
  const [symptomDescriptions, setSymptomDescriptions] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);

    try {
      const [symptomsRes, commonRes, descriptionsRes] = await Promise.all([
        fetch(`${API_URL}/api/symptoms`),
        fetch(`${API_URL}/api/common-symptoms`),
        fetch(`${API_URL}/api/symptom-descriptions`),
      ]);

      if (!symptomsRes.ok || !commonRes.ok || !descriptionsRes.ok) {
        throw new Error('Failed to fetch symptom data');
      }

      const symptoms: string[] = await symptomsRes.json();
      const common: string[] = await commonRes.json();
      const descriptions = await descriptionsRes.json();

      setAvailableSymptoms(symptoms.map(s => ({
        id: s.toLowerCase().replace(/\s/g, '-'),
        name: s,
        bodyArea: 'General',
      })));

      setCommonSymptoms(common.map(s => ({
        id: s.toLowerCase().replace(/\s/g, '-'),
        name: s,
        bodyArea: 'Common',
      })));

      setSymptomDescriptions(descriptions);
    } catch (error) {
      console.error('Failed to load symptoms:', error);
      setLoadError(true);
      addToast('error', 'Failed to connect to server. Please ensure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter symptoms based on search term and active anatomical domain
  const filteredSymptoms = useMemo(() => {
    let list = searchTerm.trim() === '' ? commonSymptoms : availableSymptoms;

    if (searchTerm.trim() !== '') {
      list = availableSymptoms.filter(symptom => 
        symptom.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (activeDomain !== 'all') {
      const domainObj = DOMAINS.find(d => d.id === activeDomain);
      if (domainObj && domainObj.keywords) {
        list = list.filter(sym => {
          const sLower = sym.name.toLowerCase();
          return domainObj.keywords.some(kw => sLower.includes(kw));
        });
      }
    }

    return list;
  }, [searchTerm, activeDomain, commonSymptoms, availableSymptoms]);

  // Check if a symptom is already selected
  const isSelected = (id: string) => {
    return selectedSymptoms.some(s => s.id === id);
  };

  // Handle adding a symptom
  const handleAddSymptom = (symptom: Symptom) => {
    if (!isSelected(symptom.id)) {
      addSymptom(symptom);
    }
  };

  const handleQuickAdd = (tagName: string) => {
    const found = availableSymptoms.find(s => s.name.toLowerCase() === tagName.toLowerCase()) || {
      id: tagName.toLowerCase().replace(/\s/g, '-'),
      name: tagName,
      bodyArea: 'General',
    };
    handleAddSymptom(found);
  };

  return (
    <div className="glass-card rounded-xl p-5 border border-slate-200 shadow-xs space-y-5">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Filter className="h-4 w-4 text-teal-700" />
            Clinical Symptom Intake
          </h2>
          <p className="text-xs text-slate-500">Filter by anatomical domain or search from 377 medical symptoms</p>
        </div>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/60">
          Step 1 of 2
        </span>
      </div>

      {/* Anatomical Domain Category Chips */}
      <div>
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          Anatomical Domain Filter
        </label>
        <div className="flex flex-wrap gap-1.5">
          {DOMAINS.map(domain => (
            <button
              key={domain.id}
              onClick={() => setActiveDomain(domain.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeDomain === domain.id
                  ? 'bg-teal-700 text-white font-semibold shadow-xs'
                  : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700'
              }`}
            >
              {domain.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </div>
          <input
            type="text"
            className="bg-slate-50/70 border border-slate-200 text-slate-900 text-xs rounded-xl block w-full pl-9 pr-8 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-all shadow-2xs"
            placeholder="Search symptoms (e.g., dry cough, thoracic pain, vertigo, shortness of breath)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoading || loadError}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Quick Add Popular Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
          <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-teal-700" /> Quick Add:
          </span>
          {POPULAR_TAGS.map(tag => {
            const added = selectedSymptoms.some(s => s.name.toLowerCase() === tag.toLowerCase());
            return (
              <button
                key={tag}
                onClick={() => handleQuickAdd(tag)}
                disabled={added}
                className={`text-[11px] px-2 py-0.5 rounded-md border transition-all ${
                  added
                    ? 'bg-teal-50 text-teal-700 border-teal-200 font-semibold cursor-default'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {added ? `✓ ${tag}` : `+ ${tag}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Symptoms Badges */}
      {selectedSymptoms.length > 0 && (
        <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
              <span>Active Intake ({selectedSymptoms.length})</span>
            </h3>
            <span className="text-[11px] text-teal-700">Ready for diagnostic scoring</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedSymptoms.map(symptom => (
              <div 
                key={symptom.id} 
                className="bg-white border border-teal-200 text-teal-800 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center shadow-2xs group"
              >
                <span>{symptom.name}</span>
                <button
                  onClick={() => removeSymptom(symptom.id)}
                  className="ml-1.5 text-teal-400 hover:text-rose-600 transition-colors"
                  aria-label={`Remove ${symptom.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Symptom Selection Grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {searchTerm.trim() === '' ? 'Common & Category Symptoms' : 'Search Results'}
          </h3>
          <span className="text-[11px] text-slate-500">
            Showing {filteredSymptoms.length} symptoms
          </span>
        </div>

        {/* Loading state — skeleton rows mirror the real grid so the panel does
            not resize when the data lands. */}
        {isLoading && (
          <div role="status" aria-busy="true">
            <span className="sr-only">Loading medical ontology from server…</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5" aria-hidden="true">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="skeleton h-[34px]" />
              ))}
            </div>
            <p className="mt-3 flex items-center justify-center text-[11px] text-ink-subtle">
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin text-primary" />
              Loading medical ontology from server…
            </p>
          </div>
        )}

        {/* Error state */}
        {loadError && !isLoading && (
          <div role="alert" className="rounded-card border border-rose-200 bg-rose-50 p-4 text-center">
            <p className="mb-2 text-xs text-rose-700">Failed to connect to backend engine.</p>
            <button
              type="button"
              onClick={fetchData}
              className="rounded-md px-2 py-1 text-xs font-bold text-primary transition-colors hover:bg-primary-soft hover:underline"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Symptoms List Grid */}
        {!isLoading && !loadError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-72 overflow-y-auto pr-1">
            {filteredSymptoms.length > 0 ? (
              filteredSymptoms.map(symptom => {
                const selected = isSelected(symptom.id);
                return (
                  <button
                    key={symptom.id}
                    onClick={() => handleAddSymptom(symptom)}
                    disabled={selected}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border text-left text-xs transition-all ${
                      selected
                        ? 'bg-teal-50 border-teal-200 text-teal-800 font-semibold cursor-default'
                        : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span className="truncate pr-2">{symptom.name}</span>
                    {selected ? (
                      <Check className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                    ) : (
                      <Plus className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <p className="text-slate-500 text-xs col-span-2 py-4 text-center">
                No symptoms match the current search or domain filter.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SymptomSelector;