import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, ConsultationRecord, DoctorProfile } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  Stethoscope,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Activity,
  FileText,
  Search,
  Filter,
  Eye,
  Pill,
  Send,
  X,
  Calendar,
  ShieldCheck,
  Download,
} from 'lucide-react';
import jsPDF from 'jspdf';

const DoctorPortalPage: React.FC = () => {
  const { currentUser, consultations, reviewConsultation, loginAsDemo } = useAuth();
  const { addToast } = useToast();

  const isDoctor = currentUser?.role === 'doctor';
  const doctor = isDoctor ? (currentUser as DoctorProfile) : null;

  // Filter & Search
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Dossier for Review Modal
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationRecord | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [prescriptions, setPrescriptions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user is not logged in as a doctor, show clinical access gate with one-click doctor sign-in
  if (!isDoctor) {
    return (
      <div className="min-h-[calc(100vh-4rem)] py-16 px-4 flex items-center justify-center">
        <div className="app-panel bg-white/95 max-w-lg w-full p-8 rounded-lg border border-slate-200 text-center space-y-5">
          <div className="w-16 h-16 rounded-lg bg-[rgb(var(--app-raised))] border border-[rgb(var(--app-border))] text-[rgb(var(--ink))] flex items-center justify-center mx-auto">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div>
            <h1 className="app-title">Sign in as a doctor</h1>
            <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))] mt-1 max-w-sm mx-auto">
              This clinical dashboard is restricted to licensed medical practitioners to inspect patient triage data, Bayesian differential diagnoses, and issue clinical orders.
            </p>
          </div>

          <div className="pt-2 space-y-2.5">
            <button
              onClick={() => loginAsDemo('doctor', 'Pulmonologist')}
              className="bg-[rgb(var(--ink))] hover:bg-[rgb(var(--field-low))] w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-white font-bold text-[0.8125rem] active:scale-[0.99] transition-colors"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Sign In as Demo Physician (Dr. Aris Thorne, Pulmonologist)</span>
            </button>

            <Link
              to="/login"
              className="block py-2 text-[0.8125rem] font-semibold text-slate-600 hover:text-[rgb(var(--ink))] transition-colors"
            >
              Or Sign in with Custom Doctor Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* Only the consultations addressed to the signed-in doctor.
     This previously read `c.doctorId === doctor?.id || true`, and the
     `|| true` short-circuited the whole test, so every doctor saw every
     other doctor's patients. */
  const doctorConsultations = consultations.filter((c) => c.doctorId === doctor?.id);

  const pendingCount = doctorConsultations.filter((c) => c.status === 'pending').length;
  const reviewedCount = doctorConsultations.filter((c) => c.status === 'reviewed').length;

  /* The portal opens on people, not on a flat queue: one row per patient
     who has consulted this doctor, most recent first. */
  interface PatientRow {
    id: string;
    name: string;
    age?: number;
    gender?: string;
    total: number;
    pending: number;
    last: string;
  }

  const patientMap = new Map<string, PatientRow>();
  for (const c of doctorConsultations) {
    const row = patientMap.get(c.patientId) ?? {
      id: c.patientId,
      name: c.patientName,
      age: c.patientAge,
      gender: c.patientGender,
      total: 0,
      pending: 0,
      last: c.date,
    };
    row.total += 1;
    if (c.status === 'pending') row.pending += 1;
    if (new Date(c.date) > new Date(row.last)) row.last = c.date;
    patientMap.set(c.patientId, row);
  }

  const patients = [...patientMap.values()]
    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => new Date(b.last).getTime() - new Date(a.last).getTime());

  const openPatient = selectedPatientId
    ? patientMap.get(selectedPatientId) ?? null
    : null;

  /* That patient's own history with this doctor, newest first. */
  const patientConsultations = openPatient
    ? doctorConsultations
        .filter((c) => c.patientId === openPatient.id)
        .filter((c) => (filterStatus === 'all' ? true : c.status === filterStatus))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const openPatientPending = openPatient
    ? doctorConsultations.filter((c) => c.patientId === openPatient.id && c.status === 'pending').length
    : 0;
  const openPatientReviewed = openPatient
    ? doctorConsultations.filter((c) => c.patientId === openPatient.id && c.status === 'reviewed').length
    : 0;

  const handleOpenDossier = (consultation: ConsultationRecord) => {
    setSelectedConsultation(consultation);
    setDoctorNotes(consultation.doctorNotes || '');
    setPrescriptions(consultation.prescriptions || '');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsultation) return;
    if (!doctorNotes.trim()) {
      addToast('error', 'Please enter your clinical observations or recommendations.');
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewConsultation(selectedConsultation.id, doctorNotes, prescriptions);
      addToast('success', `Clinical review submitted for patient ${selectedConsultation.patientName}.`);
      setSelectedConsultation(null);
    } catch {
      addToast('error', 'Failed to save review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportConsultationPDF = (c: ConsultationRecord) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("MediScan — Official Doctor Consultation Report", 20, 15);
      doc.setFontSize(10);
      doc.text(`Consultant: ${doctor?.name} (${doctor?.specialty})`, 20, 22);
      doc.text(`Hospital: ${doctor?.hospital} | License: ${doctor?.licenseNumber}`, 20, 27);
      doc.line(20, 30, 190, 30);

      let y = 38;
      doc.setFont('helvetica', 'bold');
      doc.text("Patient Information:", 20, y);
      doc.setFont('helvetica', 'normal');
      y += 6;
      doc.text(`Name: ${c.patientName} | Age: ${c.patientAge || 'N/A'} | Gender: ${c.patientGender || 'N/A'}`, 25, y);
      y += 6;
      doc.text(`Consultation Date: ${new Date(c.date).toLocaleString()}`, 25, y);
      y += 6;
      doc.text(`Chief Complaint: ${c.chiefComplaint}`, 25, y);
      y += 10;

      if (c.symptomCheckSnapshot) {
        doc.setFont('helvetica', 'bold');
        doc.text("AI Diagnostic Triage Snapshot:", 20, y);
        doc.setFont('helvetica', 'normal');
        y += 6;
        const syms = c.symptomCheckSnapshot.symptoms.map(s => s.name).join(', ');
        doc.text(`Reported Symptoms: ${syms}`, 25, y);
        y += 6;
        if (c.symptomCheckSnapshot.conditions.length > 0) {
          doc.text("Top-3 Differential Conditions:", 25, y);
          y += 5;
          c.symptomCheckSnapshot.conditions.slice(0, 3).forEach((cond, idx) => {
            doc.text(`  ${idx + 1}. ${cond.name} — ${Math.round(cond.probability * 100)}% match [${cond.urgency}]`, 30, y);
            y += 5;
          });
        }
        y += 6;
      }

      doc.setFont('helvetica', 'bold');
      doc.text("Doctor Clinical Observations & Recommendations:", 20, y);
      doc.setFont('helvetica', 'normal');
      y += 6;
      doc.text(c.doctorNotes || 'Pending clinician input', 25, y, { maxWidth: 160 });
      y += 20;

      if (c.prescriptions) {
        doc.setFont('helvetica', 'bold');
        doc.text("Prescribed Medication / Therapy:", 20, y);
        doc.setFont('helvetica', 'normal');
        y += 6;
        doc.text(c.prescriptions, 25, y, { maxWidth: 160 });
        y += 20;
      }

      doc.line(20, y, 190, y);
      y += 10;
      doc.text(`Electronically Signed: ${doctor?.name}`, 20, y);
      doc.text(`Date of Review: ${c.reviewedAt ? new Date(c.reviewedAt).toLocaleString() : new Date().toLocaleString()}`, 20, y + 5);

      doc.save(`mediscan-clinical-consultation-${c.patientName.replace(/\s+/g, '_')}.pdf`);
      addToast('success', 'Doctor Consultation Report exported as PDF.');
    } catch {
      addToast('error', 'Failed to generate PDF.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Doctor Identity Header */}
        <div className="app-panel bg-white/95 rounded-lg border border-teal-100/80 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-[rgb(var(--ink))] hover:bg-[rgb(var(--field-low))] w-14 h-14 rounded-lg text-white flex items-center justify-center font-bold text-xl shrink-0">
              <Stethoscope className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="app-title">
                  {doctor?.name}
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.8125rem] font-bold bg-[rgb(var(--app-raised))] text-[rgb(var(--ink))] border border-[rgb(var(--app-border))]">
                  Licensed Clinician
                </span>
              </div>
              <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))] mt-1">
                {doctor?.specialty} • {doctor?.hospital} • License: {doctor?.licenseNumber}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3.5 py-2 rounded-lg bg-[rgb(var(--app-ground))] border border-slate-200 text-center">
              <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))]">Total Consults</p>
              <p className="text-base font-bold text-slate-800">{doctorConsultations.length}</p>
            </div>
            <div className="px-3.5 py-2 rounded-lg bg-amber-50 border border-amber-200 text-center">
              <p className="text-[0.8125rem] text-amber-700">Pending Review</p>
              <p className="text-base font-bold text-amber-900">{pendingCount}</p>
            </div>
            <div className="px-3.5 py-2 rounded-lg bg-[rgb(var(--app-raised))] border border-[rgb(var(--app-border))] text-center">
              <p className="text-[0.8125rem] text-[rgb(var(--ink))]">Completed</p>
              <p className="text-base font-bold text-[rgb(var(--ink))]">{reviewedCount}</p>
            </div>
          </div>
        </div>

        {/* Your patients. The portal opens on people, not on a queue. */}
        {!openPatient && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="app-section-title">Your patients ({patients.length})</h2>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-[rgb(var(--ink-soft))] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your patients..."
                  className="w-full pl-9 pr-3 py-1.5 text-[0.8125rem] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[rgb(var(--app-border))] text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-2">
              {patients.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedPatientId(p.id);
                    setFilterStatus('all');
                    setSearchQuery('');
                  }}
                  className="w-full text-left app-panel rounded-lg p-5 hover:bg-[rgb(var(--app-raised))] transition-colors flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-800 text-base">{p.name}</span>
                      {p.age !== undefined && (
                        <span className="text-[0.8125rem] text-[rgb(var(--ink-soft))]">
                          {p.age}y{p.gender ? ` • ${p.gender}` : ''}
                        </span>
                      )}
                      {p.pending > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.8125rem] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          {p.pending} waiting
                        </span>
                      )}
                    </div>
                    <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))] mt-1">
                      {p.total} consultation{p.total === 1 ? '' : 's'} with you • last on{' '}
                      {new Date(p.last).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-[0.8125rem] font-semibold text-[rgb(var(--ink))] shrink-0">
                    Open history →
                  </span>
                </button>
              ))}

              {patients.length === 0 && (
                <div className="text-center py-16 px-4 app-panel rounded-lg">
                  <h3 className="text-base font-semibold text-slate-700">No patients yet</h3>
                  <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))] mt-1">
                    {searchQuery
                      ? 'No patient of yours matches that name.'
                      : 'When a patient sends you a symptom check, they will appear here.'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* One patient's history with this doctor. */}
        {openPatient && (
          <>
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => setSelectedPatientId(null)}
                className="self-start text-[0.8125rem] font-semibold text-[rgb(var(--ink))] hover:underline"
              >
                ← All your patients
              </button>

              <div className="app-panel rounded-lg p-5">
                <h2 className="app-title">{openPatient.name}</h2>
                <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))] mt-1">
                  {openPatient.age !== undefined ? `${openPatient.age}y • ` : ''}
                  {openPatient.gender ? `${openPatient.gender} • ` : ''}
                  {openPatient.total} consultation{openPatient.total === 1 ? '' : 's'} with you
                </p>
              </div>
            </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-[0.8125rem] font-semibold transition-colors ${
 filterStatus === 'all'
 ? 'bg-[rgb(var(--ink))] text-white '
 : 'bg-white text-slate-600 border border-slate-200 hover:bg-[rgb(var(--app-ground))]'
 }`}
            >
              All ({openPatient.total})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-lg text-[0.8125rem] font-semibold transition-colors ${
 filterStatus === 'pending'
 ? 'bg-amber-600 text-white '
 : 'bg-white text-slate-600 border border-slate-200 hover:bg-[rgb(var(--app-ground))]'
 }`}
            >
              Waiting ({openPatientPending})
            </button>
            <button
              onClick={() => setFilterStatus('reviewed')}
              className={`px-3 py-1.5 rounded-lg text-[0.8125rem] font-semibold transition-colors ${
 filterStatus === 'reviewed'
 ? 'bg-[rgb(var(--ink))] text-white '
 : 'bg-white text-slate-600 border border-slate-200 hover:bg-[rgb(var(--app-ground))]'
 }`}
            >
              Reviewed ({openPatientReviewed})
            </button>
          </div>

        </div>

        {/* Patient Consultations Queue */}
        <div className="space-y-3">
          {patientConsultations.map((consultation) => {
            const hasSnapshot = !!consultation.symptomCheckSnapshot;
            const topCondition = hasSnapshot ? consultation.symptomCheckSnapshot?.conditions[0] : null;

            return (
              <div
                key={consultation.id}
                className="app-panel bg-white/95 rounded-lg border border-slate-200/90 hover:border-[rgb(var(--app-border))] p-5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-base">{consultation.patientName}</h3>
                    {consultation.patientAge && (
                      <span className="text-[0.8125rem] text-[rgb(var(--ink-soft))]">
                        ({consultation.patientAge}y • {consultation.patientGender})
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.8125rem] font-semibold border ${
 consultation.status === 'reviewed'
 ? 'bg-[rgb(var(--app-raised))] text-[rgb(var(--ink))] border-[rgb(var(--app-border))]'
 : 'bg-amber-50 text-amber-700 border-amber-200'
 }`}
                    >
                      {consultation.status === 'reviewed' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Reviewed</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>Pending Review</span>
                        </>
                      )}
                    </span>

                    {topCondition && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[0.8125rem] font-bold ${
 topCondition.urgency === 'emergency'
 ? 'bg-rose-100 text-rose-800'
 : topCondition.urgency === 'high'
 ? 'bg-amber-100 text-amber-800'
 : 'bg-[rgb(var(--app-raised))] text-[rgb(var(--ink))]'
 }`}
                      >
                        Urgency: {topCondition.urgency}
                      </span>
                    )}
                  </div>

                  <p className="text-[0.8125rem] text-slate-600 font-medium">
                    Chief Complaint: <span className="text-slate-800">{consultation.chiefComplaint}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[0.8125rem] text-[rgb(var(--ink-soft))]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(consultation.date).toLocaleString()}
                    </span>
                    {hasSnapshot && (
                      <span className="text-[rgb(var(--ink))] font-semibold flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5" />
                        Attached AI Triage ({consultation.symptomCheckSnapshot?.symptoms.length} symptoms)
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {consultation.status === 'reviewed' && (
                    <button
                      type="button"
                      onClick={() => handleExportConsultationPDF(consultation)}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-[rgb(var(--app-ground))] text-slate-600 transition-colors"
                      title="Export Signed Clinical Note as PDF"
                    >
                      <Download className="w-4 h-4 text-[rgb(var(--ink))]" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenDossier(consultation)}
                    className="bg-[rgb(var(--ink))] hover:bg-[rgb(var(--field-low))] flex items-center gap-1.5 px-4 py-2 rounded-lg text-white font-bold text-[0.8125rem] active:scale-[0.99] transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{consultation.status === 'reviewed' ? 'Review & Edit Notes' : 'Inspect Patient Dossier'}</span>
                  </button>
                </div>
              </div>
            );
          })}

          {patientConsultations.length === 0 && (
            <div className="text-center py-16 px-4 app-panel rounded-lg">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700">Nothing under this filter</h3>
              <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))] mt-1">
                {openPatient.name} has no consultations with you in this state.
              </p>
            </div>
          )}
            </div>
          </>
        )}
      </div>

      {/* Comprehensive Patient Dossier & Review Modal */}
      {selectedConsultation && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 sm:p-7 border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-[rgb(var(--app-raised))] text-[rgb(var(--ink))] flex items-center justify-center font-bold text-lg shrink-0">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-lg">
                      Clinical Dossier: {selectedConsultation.patientName}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[0.8125rem] font-bold bg-[rgb(var(--app-raised))] text-slate-700">
                      ID: {selectedConsultation.patientId}
                    </span>
                  </div>
                  <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))]">
                    Age: {selectedConsultation.patientAge || '42'} • Gender: {selectedConsultation.patientGender || 'Male'} • Submitted: {new Date(selectedConsultation.date).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedConsultation(null)}
                className="p-1.5 rounded-lg text-[rgb(var(--ink-soft))] hover:text-slate-600 hover:bg-[rgb(var(--app-raised))]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section 1: Chief Complaint */}
            <div className="p-4 rounded-lg bg-[rgb(var(--app-ground))] border border-slate-200/80 text-[0.8125rem] space-y-1.5">
              <h4 className="font-bold text-slate-800 text-[11px]">
                Chief Complaint & Consultation Purpose
              </h4>
              <p className="text-slate-700 text-sm font-medium">{selectedConsultation.chiefComplaint}</p>
              {selectedConsultation.notes && (
                <p className="text-[rgb(var(--ink-soft))] italic pt-1">Patient Note: "{selectedConsultation.notes}"</p>
              )}
            </div>

            {/* Section 2: Attached AI Diagnostic Triage & Differential Snapshot */}
            {selectedConsultation.symptomCheckSnapshot ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[0.8125rem] font-bold text-slate-800 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-[rgb(var(--ink))]" />
                    <span>Two-Stage Bayesian Diagnostic Snapshot</span>
                  </h4>
                  <span className="text-[0.8125rem] text-[rgb(var(--ink))] font-semibold">
                    Calibrated on 773 Conditions
                  </span>
                </div>

                {/* Top-3 Differential Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {selectedConsultation.symptomCheckSnapshot.conditions.slice(0, 3).map((c, idx) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-lg border border-slate-200 bg-white text-[0.8125rem] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[0.8125rem] font-bold text-[rgb(var(--ink))]">
                          Rank #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-800">
                          {Math.round(c.probability * 100)}%
                        </span>
                      </div>
                      <h5 className="font-bold text-slate-800 truncate">{c.name}</h5>
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[0.8125rem] font-semibold ${
 c.urgency === 'emergency'
 ? 'bg-rose-100 text-rose-800'
 : c.urgency === 'high'
 ? 'bg-amber-100 text-amber-800'
 : 'bg-[rgb(var(--app-raised))] text-slate-700'
 }`}
                      >
                        {c.urgency}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Reported Symptoms */}
                <div>
                  <h5 className="text-[11px] font-bold text-slate-600 mb-2">
                    Reported Symptoms & Severity
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedConsultation.symptomCheckSnapshot.symptoms.map((s) => (
                      <div
                        key={s.id}
                        className="p-2 rounded-lg bg-[rgb(var(--app-ground))] border border-slate-200 text-[0.8125rem] flex items-center justify-between"
                      >
                        <span className="font-semibold text-slate-800">{s.name}</span>
                        <span className="px-2 py-0.5 rounded-md bg-[rgb(var(--app-raised))] text-[rgb(var(--ink))] font-medium text-[11px]">
                          {s.severity || 'Mild'} • {s.duration || 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Triggers */}
                {selectedConsultation.symptomCheckSnapshot.triggers &&
                  selectedConsultation.symptomCheckSnapshot.triggers.length > 0 && (
                    <div>
                      <h5 className="text-[11px] font-bold text-slate-600 mb-1.5">
                        Environmental / Lifestyle Triggers
                      </h5>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedConsultation.symptomCheckSnapshot.triggers.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-lg bg-[rgb(var(--app-raised))] text-slate-700 text-[0.8125rem]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              <div className="p-4 bg-[rgb(var(--app-ground))] rounded-lg text-[0.8125rem] text-[rgb(var(--ink-soft))] text-center">
                No diagnostic snapshot was attached to this consultation.
              </div>
            )}

            {/* Section 3: Physician Clinical Action Form */}
            <form onSubmit={handleSubmitReview} className="space-y-4 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[rgb(var(--ink))]" />
                <h4 className="text-[0.8125rem] font-bold text-slate-800">
                  Physician Assessment & Treatment Orders
                </h4>
              </div>

              <div>
                <label className="block text-[0.8125rem] font-bold text-slate-700 mb-1">
                  Clinical Observations & Diagnostic Verification
                </label>
                <textarea
                  rows={3}
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="Record differential diagnosis impressions, recommended lab tests (e.g. CBC, chest X-ray, spirometry), or lifestyle guidance..."
                  className="w-full px-3.5 py-2.5 text-[0.8125rem] bg-[rgb(var(--app-ground))] border border-slate-200 rounded-lg focus:outline-none focus:border-[rgb(var(--app-border))] focus:ring-2 focus:ring-[rgb(var(--app-border))]/10 text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-[0.8125rem] font-bold text-slate-700 mb-1">
                  Prescription / Therapy Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={prescriptions}
                  onChange={(e) => setPrescriptions(e.target.value)}
                  placeholder="e.g., Budesonide 200mcg BID for 10 days; Paracetamol 500mg PRN"
                  className="w-full px-3.5 py-2 text-[0.8125rem] bg-[rgb(var(--app-ground))] border border-slate-200 rounded-lg focus:outline-none focus:border-[rgb(var(--app-border))] focus:ring-2 focus:ring-[rgb(var(--app-border))]/10 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleExportConsultationPDF(selectedConsultation)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 text-[0.8125rem] font-semibold hover:bg-[rgb(var(--app-ground))]"
                >
                  <Download className="w-3.5 h-3.5 text-[rgb(var(--ink))]" />
                  <span>Preview PDF</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedConsultation(null)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-[0.8125rem] font-semibold hover:bg-[rgb(var(--app-ground))]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[rgb(var(--ink))] hover:bg-[rgb(var(--field-low))] flex items-center gap-2 px-5 py-2 text-white text-[0.8125rem] font-bold rounded-lg active:scale-[0.99] transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Signing Review...' : 'Sign & Complete Review'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPortalPage;
