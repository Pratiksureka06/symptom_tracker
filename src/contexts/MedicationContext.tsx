import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

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
  const [medications, setMedications] = useState<Medication[]>(() => loadFromStorage(MEDS_KEY, []));
  const [medicationLog, setMedicationLog] = useState<MedicationLog[]>(() => loadFromStorage(MEDS_LOG_KEY, []));

  // Persist to localStorage on changes
  useEffect(() => {
    saveToStorage(MEDS_KEY, medications);
  }, [medications]);

  useEffect(() => {
    saveToStorage(MEDS_LOG_KEY, medicationLog);
  }, [medicationLog]);

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
