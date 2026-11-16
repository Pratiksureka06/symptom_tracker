import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSymptoms } from '../contexts/SymptomContext';
import ConditionCard from '../components/results/ConditionCard';
import { Activity, ArrowLeft, ArrowRight, AlertCircle, Printer, FileText, Download, Stethoscope, Sparkles } from 'lucide-react';
import jsPDF from 'jspdf';

const ResultsPage: React.FC = () => {
  const { selectedSymptoms, conditions, triage, differentialDiagnosis, engine, fallbackReason } = useSymptoms();
  const navigate = useNavigate();
  
  // Redirect if no conditions or symptoms
  useEffect(() => {
    if (selectedSymptoms.length === 0 || conditions.length === 0) {
      navigate('/symptom-checker');
    }
  }, [selectedSymptoms.length, conditions.length, navigate]);
  
  // Check if there's an emergency condition
  const hasEmergencyCondition = conditions.some(condition => condition.urgency === 'emergency');
  
  // Function to print results
  const printResults = () => {
    window.print();
  };

  // Export comprehensive Clinical PDF report
  const exportClinicalPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header Banner
      doc.setFillColor(13, 148, 136); // Teal 600
      doc.rect(0, 0, pageWidth, 26, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text("MediScan — Clinical Assessment Report", 14, 16);
      
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 14, 16, { align: 'right' });

      let y = 36;
      doc.setTextColor(30, 41, 59);

      // Stage 1 Triage Summary
      if (triage) {
        doc.setFillColor(240, 253, 250);
        doc.roundedRect(14, y, pageWidth - 28, 22, 2, 2, 'F');
        doc.setDrawColor(204, 251, 241);
        doc.roundedRect(14, y, pageWidth - 28, 22, 2, 2, 'D');

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 118, 110);
        doc.text("STAGE 1: ORGAN SYSTEM TRIAGE", 18, y + 7);

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(`Primary System: ${triage.primaryCategory} (${triage.categoryConfidencePercent}% match)   |   Recommended Specialist: ${triage.recommendedSpecialist}`, 18, y + 15);

        y += 28;
      }

      // Symptoms Section
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text("Reported Symptoms", 14, y);
      y += 6;

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      selectedSymptoms.forEach(s => {
        const details = [
          s.severity ? `Severity: ${s.severity}` : null,
          s.duration ? `Duration: ${s.duration}` : null,
          s.notes ? `Notes: ${s.notes}` : null
        ].filter(Boolean).join(' | ');

        doc.text(`• ${s.name} ${details ? `(${details})` : ''}`, 18, y);
        y += 5.5;
      });

      y += 4;

      // Differential Diagnosis Section
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text("Differential Diagnosis (Hierarchical Bayesian Predictions)", 14, y);
      if (differentialDiagnosis) {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 116, 139);
        doc.text(`Top-3 Cumulative Confidence: ${differentialDiagnosis.top3CoveragePercent}%`, pageWidth - 14, y, { align: 'right' });
      }
      y += 7;

      // Conditions Table Header
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y - 4, pageWidth - 28, 6.5, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text("RANK & TIER", 18, y);
      doc.text("CONDITION", 65, y);
      doc.text("PROBABILITY", 125, y);
      doc.text("CATEGORY / SPECIALIST", 155, y);
      y += 6.5;

      doc.setFont('helvetica', 'normal');
      conditions.forEach((cond) => {
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        const rankText = cond.rank === 1 ? "#1 Top-1 Primary" : cond.rank && cond.rank <= 3 ? `#${cond.rank} Top-3 Differential` : `#${cond.rank || '-'}`;
        doc.text(rankText, 18, y);
        doc.text(cond.name.substring(0, 32), 65, y);
        doc.text(`${Math.round(cond.probability * 100)}%`, 125, y);
        doc.text((cond.category || 'General').substring(0, 24), 155, y);
        y += 5.5;
      });

      y += 8;

      // Clinical Next Steps
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text("Clinical Guidance & Next Steps", 14, y);
      y += 5.5;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text("1. This report is an AI-assisted differential triage and does not substitute for a clinical consultation.", 18, y);
      y += 4.5;
      doc.text("2. Share this document with your physician or recommended specialist for confirmatory testing.", 18, y);
      y += 4.5;
      doc.text("3. If experiencing red-flag symptoms (severe chest pain, dyspnea, severe bleed), call emergency services.", 18, y);

      // Doctor Signature Box
      y += 10;
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, y, pageWidth - 28, 22, 'D');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Attending Physician Notes / Signature:", 18, y + 5);
      doc.line(18, y + 17, 95, y + 17);
      doc.text("Signature & Medical Registration Number", 18, y + 20);

      doc.save(`MediScan-Clinical-Summary-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    }
  };
  
  if (selectedSymptoms.length === 0 || conditions.length === 0) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Emergency Warning */}
        {hasEmergencyCondition && (
          <div className="bg-rose-100 border-l-4 border-rose-500 p-4 mb-6 rounded-md">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-rose-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-rose-800">Potential Emergency Detected</h3>
                <p className="mt-1 text-rose-700">
                  Based on your symptoms, immediate medical attention may be required. 
                  Please contact emergency services or go to the nearest emergency room.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center text-[rgb(var(--ink))] hover:text-[rgb(var(--ink))] text-sm font-medium mb-3"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-slate-800">{'Results'}</h1>
            {engine && (
              <span
                title={fallbackReason ? `Gemini failed, local model used: ${fallbackReason}` : undefined}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
 engine === 'gemini'
 ? 'bg-[rgb(var(--app-raised))] text-[rgb(var(--ink))] border border-[rgb(var(--app-border))]'
 : 'bg-[rgb(var(--app-raised))] text-slate-600 border border-slate-200'
 }`}
              >
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                {engine === 'gemini' ? 'Gemini' : 'Local ML'}
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5 mt-4 md:mt-0">
            <button
              onClick={exportClinicalPDF}
              className="inline-flex items-center px-3 py-1.5 border border-[rgb(var(--app-border))]/30 bg-[rgb(var(--app-raised))] text-[rgb(var(--ink))] rounded-md text-sm font-medium hover:bg-[rgb(var(--app-raised))] transition-colors"
              title="Download formatted Clinical PDF report"
            >
              <Download className="h-4 w-4 mr-1.5 text-[rgb(var(--ink))]" />
              Clinical PDF
            </button>
            <button
              onClick={printResults}
              className="inline-flex items-center px-3 py-1.5 border border-slate-300 rounded-md text-slate-700 text-sm hover:bg-[rgb(var(--app-ground))] transition-colors"
            >
              <Printer className="h-4 w-4 mr-1.5" />
              Print
            </button>
            <button
              onClick={() => navigate('/symptom-checker')}
              className="inline-flex items-center px-3 py-1.5 border border-[rgb(var(--app-border))] rounded-md text-sm text-white bg-[rgb(var(--ink))] hover:bg-[rgb(var(--ink))] transition-colors"
            >
              <Activity className="h-4 w-4 mr-1.5" />
              New Check
            </button>
          </div>
        </div>

        {/* Gemini was requested but could not answer — say so rather than
            silently presenting the local model's results as the AI's. */}
        {fallbackReason && (
          <div role="alert" className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">
              Gemini was unavailable — these results come from the local ML model.
            </p>
            <p className="mt-1 text-[0.8125rem] text-amber-800">{fallbackReason}</p>
          </div>
        )}

        {/* Stage 1 Organ System Triage Banner */}
        {triage && (
          <div className="border border-[rgb(var(--app-border))]/80 rounded-lg p-5 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[rgb(var(--ink))] text-white">
                    Step one
                  </span>
                  <span className="text-[0.8125rem] text-[rgb(var(--ink))] font-medium">
                    Which part of the body this points to
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5 mt-1">
                  <Stethoscope className="h-5 w-5 text-[rgb(var(--ink))]" />
                  {triage.primaryCategory}
                  <span className="text-[0.8125rem] font-semibold text-[rgb(var(--ink))] bg-[rgb(var(--app-raised))] px-2.5 py-0.5 rounded-full border border-[rgb(var(--app-border))]">
                    {triage.categoryConfidencePercent}% match
                  </span>
                </h2>
                <p className="text-sm text-slate-700 mt-1.5">
                  <span className="font-semibold text-slate-900">Recommended Specialist:</span>{' '}
                  <span className="text-[rgb(var(--ink))] font-medium">{triage.recommendedSpecialist}</span>
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Link
                    to={`/doctors?specialty=${encodeURIComponent(triage.recommendedSpecialist.split('/')[0].trim())}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[rgb(var(--ink))] hover:bg-[rgb(var(--ink))] text-white text-[0.8125rem] font-bold transition-colors"
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>Consult a {triage.recommendedSpecialist.split('/')[0].trim()}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {differentialDiagnosis && (
                <div className="bg-white rounded-lg p-3.5 border border-[rgb(var(--app-border))]/70 text-right shrink-0">
                  <div className="text-[11px] font-semibold text-[rgb(var(--ink-soft))]">
                    How much the top three explain
                  </div>
                  <div className="text-2xl font-extrabold text-[rgb(var(--ink))] mt-0.5">
                    {differentialDiagnosis.top3CoveragePercent}%
                  </div>
                  <div className="text-[11px] text-[rgb(var(--ink-soft))]">
                    of your symptoms
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Symptoms Overview */}
        <div className="bg-white rounded-lg p-4 mb-6 border border-slate-200/80">
          <h2 className="text-sm font-semibold text-[rgb(var(--ink-soft))] mb-2.5">
            What you told us ({selectedSymptoms.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {selectedSymptoms.map(symptom => (
              <div 
                key={symptom.id} 
                className="bg-[rgb(var(--app-raised))] border border-[rgb(var(--app-border))]/70 text-[rgb(var(--ink))] px-3 py-1 rounded-full text-[0.8125rem] font-medium"
              >
                {symptom.name}
                {symptom.severity && ` (${symptom.severity})`}
                {symptom.duration && ` - ${symptom.duration}`}
              </div>
            ))}
          </div>
        </div>
        
        {/* Possible Conditions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[rgb(var(--ink))]" />
                {'Possible conditions'}
              </h2>
              <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))] mt-0.5">
                Step two: what fits best, ranked within that part of the body
              </p>
            </div>
            {differentialDiagnosis && (
              <span className="hidden sm:inline-flex text-[0.8125rem] text-slate-600 bg-[rgb(var(--app-raised))] px-2.5 py-1 rounded border border-slate-200">
                Best match first
              </span>
            )}
          </div>
          
          {conditions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {conditions.map(condition => (
                <ConditionCard key={condition.id} condition={condition} />
              ))}
            </div>
          ) : (
            <p className="text-slate-600">No conditions found matching your symptoms.</p>
          )}
        </div>
        
        {/* Next Steps */}
        <div className="bg-[rgb(var(--app-ground))] rounded-lg p-6 border border-slate-200">
          <div className="flex items-center mb-4">
            <FileText className="h-5 w-5 text-[rgb(var(--ink))] mr-2" />
            <h2 className="text-xl font-semibold text-slate-800">{'Recommended next steps'}</h2>
          </div>
          
          <ul className="space-y-3">
            <li className="flex items-start">
              <div className="h-6 w-6 bg-[rgb(var(--app-raised))] rounded-full flex items-center justify-center text-[rgb(var(--ink))] font-medium mr-3 mt-0.5">
                1
              </div>
              <p className="text-slate-700">
                Review the possible conditions listed above. Remember that this is not a diagnosis, but rather information to help guide your healthcare decisions.
              </p>
            </li>
            <li className="flex items-start">
              <div className="h-6 w-6 bg-[rgb(var(--app-raised))] rounded-full flex items-center justify-center text-[rgb(var(--ink))] font-medium mr-3 mt-0.5">
                2
              </div>
              <p className="text-slate-700">
                {hasEmergencyCondition ? (
                  <span className="font-medium text-rose-700">
                    Seek immediate medical attention. Call emergency services or go to the nearest emergency room.
                  </span>
                ) : (
                  <span>
                    Consider consulting with a healthcare provider to discuss your symptoms and get a proper diagnosis.
                  </span>
                )}
              </p>
            </li>
            <li className="flex items-start">
              <div className="h-6 w-6 bg-[rgb(var(--app-raised))] rounded-full flex items-center justify-center text-[rgb(var(--ink))] font-medium mr-3 mt-0.5">
                3
              </div>
              <p className="text-slate-700">
                You can print or save these results to share with your healthcare provider.
              </p>
            </li>
          </ul>
          
          <div className="mt-6 text-sm text-[rgb(var(--ink-soft))]">
<p className="text-[rgb(var(--ink-soft))]">{'This is not a medical diagnosis. Always check with a healthcare professional.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;