import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth, DoctorProfile } from '../contexts/AuthContext';
import { useSymptoms } from '../contexts/SymptomContext';
import { useToast } from '../contexts/ToastContext';
import {
  Stethoscope,
  Star,
  MapPin,
  Clock,
  Award,
  Send,
  CheckCircle2,
  Filter,
  ArrowRight,
  ShieldCheck,
  Activity,
  AlertCircle,
  X,
} from 'lucide-react';

const SPECIALTY_FILTERS = [
  'All Specialists',
  'Pulmonologist',
  'Cardiologist',
  'Neurologist',
  'Dermatologist',
  'Gastroenterologist',
  'General Physician',
];

const DoctorDirectoryPage: React.FC = () => {
  const { doctors, requestConsultation, currentUser } = useAuth();
  const { history, conditions } = useSymptoms();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const specialtyParam = searchParams.get('specialty') || 'All Specialists';
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(specialtyParam);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Consultation Modal State
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [chiefComplaint, setChiefComplaint] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [attachLatestCheck, setAttachLatestCheck] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync with URL parameter
  useEffect(() => {
    const param = searchParams.get('specialty');
    if (param) {
      // Find matching filter
      const match = SPECIALTY_FILTERS.find((f) => f.toLowerCase().includes(param.toLowerCase()));
      if (match) {
        setSelectedSpecialty(match);
      } else {
        setSelectedSpecialty(param);
      }
    }
  }, [searchParams]);

  // Latest check for sharing
  const latestCheck = history.length > 0 ? history[0] : null;

  // Filter doctors
  const filteredDoctors = doctors.filter((doc) => {
    const matchesSpecialty =
      selectedSpecialty === 'All Specialists' ||
      doc.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase());

    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.hospital.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSpecialty && matchesSearch;
  });

  const handleOpenConsultation = (doctor: DoctorProfile) => {
    setSelectedDoctor(doctor);
    if (latestCheck && latestCheck.symptoms.length > 0) {
      const topSymptoms = latestCheck.symptoms.map((s) => s.name).join(', ');
      setChiefComplaint(`Evaluation for ${topSymptoms}`);
    } else {
      setChiefComplaint('General diagnostic follow-up');
    }
  };

  const handleSendConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    if (!chiefComplaint.trim()) {
      addToast('error', 'Please enter your chief complaint / reason for consultation.');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestConsultation(
        selectedDoctor.id,
        chiefComplaint,
        notes,
        attachLatestCheck && latestCheck ? latestCheck : undefined
      );

      addToast(
        'success',
        `Consultation request and clinical health data sent to ${selectedDoctor.name}.`
      );
      setSelectedDoctor(null);
      navigate('/my-consultations');
    } catch {
      addToast('error', 'Failed to submit consultation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
                Specialist Medical Directory
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.8125rem] font-semibold bg-[rgb(var(--app-raised))] text-[rgb(var(--ink))] border border-[rgb(var(--app-border))]">
                Verified Doctors
              </span>
            </div>
            <p className="text-sm text-[rgb(var(--ink-soft))] mt-1">
              Select verified specialists aligned with your Stage 1 Bayesian Organ System Triage
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/my-consultations"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200/90 text-slate-700 hover:border-[rgb(var(--app-border))] text-[0.8125rem] font-semibold transition-colors"
            >
              <Activity className="w-4 h-4 text-[rgb(var(--ink))]" />
              <span>My Consultations</span>
            </Link>
          </div>
        </div>

        {/* Triage Referral Alert (If coming with a specialty recommendation) */}
        {searchParams.get('specialty') && (
          <div className="p-4 rounded-lg border border-[rgb(var(--app-border))]/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[rgb(var(--ink))] text-white flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-grow">
              <h3 className="text-sm font-bold text-teal-950">
                AI Diagnostic Triage Referral: {searchParams.get('specialty')}
              </h3>
              <p className="text-[0.8125rem] text-[rgb(var(--ink))]/80 mt-0.5">
                Our Stage 1 Bayesian inference model detected primary organ system alignment with{' '}
                <strong>{searchParams.get('specialty')}</strong>. Doctors below specialize in treating these symptoms.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchParams({});
                setSelectedSpecialty('All Specialists');
              }}
              className="text-[0.8125rem] font-semibold text-[rgb(var(--ink))] hover:underline shrink-0"
            >
              Clear Filter
            </button>
          </div>
        )}

        {/* Specialty Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {SPECIALTY_FILTERS.map((spec) => (
            <button
              key={spec}
              onClick={() => {
                setSelectedSpecialty(spec);
                if (spec === 'All Specialists') {
                  setSearchParams({});
                } else {
                  setSearchParams({ specialty: spec });
                }
              }}
              className={`px-3.5 py-1.5 rounded-lg text-[0.8125rem] font-semibold transition-colors border ${
 selectedSpecialty.toLowerCase() === spec.toLowerCase()
 ? 'bg-[rgb(var(--ink))] text-white border-[rgb(var(--app-border))] '
 : 'bg-white text-slate-600 border-slate-200 hover:bg-[rgb(var(--app-ground))]'
 }`}
            >
              {spec}
            </button>
          ))}
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="app-panel bg-white/95 rounded-lg border border-slate-200/90 hover:border-[rgb(var(--app-border))] transition-colors flex flex-col justify-between p-5"
            >
              <div className="space-y-3">
                {/* Doctor Avatar & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-[rgb(var(--ink))] hover:bg-[rgb(var(--field-low))] w-12 h-12 rounded-lg text-white flex items-center justify-center font-bold text-lg">
                      {doc.name.replace('Dr. ', '').charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base leading-snug">{doc.name}</h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[rgb(var(--app-raised))] text-[rgb(var(--ink))] border border-teal-100">
                        {doc.specialty}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg text-amber-700 text-[0.8125rem] font-bold">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>{doc.rating}</span>
                  </div>
                </div>

                {/* Hospital & Credentials */}
                <div className="space-y-1.5 pt-1 text-[0.8125rem] text-[rgb(var(--ink-soft))]">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[rgb(var(--ink-soft))] shrink-0" />
                    <span className="truncate">{doc.hospital}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-[rgb(var(--ink-soft))] shrink-0" />
                    <span>{doc.experienceYears} Years Clinical Experience • {doc.licenseNumber}</span>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-[0.8125rem] text-slate-600 leading-relaxed line-clamp-2">
                  {doc.bio}
                </p>

                {/* Availability */}
                <div className="flex items-center gap-1.5 pt-1 text-[11px] text-[rgb(var(--ink-soft))]">
                  <Clock className="w-3 h-3 text-[rgb(var(--ink-soft))]" />
                  <span>Available: {doc.availableDays.join(', ')}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-5 mt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleOpenConsultation(doc)}
                  className="bg-[rgb(var(--ink))] hover:bg-[rgb(var(--field-low))] w-full flex items-center justify-center gap-2 py-2.5 px-4 text-white font-semibold text-[0.8125rem] rounded-lg active:scale-[0.99] transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Consult & Share Health Data</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredDoctors.length === 0 && (
          <div className="text-center py-16 px-4 bg-white/60 rounded-lg border border-dashed border-slate-200">
            <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Doctors Found</h3>
            <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))] mt-1">
              Try adjusting your specialty filter or clear your search criteria.
            </p>
          </div>
        )}
      </div>

      {/* Consultation Request Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[rgb(var(--app-raised))] text-[rgb(var(--ink))] flex items-center justify-center font-bold text-base">
                  Dr
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Request Consultation</h3>
                  <p className="text-[0.8125rem] text-[rgb(var(--ink))] font-medium">
                    With {selectedDoctor.name} ({selectedDoctor.specialty})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoctor(null)}
                className="p-1 rounded-lg text-[rgb(var(--ink-soft))] hover:text-slate-600 hover:bg-[rgb(var(--app-raised))]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendConsultation} className="space-y-4">
              {/* Patient Diagnostic Data Attachment Card */}
              {latestCheck ? (
                <div className="p-3.5 rounded-lg bg-[rgb(var(--app-ground))] border border-slate-200 text-[0.8125rem] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 text-[0.8125rem]">
                      Diagnostic Snapshot to Share
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={attachLatestCheck}
                        onChange={(e) => setAttachLatestCheck(e.target.checked)}
                        className="rounded text-[rgb(var(--ink))] focus:ring-[rgb(var(--app-border))]"
                      />
                      <span className="text-[11px] text-[rgb(var(--ink))] font-semibold">Attach Assessment</span>
                    </label>
                  </div>

                  {attachLatestCheck && (
                    <div className="space-y-1.5 pt-1 text-slate-600 border-t border-slate-200/60">
                      <p>
                        <strong>Reported Symptoms:</strong>{' '}
                        {latestCheck.symptoms.map((s) => s.name).join(', ')}
                      </p>
                      {latestCheck.conditions.length > 0 && (
                        <p>
                          <strong>Top Differential:</strong>{' '}
                          {latestCheck.conditions[0].name} (
                          {Math.round(latestCheck.conditions[0].probability * 100)}% match)
                        </p>
                      )}
                      <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))]">
                        Date: {new Date(latestCheck.date).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[0.8125rem] text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>No completed symptom assessment found. You can still send a consultation request.</span>
                </div>
              )}

              <div>
                <label className="block text-[0.8125rem] font-bold text-slate-700 mb-1.5">
                  Chief Complaint / Primary Concern
                </label>
                <input
                  type="text"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="e.g., Severe morning cough and chest tightness"
                  className="w-full px-3.5 py-2.5 text-sm bg-[rgb(var(--app-ground))] border border-slate-200 rounded-lg focus:outline-none focus:border-[rgb(var(--app-border))] focus:ring-4 focus:ring-[rgb(var(--app-border))]/10 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-[0.8125rem] font-bold text-slate-700 mb-1.5">
                  Additional Notes for the Doctor (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Mention medication history, onset duration, or specific questions for the physician..."
                  className="w-full px-3.5 py-2.5 text-sm bg-[rgb(var(--app-ground))] border border-slate-200 rounded-lg focus:outline-none focus:border-[rgb(var(--app-border))] focus:ring-4 focus:ring-[rgb(var(--app-border))]/10 transition-colors"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedDoctor(null)}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-[0.8125rem] font-semibold hover:bg-[rgb(var(--app-ground))]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[rgb(var(--ink))] hover:bg-[rgb(var(--field-low))] flex items-center gap-2 px-5 py-2.5 text-white text-[0.8125rem] font-bold rounded-lg active:scale-[0.99] transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Sending Request...' : 'Send Consultation Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDirectoryPage;
