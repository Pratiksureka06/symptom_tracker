import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

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

// localStorage helpers
const HISTORY_KEY = 'mediscan_history';

const loadHistory = (): SymptomCheck[] => {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
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

const saveHistory = (history: SymptomCheck[]) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
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
  const [history, setHistory] = useState<SymptomCheck[]>(() => loadHistory());

  // Persist history to localStorage whenever it changes
  useEffect(() => {
    saveHistory(history);
  }, [history]);

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
    const response = await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symptoms: symptomNames }),
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
    localStorage.removeItem(HISTORY_KEY);
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