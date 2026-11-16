import React, { createContext, useState, useContext, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Types for our symptoms and conditions
export interface Symptom {
  id: string;
  name: string;
  bodyArea: string;
  severity?: 'mild' | 'moderate' | 'severe';
  duration?: string;
  notes?: string;
}

export interface Condition {
  id: string;
  name: string;
  probability: number;
  description: string;
  nextSteps: string[];
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  rank?: number;
  tier?: string;
  category?: string;
  specialist?: string;
}

export interface TriageCategory {
  id: string;
  name: string;
  specialist: string;
  probability: number;
  percentage: number;
}

export interface TriageResult {
  primaryCategory: string;
  primaryCategoryId?: string;
  categoryConfidence: number;
  categoryConfidencePercent: number;
  topCategories: TriageCategory[];
  recommendedSpecialist: string;
}

export interface DifferentialDiagnosisResult {
  top1: Condition | null;
  top3: Condition[];
  top5: Condition[];
  cumulativeProbabilityTop3: number;
  top3CoveragePercent: number;
  totalEvaluatedDiseases: number;
}

export interface SymptomCheck {
  id: string;
  date: Date;
  symptoms: Symptom[];
  conditions: Condition[];
  triggers?: string[];
  triage?: TriageResult;
  differentialDiagnosis?: DifferentialDiagnosisResult;
}

interface SymptomContextType {
  selectedSymptoms: Symptom[];
  addSymptom: (symptom: Symptom) => void;
  removeSymptom: (id: string) => void;
  updateSymptom: (id: string, updates: Partial<Symptom>) => void;
  clearSymptoms: () => void;
  analyzeSymptoms: (triggers?: string[]) => Promise<Condition[]>;
  conditions: Condition[];
  /** Which backend engine produced the current results. */
  engine: 'gemini' | 'ml' | null;
  /** Set when Gemini was asked for but the local model answered instead. */
  fallbackReason: string | null;
  triage?: TriageResult | null;
  differentialDiagnosis?: DifferentialDiagnosisResult | null;
  history: SymptomCheck[];
  addToHistory: (check: SymptomCheck) => void;
  clearHistory: () => void;
  removeFromHistory: (id: string) => void;
}

/* localStorage helpers.

   History is stored per user. It used to live under one global key with no
   owner on the record, so every account on a device read the same checks:
   signing in as a doctor showed that doctor the patient's symptom history,
   health score and trends as if they were his own.

   Anonymous use keeps the original key, because the app promises you can run
   a check without an account. The first time a patient signs in, any
   anonymous history on the device is adopted into their own scope so their
   checks are not lost at the sign-in boundary. */
const HISTORY_KEY = 'mediscan_history';

export const historyKeyFor = (userId?: string | null): string =>
  userId ? `${HISTORY_KEY}:${userId}` : HISTORY_KEY;

const loadHistory = (key: string = HISTORY_KEY): SymptomCheck[] => {
  try {
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      // Restore Date objects from serialized strings
      return parsed.map((check: SymptomCheck) => ({
        ...check,
        date: new Date(check.date),
      }));
    }
  } catch (e) {
    console.error('Failed to load history from localStorage:', e);
  }
  return [];
};

const saveHistory = (key: string, history: SymptomCheck[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save history to localStorage:', e);
  }
};

// Create context
const SymptomContext = createContext<SymptomContextType>({
  selectedSymptoms: [],
  addSymptom: () => {},
  removeSymptom: () => {},
  updateSymptom: () => {},
  clearSymptoms: () => {},
  analyzeSymptoms: async () => [],
  conditions: [],
  engine: null,
  fallbackReason: null,
  triage: null,
  differentialDiagnosis: null,
  history: [],
  addToHistory: () => {},
  clearHistory: () => {},
  removeFromHistory: () => {},
});

// Provider component
export const SymptomProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<Symptom[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [engine, setEngine] = useState<'gemini' | 'ml' | null>(null);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [triage, setTriage] = useState<TriageResult | null>(null);
  const [differentialDiagnosis, setDifferentialDiagnosis] = useState<DifferentialDiagnosisResult | null>(null);
  /* Whose history this is. SymptomProvider sits inside AuthProvider, so the
     signed-in user is available here. */
  const { currentUser } = useAuth();
  const storageKey = historyKeyFor(currentUser?.id);

  const [history, setHistory] = useState<SymptomCheck[]>(() => loadHistory(storageKey));

  /* The key tracked by the state currently in memory. The save effect refuses
     to run until the load for a key has finished, so that switching user
     never writes the previous account's checks into the new account's slot. */
  // Starts null so the load-and-adopt effect runs once on mount; seeding it
  // with storageKey made the effect return early and adoption never ran.
  const loadedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (loadedKeyRef.current === storageKey) return;

    let next = loadHistory(storageKey);

    // One-time adoption of anonymous history when a patient first signs in.
    const isFirstScopedLoad = localStorage.getItem(storageKey) === null;
    if (currentUser?.role === 'patient' && isFirstScopedLoad && next.length === 0) {
      const anonymous = loadHistory(HISTORY_KEY);
      if (anonymous.length > 0) next = anonymous;
    }

    setHistory(next);
    loadedKeyRef.current = storageKey;
  }, [storageKey, currentUser?.role]);

  // Persist history to localStorage whenever it changes, into its own scope.
  useEffect(() => {
    if (loadedKeyRef.current !== storageKey) return;
    saveHistory(storageKey, history);
  }, [history, storageKey]);

  const addSymptom = (symptom: Symptom) => {
    setSelectedSymptoms(prev => [...prev, symptom]);
  };

  const removeSymptom = (id: string) => {
    setSelectedSymptoms(prev => prev.filter(symptom => symptom.id !== id));
  };

  const updateSymptom = (id: string, updates: Partial<Symptom>) => {
    setSelectedSymptoms(prev => 
      prev.map(symptom => 
        symptom.id === id ? { ...symptom, ...updates } : symptom
      )
    );
  };

  const clearSymptoms = () => {
    setSelectedSymptoms([]);
    setConditions([]);
    setTriage(null);
    setEngine(null);
    setFallbackReason(null);
    setDifferentialDiagnosis(null);
  };

  const analyzeSymptoms = async (triggers?: string[]): Promise<Condition[]> => {
    const symptomNames = selectedSymptoms.map(s => s.name);

    /* Severity, duration, per-symptom notes and the environmental factors the
       person picked. The server forwards these to Gemini only; the local ML
       model is unchanged and still scores on symptom names alone. */
    const details = selectedSymptoms.map(s => ({
      name: s.name,
      severity: s.severity,
      duration: s.duration,
      notes: s.notes,
    }));
    const response = await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symptoms: symptomNames, details, triggers }),
    });

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.statusText}`);
    }

    const data = await response.json();
    const conditionList: Condition[] = Array.isArray(data) ? data : (data.conditions || []);
    const triageData: TriageResult | null = Array.isArray(data) ? null : (data.triage || null);
    const diffData: DifferentialDiagnosisResult | null = Array.isArray(data) ? null : (data.differentialDiagnosis || null);
    
    setEngine(data.engine ?? null);
    setFallbackReason(data.fallbackReason ?? null);
    setConditions(conditionList);
    setTriage(triageData);
    setDifferentialDiagnosis(diffData);
    
    // Add to history
    if (selectedSymptoms.length > 0) {
      const newCheck: SymptomCheck = {
        id: Date.now().toString(),
        date: new Date(),
        symptoms: [...selectedSymptoms],
        conditions: conditionList,
        triggers: triggers,
        triage: triageData || undefined,
        differentialDiagnosis: diffData || undefined,
      };
      
      setHistory(prev => [newCheck, ...prev]);
    }
    
    return conditionList;
  };

  const addToHistory = (check: SymptomCheck) => {
    setHistory(prev => [check, ...prev]);
  };

  const clearHistory = () => {
    setHistory([]);
    // Clear this user's own slot, not the shared anonymous one.
    localStorage.removeItem(storageKey);
  };

  const removeFromHistory = (id: string) => {
    setHistory(prev => prev.filter(check => check.id !== id));
  };

  return (
    <SymptomContext.Provider
      value={{
        selectedSymptoms,
        addSymptom,
        removeSymptom,
        updateSymptom,
        clearSymptoms,
        analyzeSymptoms,
        conditions,
        engine,
        fallbackReason,
        triage,
        differentialDiagnosis,
        history,
        addToHistory,
        clearHistory,
        removeFromHistory,
      }}
    >
      {children}
    </SymptomContext.Provider>
  );
};

// Hook for using the symptom context
export const useSymptoms = () => useContext(SymptomContext);