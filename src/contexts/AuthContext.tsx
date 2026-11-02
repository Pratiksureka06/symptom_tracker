import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SymptomCheck } from './SymptomContext';

export type UserRole = 'patient' | 'doctor';

export interface DoctorProfile {
  id: string;
  name: string;
  email: string;
  role: 'doctor';
  specialty: string;
  hospital: string;
  licenseNumber: string;
  experienceYears: number;
  rating: number;
  avatarUrl?: string;
  bio: string;
  availableDays: string[];
}

export interface PatientProfile {
  id: string;
  name: string;
  email: string;
  role: 'patient';
  age?: number;
  gender?: string;
  existingConditions?: string[];
  emergencyContact?: string;
}

export type User = DoctorProfile | PatientProfile;

export interface ConsultationRecord {
  id: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  date: string;
  status: 'pending' | 'reviewed' | 'followup';
  chiefComplaint: string;
  notes?: string;
  symptomCheckSnapshot?: SymptomCheck;
  doctorNotes?: string;
  prescriptions?: string;
  reviewedAt?: string;
}

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  doctors: DoctorProfile[];
  consultations: ConsultationRecord[];
  login: (email: string, role: UserRole) => Promise<boolean>;
  register: (userData: Partial<DoctorProfile | PatientProfile>) => Promise<boolean>;
  logout: () => void;
  loginAsDemo: (role: UserRole, doctorSpecialty?: string) => void;
  requestConsultation: (
    doctorId: string,
    chiefComplaint: string,
    notes?: string,
    symptomCheck?: SymptomCheck
  ) => Promise<ConsultationRecord>;
  reviewConsultation: (
    consultationId: string,
    doctorNotes: string,
    prescriptions?: string
  ) => Promise<void>;
  getDoctorById: (id: string) => DoctorProfile | undefined;
}

// Initial clinical doctors pre-seeded across Stage 1 organ specialties
export const SEED_DOCTORS: DoctorProfile[] = [
  {
    id: 'doc-1',
    name: 'Dr. Aris Thorne, MD',
    email: 'dr.thorne@mediscan.org',
    role: 'doctor',
    specialty: 'Pulmonologist / Respiratory Specialist',
    hospital: 'Apollo Institute of Chest Diseases',
    licenseNumber: 'MCI-PULM-88421',
    experienceYears: 14,
    rating: 4.9,
    bio: 'Senior Pulmonologist specializing in chronic obstructive pulmonary disease, asthma, and severe bronchial pathology.',
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  },
  {
    id: 'doc-2',
    name: 'Dr. Sarah Lin, MD, FACC',
    email: 'dr.lin@mediscan.org',
    role: 'doctor',
    specialty: 'Cardiologist',
    hospital: 'Fortis Memorial Heart Institute',
    licenseNumber: 'MCI-CARD-92144',
    experienceYears: 16,
    rating: 4.95,
    bio: 'Consultant Interventional Cardiologist specializing in ischemic heart diseases, arrhythmias, and hypertension management.',
    availableDays: ['Mon', 'Wed', 'Fri', 'Sat'],
  },
  {
    id: 'doc-3',
    name: 'Dr. Marcus Patel, MD, DM',
    email: 'dr.patel@mediscan.org',
    role: 'doctor',
    specialty: 'Neurologist',
    hospital: 'Max Super Speciality Neuro Centre',
    licenseNumber: 'MCI-NEUR-77312',
    experienceYears: 12,
    rating: 4.88,
    bio: 'Specialist in migraine syndromes, neuromuscular disorders, neuropathy, and cerebrovascular risk evaluation.',
    availableDays: ['Tue', 'Thu', 'Fri', 'Sat'],
  },
  {
    id: 'doc-4',
    name: 'Dr. Elena Gomez, MD',
    email: 'dr.gomez@mediscan.org',
    role: 'doctor',
    specialty: 'Dermatologist',
    hospital: 'Apex Clinical Dermatology Center',
    licenseNumber: 'MCI-DERM-65901',
    experienceYears: 9,
    rating: 4.85,
    bio: 'Expert in allergic dermatoses, eczema, psoriasis, autoimmune cutaneous presentations, and systemic manifestations.',
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu'],
  },
  {
    id: 'doc-5',
    name: 'Dr. Vikram Sen, MD, DM',
    email: 'dr.sen@mediscan.org',
    role: 'doctor',
    specialty: 'Gastroenterologist',
    hospital: 'Medanta Digestive Health Institute',
    licenseNumber: 'MCI-GAST-54320',
    experienceYears: 15,
    rating: 4.92,
    bio: 'Senior Gastroenterologist and Hepatologist focusing on peptic conditions, inflammatory bowel syndromes, and biliary health.',
    availableDays: ['Mon', 'Wed', 'Thu', 'Sat'],
  },
  {
    id: 'doc-6',
    name: 'Dr. Priya Sharma, MBBS, MD',
    email: 'dr.sharma@mediscan.org',
    role: 'doctor',
    specialty: 'General Physician / Internist',
    hospital: 'City Central Healthcare Hospital',
    licenseNumber: 'MCI-GENM-31980',
    experienceYears: 11,
    rating: 4.8,
    bio: 'Broad-spectrum Internal Medicine specialist focusing on multi-system illness, metabolic disorders, and primary clinical triage.',
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  },
];

export const DEMO_PATIENT: PatientProfile = {
  id: 'patient-demo-1',
  name: 'Ananya Rao',
  email: 'john.doe@patient.mediscan.org',
  role: 'patient',
  age: 42,
  gender: 'Male',
  existingConditions: ['Hypertension (Mild)', 'Seasonal Allergic Rhinitis'],
  emergencyContact: '+91 98204 11732',
};

const AUTH_USER_KEY = 'mediscan_auth_user';
const CONSULTATIONS_KEY = 'mediscan_consultations';
const DOCTORS_KEY = 'mediscan_doctors_registry';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize current user from localStorage
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_USER_KEY);
      return stored ? JSON.parse(stored) : DEMO_PATIENT; // Default to demo patient for uninterrupted immediate experience
    } catch {
      return DEMO_PATIENT;
    }
  });

  // Initialize doctors registry
  const [doctors, setDoctors] = useState<DoctorProfile[]>(() => {
    try {
      const stored = localStorage.getItem(DOCTORS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.length > 0 ? parsed : SEED_DOCTORS;
      }
    } catch {
      // fallback
    }
    return SEED_DOCTORS;
  });

  // Initialize consultations
  const [consultations, setConsultations] = useState<ConsultationRecord[]>(() => {
    try {
      const stored = localStorage.getItem(CONSULTATIONS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    // Seed initial consultation for demonstration
    return [
      {
        id: 'cons-demo-1',
        patientId: DEMO_PATIENT.id,
        patientName: DEMO_PATIENT.name,
        patientAge: DEMO_PATIENT.age,
        patientGender: DEMO_PATIENT.gender,
        doctorId: SEED_DOCTORS[0].id,
        doctorName: SEED_DOCTORS[0].name,
        doctorSpecialty: SEED_DOCTORS[0].specialty,
        date: new Date(Date.now() - 3600000 * 24).toISOString(),
        status: 'reviewed',
        chiefComplaint: 'Persistent cough with mild exertional dyspnea for 10 days',
        notes: 'Worsens during early morning hours and colder weather.',
        symptomCheckSnapshot: {
          id: 'snap-1',
          date: new Date(Date.now() - 3600000 * 24),
          symptoms: [
            { id: 's1', name: 'Cough', severity: 'moderate', duration: '1-2 weeks' },
            { id: 's2', name: 'Shortness of breath', severity: 'moderate', duration: '3-7 days' },
            { id: 's3', name: 'Fatigue', severity: 'mild', duration: '1-2 weeks' },
          ],
          triggers: ['Cold Air', 'Dust'],
          conditions: [
            {
              id: 'c1',
              name: 'Chronic Obstructive Pulmonary Disease',
              probability: 0.88,
              urgency: 'high',
              description: 'Progressive lung disease causing airflow limitation and breathing difficulty.',
              commonSymptoms: ['Cough', 'Shortness of breath', 'Fatigue'],
              treatments: ['Bronchodilators', 'Pulmonary rehabilitation'],
            },
            {
              id: 'c2',
              name: 'Bronchial Asthma',
              probability: 0.79,
              urgency: 'medium',
              description: 'Inflammatory disease of airways characterized by reversible obstruction.',
              commonSymptoms: ['Cough', 'Shortness of breath', 'Wheezing'],
              treatments: ['Inhaled corticosteroids'],
            },
          ],
        },
        doctorNotes:
          'Patient presents with subacute bronchial airway hyperresponsiveness. Spirometry recommended to evaluate FEV1/FVC ratio. Prescribed Budesonide/Formoterol inhaler 200mcg BID for 14 days.',
        prescriptions: 'Budesonide/Formoterol 200/6mcg DPI, 1 puff twice daily; Montelukast 10mg PO qHS.',
        reviewedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
    ];
  });

  // Sync to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(CONSULTATIONS_KEY, JSON.stringify(consultations));
  }, [consultations]);

  useEffect(() => {
    localStorage.setItem(DOCTORS_KEY, JSON.stringify(doctors));
  }, [doctors]);

  const login = async (email: string, role: UserRole): Promise<boolean> => {
    if (role === 'doctor') {
      const foundDoctor = doctors.find((d) => d.email.toLowerCase() === email.toLowerCase());
      if (foundDoctor) {
        setCurrentUser(foundDoctor);
        return true;
      }
      // If doctor not found in seed, create temporary doctor session
      const newDoc: DoctorProfile = {
        id: `doc-${Date.now()}`,
        name: email.split('@')[0].replace('.', ' ').toUpperCase(),
        email,
        role: 'doctor',
        specialty: 'General Physician / Internist',
        hospital: 'Clinical Health Network',
        licenseNumber: `MCI-${Math.floor(10000 + Math.random() * 90000)}`,
        experienceYears: 8,
        rating: 4.8,
        bio: 'Board-certified consulting physician.',
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      };
      setDoctors((prev) => [...prev, newDoc]);
      setCurrentUser(newDoc);
      return true;
    } else {
      // Patient login
      const patient: PatientProfile = {
        id: `patient-${Date.now()}`,
        name: email.split('@')[0].replace('.', ' ').replace(/^\w/, (c) => c.toUpperCase()),
        email,
        role: 'patient',
        age: 35,
        gender: 'Not specified',
      };
      setCurrentUser(patient);
      return true;
    }
  };

  const register = async (userData: Partial<DoctorProfile | PatientProfile>): Promise<boolean> => {
    if (userData.role === 'doctor') {
      const newDoctor: DoctorProfile = {
        id: `doc-${Date.now()}`,
        name: userData.name || 'Dr. Physician',
        email: userData.email || '',
        role: 'doctor',
        specialty: userData.specialty || 'General Physician',
        hospital: userData.hospital || 'MediScan Clinical Network',
        licenseNumber: userData.licenseNumber || `MCI-${Math.floor(10000 + Math.random() * 90000)}`,
        experienceYears: userData.experienceYears || 5,
        rating: 4.9,
        bio: userData.bio || 'Consulting physician providing clinical assessments.',
        availableDays: userData.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      };
      setDoctors((prev) => [...prev, newDoctor]);
      setCurrentUser(newDoctor);
      return true;
    } else {
      const newPatient: PatientProfile = {
        id: `patient-${Date.now()}`,
        name: userData.name || 'Patient',
        email: userData.email || '',
        role: 'patient',
        age: userData.age,
        gender: userData.gender,
        existingConditions: (userData as PatientProfile).existingConditions || [],
        emergencyContact: (userData as PatientProfile).emergencyContact || '',
      };
      setCurrentUser(newPatient);
      return true;
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const loginAsDemo = (role: UserRole, doctorSpecialty?: string) => {
    if (role === 'doctor') {
      const match = doctorSpecialty
        ? doctors.find((d) => d.specialty.toLowerCase().includes(doctorSpecialty.toLowerCase())) || doctors[0]
        : doctors[0];
      setCurrentUser(match);
    } else {
      setCurrentUser(DEMO_PATIENT);
    }
  };

  const requestConsultation = async (
    doctorId: string,
    chiefComplaint: string,
    notes?: string,
    symptomCheck?: SymptomCheck
  ): Promise<ConsultationRecord> => {
    const doctor = doctors.find((d) => d.id === doctorId) || doctors[0];
    const patient = currentUser && currentUser.role === 'patient' ? currentUser : DEMO_PATIENT;

    const newConsultation: ConsultationRecord = {
      id: `cons-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      patientAge: (patient as PatientProfile).age,
      patientGender: (patient as PatientProfile).gender,
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty,
      date: new Date().toISOString(),
      status: 'pending',
      chiefComplaint,
      notes,
      symptomCheckSnapshot: symptomCheck,
    };

    setConsultations((prev) => [newConsultation, ...prev]);

    // Attempt background sync with backend if running
    try {
      const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
      fetch(`${apiUrl}/api/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConsultation),
      }).catch(() => {});
    } catch {}

    return newConsultation;
  };

  const reviewConsultation = async (
    consultationId: string,
    doctorNotes: string,
    prescriptions?: string
  ): Promise<void> => {
    setConsultations((prev) =>
      prev.map((item) =>
        item.id === consultationId
          ? {
              ...item,
              status: 'reviewed',
              doctorNotes,
              prescriptions,
              reviewedAt: new Date().toISOString(),
            }
          : item
      )
    );

    // Attempt background sync with backend
    try {
      const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
      fetch(`${apiUrl}/api/consultations/${consultationId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorNotes, prescriptions }),
      }).catch(() => {});
    } catch {}
  };

  const getDoctorById = (id: string): DoctorProfile | undefined => {
    return doctors.find((d) => d.id === id);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        doctors,
        consultations,
        login,
        register,
        logout,
        loginAsDemo,
        requestConsultation,
        reviewConsultation,
        getDoctorById,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
