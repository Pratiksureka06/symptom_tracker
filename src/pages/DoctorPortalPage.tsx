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
  const [doctorNotes, setDoctorNotes] = useState('');
  const [prescriptions, setPrescriptions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user is not logged in as a doctor, show clinical access gate with one-click doctor sign-in
  if (!isDoctor) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-teal-50/25 to-slate-50 py-16 px-4 flex items-center justify-center">
        <div className="glass-card bg-white/95 backdrop-blur-md max-w-lg w-full p-8 rounded-3xl border border-slate-200 text-center shadow-xl shadow-teal-900/5 space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-teal-100 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto shadow-sm">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Physician Authentication Required</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              This clinical dashboard is restricted to licensed medical practitioners to inspect patient triage data, Bayesian differential diagnoses, and issue clinical orders.
            </p>
          </div>

          <div className="pt-2 space-y-2.5">
            <button
              onClick={() => loginAsDemo('doctor', 'Pulmonologist')}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 active:scale-[0.99] transition-all"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Sign In as Demo Physician (Dr. Aris Thorne, Pulmonologist)</span>
            </button>

            <Link
              to="/login"
              className="block py-2 text-xs font-semibold text-slate-600 hover:text-teal-700 transition-colors"
            >
              Or Sign in with Custom Doctor Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filter consultations for this doctor or all if general review
  const doctorConsultations = consultations.filter((c) => {
    // If assigned to this doctor or doctor can view queue
    const matchesDoctor = c.doctorId === doctor?.id || true;
    const matchesStatus =
      filterStatus === 'all' ? true : c.status === filterStatus;
    const matchesQuery =
      c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDoctor && matchesStatus && matchesQuery;
  });

  const pendingCount = doctorConsultations.filter((c) => c.status === 'pending').length;
  const reviewedCount = doctorConsultations.filter((c) => c.status === 'reviewed').length;

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
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-teal-50/20 to-slate-50 px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Doctor Identity Header */}
        <div className="glass-card bg-white/95 backdrop-blur-md rounded-2xl border border-teal-100/80 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-700 to-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-teal-700/20 shrink-0">
              <Stethoscope className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                  {doctor?.name}
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  Licensed Clinician
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {doctor?.specialty} • {doctor?.hospital} • License: {doctor?.licenseNumber}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-xs text-slate-500">Total Consults</p>
              <p className="text-base font-bold text-slate-800">{doctorConsultations.length}</p>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-center">
              <p className="text-xs text-amber-700">Pending Review</p>
              <p className="text-base font-bold text-amber-900">{pendingCount}</p>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <p className="text-xs text-emerald-700">Completed</p>
              <p className="text-base font-bold text-emerald-900">{reviewedCount}</p>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === 'all'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Cases ({doctorConsultations.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === 'pending'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilterStatus('reviewed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === 'reviewed'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Completed ({reviewedCount})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient or complaint..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 text-slate-800"
            />
          </div>
        </div>

        {/* Patient Consultations Queue */}
        <div className="space-y-3">
          {doctorConsultations.map((consultation) => {
            const hasSnapshot = !!consultation.symptomCheckSnapshot;
            const topCondition = hasSnapshot ? consultation.symptomCheckSnapshot?.conditions[0] : null;

            return (
              <div
                key={consultation.id}
                className="glass-card bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 hover:border-teal-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-base">{consultation.patientName}</h3>
                    {consultation.patientAge && (
                      <span className="text-xs text-slate-500">
                        ({consultation.patientAge}y • {consultation.patientGender})
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        consultation.status === 'reviewed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
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
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          topCondition.urgency === 'emergency'
                            ? 'bg-rose-100 text-rose-800'
                            : topCondition.urgency === 'high'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        Urgency: {topCondition.urgency}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 font-medium">
                    Chief Complaint: <span className="text-slate-800">{consultation.chiefComplaint}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(consultation.date).toLocaleString()}
                    </span>
                    {hasSnapshot && (
                      <span className="text-teal-700 font-semibold flex items-center gap-1">
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
                      className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                      title="Export Signed Clinical Note as PDF"
                    >
                      <Download className="w-4 h-4 text-teal-700" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenDossier(consultation)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs shadow-sm active:scale-[0.99] transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{consultation.status === 'reviewed' ? 'Review & Edit Notes' : 'Inspect Patient Dossier'}</span>
                  </button>
                </div>
              </div>
            );
          })}

          {doctorConsultations.length === 0 && (
            <div className="text-center py-16 px-4 bg-white/70 rounded-2xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">Triage Queue Empty</h3>
              <p className="text-xs text-slate-500 mt-1">
                No patient consultations currently matching this criteria.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Comprehensive Patient Dossier & Review Modal */}
      {selectedConsultation && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-lg shrink-0">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-lg">
                      Clinical Dossier: {selectedConsultation.patientName}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      ID: {selectedConsultation.patientId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Age: {selectedConsultation.patientAge || '42'} • Gender: {selectedConsultation.patientGender || 'Male'} • Submitted: {new Date(selectedConsultation.date).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedConsultation(null)}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section 1: Chief Complaint */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Chief Complaint & Consultation Purpose
              </h4>
              <p className="text-slate-700 text-sm font-medium">{selectedConsultation.chiefComplaint}</p>
              {selectedConsultation.notes && (
                <p className="text-slate-500 italic pt-1">Patient Note: "{selectedConsultation.notes}"</p>
              )}
            </div>

            {/* Section 2: Attached AI Diagnostic Triage & Differential Snapshot */}
            {selectedConsultation.symptomCheckSnapshot ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-teal-700" />
                    <span>Two-Stage Bayesian Diagnostic Snapshot</span>
                  </h4>
                  <span className="text-xs text-teal-700 font-semibold">
                    Calibrated on 773 Conditions
                  </span>
                </div>

                {/* Top-3 Differential Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {selectedConsultation.symptomCheckSnapshot.conditions.slice(0, 3).map((c, idx) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-teal-700">
                          Rank #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-800">
                          {Math.round(c.probability * 100)}%
                        </span>
                      </div>
                      <h5 className="font-bold text-slate-800 truncate">{c.name}</h5>
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          c.urgency === 'emergency'
                            ? 'bg-rose-100 text-rose-800'
                            : c.urgency === 'high'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {c.urgency}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Reported Symptoms */}
                <div>
                  <h5 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Reported Symptoms & Severity
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedConsultation.symptomCheckSnapshot.symptoms.map((s) => (
                      <div
                        key={s.id}
                        className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                      >
                        <span className="font-semibold text-slate-800">{s.name}</span>
                        <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 font-medium text-[11px]">
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
                      <h5 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        Environmental / Lifestyle Triggers
                      </h5>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedConsultation.symptomCheckSnapshot.triggers.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-500 text-center">
                No diagnostic snapshot was attached to this consultation.
              </div>
            )}

            {/* Section 3: Physician Clinical Action Form */}
            <form onSubmit={handleSubmitReview} className="space-y-4 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Physician Assessment & Treatment Orders
                </h4>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Clinical Observations & Diagnostic Verification
                </label>
                <textarea
                  rows={3}
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="Record differential diagnosis impressions, recommended lab tests (e.g. CBC, chest X-ray, spirometry), or lifestyle guidance..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Prescription / Therapy Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={prescriptions}
                  onChange={(e) => setPrescriptions(e.target.value)}
                  placeholder="e.g., Budesonide 200mcg BID for 10 days; Paracetamol 500mg PRN"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleExportConsultationPDF(selectedConsultation)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  <Download className="w-3.5 h-3.5 text-teal-700" />
                  <span>Preview PDF</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedConsultation(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/20 active:scale-[0.99] transition-all disabled:opacity-50"
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
