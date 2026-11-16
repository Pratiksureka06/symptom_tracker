import React, { createContext, useState, useContext, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
}

export interface MedicationLog {
  id: string;
  date: Date;
  medication: Medication;
  taken: boolean;
}

interface MedicationContextType {
  medications: Medication[];
  addMedication: (medication: Medication) => void;
  removeMedication: (id: string) => void;
  medicationLog: MedicationLog[];
  logMedication: (log: MedicationLog) => void;
}

// localStorage helpers
const MEDS_KEY = 'mediscan_medications';
const MEDS_LOG_KEY = 'mediscan_medication_log';

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      // Restore Date objects if present
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          ...item,
          ...(item.date ? { date: new Date(item.date) } : {}),
        })) as T;
      }
      return parsed;
    }
  } catch (e) {
    console.error(`Failed to load ${key} from localStorage:`, e);
  }
  return fallback;
};

const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage:`, e);
  }
};

const MedicationContext = createContext<MedicationContextType>({
  medications: [],
  addMedication: () => {},
  removeMedication: () => {},
  medicationLog: [],
  logMedication: () => {},
});

export const MedicationProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  /* Medicines are per user for the same reason history is: one global key
     meant a doctor signing in on this device saw the patient's medicines. */
  const { currentUser } = useAuth();
  const medsKey = currentUser ? `${MEDS_KEY}:${currentUser.id}` : MEDS_KEY;
  const logKey = currentUser ? `${MEDS_LOG_KEY}:${currentUser.id}` : MEDS_LOG_KEY;

  const [medications, setMedications] = useState<Medication[]>(() => loadFromStorage(medsKey, []));
  const [medicationLog, setMedicationLog] = useState<MedicationLog[]>(() => loadFromStorage(logKey, []));

  // The scope the in-memory state belongs to; see SymptomContext for why.
  // Null on first render so the effect below runs and can adopt legacy data.
  const loadedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (loadedKeyRef.current === medsKey) return;

    let meds = loadFromStorage<Medication[]>(medsKey, []);
    let log = loadFromStorage<MedicationLog[]>(logKey, []);

    // Adopt anonymous entries the first time a patient signs in.
    if (currentUser?.role === 'patient' && localStorage.getItem(medsKey) === null) {
      const anonMeds = loadFromStorage<Medication[]>(MEDS_KEY, []);
      const anonLog = loadFromStorage<MedicationLog[]>(MEDS_LOG_KEY, []);
      if (anonMeds.length > 0) meds = anonMeds;
      if (anonLog.length > 0) log = anonLog;
    }

    setMedications(meds);
    setMedicationLog(log);
    loadedKeyRef.current = medsKey;
  }, [medsKey, logKey, currentUser?.role]);

  // Persist to localStorage on changes, into this user's own scope.
  useEffect(() => {
    if (loadedKeyRef.current !== medsKey) return;
    saveToStorage(medsKey, medications);
  }, [medications, medsKey]);

  useEffect(() => {
    if (loadedKeyRef.current !== medsKey) return;
    saveToStorage(logKey, medicationLog);
  }, [medicationLog, logKey, medsKey]);

  const addMedication = (medication: Medication) => {
    setMedications(prev => [...prev, medication]);
  };

  const removeMedication = (id: string) => {
    setMedications(prev => prev.filter(med => med.id !== id));
  };

  const logMedication = (log: MedicationLog) => {
    setMedicationLog(prev => [log, ...prev]);
  };

  return (
    <MedicationContext.Provider
      value={{
        medications,
        addMedication,
        removeMedication,
        medicationLog,
        logMedication,
      }}
    >
      {children}
    </MedicationContext.Provider>
  );
};

export const useMedication = () => useContext(MedicationContext);
