import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { User, Stethoscope, Mail, Lock, Building, Award, ShieldCheck, ArrowRight, Activity } from 'lucide-react';

const MEDICAL_SPECIALTIES = [
  'Pulmonologist / Respiratory Specialist',
  'Cardiologist',
  'Neurologist',
  'Dermatologist',
  'Gastroenterologist',
  'General Physician / Internist',
  'ENT Specialist / Otolaryngologist',
  'Orthopedic / Musculoskeletal Specialist',
  'Infectious Disease Specialist',
];

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>('patient');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Doctor-specific fields
  const [specialty, setSpecialty] = useState(MEDICAL_SPECIALTIES[0]);
  const [hospital, setHospital] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [experienceYears, setExperienceYears] = useState('8');
  const [bio, setBio] = useState('');

  // Patient-specific fields
  const [age, setAge] = useState('32');
  const [gender, setGender] = useState('Female');
  const [existingConditions, setExistingConditions] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      addToast('error', 'Please provide your name and email address.');
      return;
    }

    setIsLoading(true);
    try {
      if (role === 'doctor') {
        await register({
          role: 'doctor',
          name: name.startsWith('Dr.') ? name : `Dr. ${name}`,
          email,
          specialty,
          hospital: hospital || 'MediScan Healthcare Network',
          licenseNumber: licenseNumber || `MCI-REG-${Math.floor(10000 + Math.random() * 90000)}`,
          experienceYears: parseInt(experienceYears, 10) || 5,
          bio: bio || `Specialist in ${specialty}. Board certified physician.`,
        });
        addToast('success', `Welcome Dr. ${name}! Your physician portal is active.`);
        navigate('/doctor-portal');
      } else {
        await register({
          role: 'patient',
          name,
          email,
          age: parseInt(age, 10) || 30,
          gender,
          existingConditions: existingConditions ? existingConditions.split(',').map((s) => s.trim()) : [],
          emergencyContact,
        });
        addToast('success', `Welcome ${name}! Your patient account is ready.`);
        navigate('/');
      }
    } catch {
      addToast('error', 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-teal-50/25 to-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-md shadow-teal-600/25 mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Create Your MediScan Account
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Join as a patient to track health or as a licensed doctor to review clinical assessments
          </p>
        </div>

        {/* Form Container */}
        <div className="glass-card bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xl shadow-teal-900/5">
          {/* Role Switcher */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100/90 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => setRole('patient')}
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all ${
                role === 'patient'
                  ? 'bg-white text-teal-800 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>I am a Patient</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('doctor')}
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all ${
                role === 'doctor'
                  ? 'bg-white text-teal-800 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>I am a Doctor</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Common Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === 'doctor' ? 'e.g., Aris Thorne' : 'e.g., Jane Smith'}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'doctor' ? 'doctor@hospital.org' : 'patient@gmail.com'}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all text-slate-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a secure password"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all text-slate-900"
              />
            </div>

            {/* Doctor-Specific Fields */}
            {role === 'doctor' ? (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 text-xs text-teal-800">
                  <strong>Physician Verification:</strong> Enter your medical credentials to receive clinical consultations routed by our Two-Stage Bayesian AI.
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Medical Specialty
                  </label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all text-slate-900"
                  >
                    {MEDICAL_SPECIALTIES.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Hospital / Clinic Name
                    </label>
                    <input
                      type="text"
                      value={hospital}
                      onChange={(e) => setHospital(e.target.value)}
                      placeholder="e.g., Apollo Medical Center"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      License / Registration #
                    </label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="e.g., MCI-88421"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Years of Clinical Practice
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Professional Bio
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Brief background of clinical experience and areas of sub-specialization..."
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all text-slate-900"
                  />
                </div>
              </div>
            ) : (
              /* Patient-Specific Fields */
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Age
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all text-slate-900"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Pre-Existing Medical Conditions (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={existingConditions}
                    onChange={(e) => setExistingConditions(e.target.value)}
                    placeholder="e.g., Asthma, Type 2 Diabetes, Hypertension"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Emergency Contact Number
                  </label>
                  <input
                    type="tel"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="e.g., +1 (555) 019-2834"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all text-slate-900"
                  />
                </div>
              </div>
            )}

            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm shadow-md shadow-teal-600/25 active:scale-[0.99] transition-all disabled:opacity-50"
              >
                <span>{isLoading ? 'Creating Account...' : `Complete ${role === 'doctor' ? 'Doctor' : 'Patient'} Registration`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already registered?{' '}
              <Link to="/login" className="font-bold text-teal-700 hover:text-teal-700">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
