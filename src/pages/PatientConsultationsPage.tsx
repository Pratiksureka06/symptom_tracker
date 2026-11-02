import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth, ConsultationRecord } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  Stethoscope,
  Clock,
  CheckCircle2,
  Calendar,
  FileText,
  Download,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  Activity,
  User,
} from 'lucide-react';
import jsPDF from 'jspdf';

const PatientConsultationsPage: React.FC = () => {
  const { currentUser, consultations } = useAuth();
  const { addToast } = useToast();

  const isPatient = !currentUser || currentUser.role === 'patient';
  const patientId = currentUser?.id || 'patient-demo-1';

  // Filter consultations for current patient
  const patientConsultations = consultations.filter(
    (c) => c.patientId === patientId || c.patientName === currentUser?.name
  );

  const handleExportPDF = (c: ConsultationRecord) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("MediScan — Doctor Consultation Assessment Report", 20, 15);
      doc.setFontSize(10);
      doc.text(`Patient: ${c.patientName} | Age: ${c.patientAge || '42'} | Gender: ${c.patientGender || 'Male'}`, 20, 22);
      doc.text(`Consulting Physician: ${c.doctorName} (${c.doctorSpecialty})`, 20, 27);
      doc.line(20, 30, 190, 30);

      let y = 38;
      doc.setFont('helvetica', 'bold');
      doc.text("Clinical Consultation Details:", 20, y);
      doc.setFont('helvetica', 'normal');
      y += 6;
      doc.text(`Date of Request: ${new Date(c.date).toLocaleString()}`, 25, y);
      y += 6;
      doc.text(`Status: ${c.status === 'reviewed' ? 'Reviewed & Finalized' : 'Pending Clinical Review'}`, 25, y);
      y += 6;
      doc.text(`Chief Complaint: ${c.chiefComplaint}`, 25, y);
      y += 10;

      if (c.symptomCheckSnapshot) {
        doc.setFont('helvetica', 'bold');
        doc.text("Diagnostic Assessment Snapshot:", 20, y);
        doc.setFont('helvetica', 'normal');
        y += 6;
        const syms = c.symptomCheckSnapshot.symptoms.map(s => s.name).join(', ');
        doc.text(`Reported Symptoms: ${syms}`, 25, y);
        y += 6;
        if (c.symptomCheckSnapshot.conditions.length > 0) {
          doc.text("Top Differential Diagnoses:", 25, y);
          y += 5;
          c.symptomCheckSnapshot.conditions.slice(0, 3).forEach((cond, idx) => {
            doc.text(`  ${idx + 1}. ${cond.name} — ${Math.round(cond.probability * 100)}% match`, 30, y);
            y += 5;
          });
        }
        y += 6;
      }

      if (c.doctorNotes) {
        doc.setFont('helvetica', 'bold');
        doc.text("Physician Clinical Notes & Recommendations:", 20, y);
        doc.setFont('helvetica', 'normal');
        y += 6;
        doc.text(c.doctorNotes, 25, y, { maxWidth: 160 });
        y += 20;
      }

      if (c.prescriptions) {
        doc.setFont('helvetica', 'bold');
        doc.text("Prescribed Medications / Therapeutic Plan:", 20, y);
        doc.setFont('helvetica', 'normal');
        y += 6;
        doc.text(c.prescriptions, 25, y, { maxWidth: 160 });
        y += 20;
      }

      doc.line(20, y, 190, y);
      y += 10;
      doc.text(`Signed by: ${c.doctorName}`, 20, y);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, y + 5);

      doc.save(`mediscan-consultation-${c.doctorName.replace(/\s+/g, '_')}.pdf`);
      addToast('success', 'Official Consultation Report downloaded.');
    } catch {
      addToast('error', 'Failed to generate PDF.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-teal-50/20 to-slate-50 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                My Clinical Consultations
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200">
                {patientConsultations.length} Consultation{patientConsultations.length === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Track status, doctor clinical observations, and prescriptions for your diagnostic checks
            </p>
          </div>

          <Link
            to="/doctors"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20 hover:from-teal-700 hover:to-emerald-700 transition-all self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Consult Another Specialist</span>
          </Link>
        </div>

        {/* Consultations List */}
        <div className="space-y-4">
          {patientConsultations.map((c) => {
            const isReviewed = c.status === 'reviewed';

            return (
              <div
                key={c.id}
                className="glass-card bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 hover:border-teal-200 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                {/* Doctor and Status Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-base">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{c.doctorName}</h3>
                      <p className="text-xs text-teal-700 font-medium">{c.doctorSpecialty}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        isReviewed
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {isReviewed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Doctor Reviewed</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          <span>Under Clinical Review</span>
                        </>
                      )}
                    </span>

                    {isReviewed && (
                      <button
                        onClick={() => handleExportPDF(c)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                        title="Download Signed Report"
                      >
                        <Download className="w-3.5 h-3.5 text-teal-700" />
                        <span>PDF Report</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Consultation Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Chief Complaint
                    </span>
                    <p className="font-semibold text-slate-800 mt-0.5">{c.chiefComplaint}</p>
                    {c.notes && <p className="text-slate-500 mt-1 italic">"{c.notes}"</p>}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Timeline & Snapshot
                    </span>
                    <p className="text-slate-700 mt-0.5">
                      Submitted on: <strong>{new Date(c.date).toLocaleDateString()}</strong>
                    </p>
                    {c.symptomCheckSnapshot && (
                      <p className="text-teal-700 font-medium mt-1">
                        Attached: {c.symptomCheckSnapshot.symptoms.length} symptoms logged
                      </p>
                    )}
                  </div>
                </div>

                {/* Physician Feedback Section (If Reviewed) */}
                {isReviewed ? (
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-2.5">
                    <div className="flex items-center gap-2 text-emerald-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">
                        Physician Findings & Treatment Guidance
                      </h4>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {c.doctorNotes}
                    </p>
                    {c.prescriptions && (
                      <div className="pt-2 border-t border-emerald-200/60 text-xs">
                        <span className="font-bold text-emerald-900">Prescriptions / Therapy: </span>
                        <span className="text-slate-800">{c.prescriptions}</span>
                      </div>
                    )}
                    {c.reviewedAt && (
                      <p className="text-[10px] text-slate-500 text-right">
                        Reviewed at: {new Date(c.reviewedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Your diagnostic snapshot has been transmitted to <strong>{c.doctorName}</strong>. You will receive clinical feedback and treatment notes once reviewed.
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {patientConsultations.length === 0 && (
            <div className="glass-card bg-white/95 text-center py-16 px-6 rounded-2xl border border-dashed border-slate-200">
              <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Consultations Yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-5">
                You haven't requested any specialist consultations. Run an assessment or visit the doctor directory to connect with a verified physician.
              </p>
              <Link
                to="/doctors"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/20"
              >
                <span>Find a Specialist Doctor</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientConsultationsPage;
