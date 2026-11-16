import React, { useState } from 'react';
import { useSymptoms } from '../contexts/SymptomContext';
import { useToast } from '../contexts/ToastContext';
import HistoryItem from '../components/history/HistoryItem';
import { History, ArrowLeft, Trash2, Download, AlertTriangle, FileText, Sparkles, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import papaparse from 'papaparse';

const HistoryPage: React.FC = () => {
  const { history, clearHistory, removeFromHistory } = useSymptoms();
  const { addToast } = useToast();
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const handleClearHistory = () => {
    clearHistory();
    setShowConfirmClear(false);
    addToast('success', 'History cleared successfully.');
  };

  const handleRemoveItem = (id: string) => {
    removeFromHistory(id);
    addToast('info', 'History item removed.');
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("MediScan — Clinical Symptom History Report", 20, 15);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 22);
      
      let y = 30;
      history.forEach((check, index) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(`Record #${index + 1} — Date: ${new Date(check.date).toLocaleString()}`, 20, y);
        y += 7;

        doc.setFont('helvetica', 'normal');
        doc.text("Symptoms Reported:", 25, y);
        y += 6;
        check.symptoms.forEach(symptom => {
          doc.text(`• ${symptom.name} (Severity: ${symptom.severity || 'N/A'}, Duration: ${symptom.duration || 'N/A'})`, 30, y);
          y += 5;
          if (symptom.notes) {
            doc.text(`  Clinical Notes: ${symptom.notes}`, 35, y);
            y += 5;
          }
        });

        if (check.triggers && check.triggers.length > 0) {
          doc.text(`Triggers: ${check.triggers.join(', ')}`, 25, y);
          y += 6;
        }

        doc.text("Top Conditions:", 25, y);
        y += 6;
        check.conditions.slice(0, 3).forEach((condition, cIdx) => {
          doc.text(`  ${cIdx + 1}. ${condition.name} — ${Math.round(condition.probability * 100)}% match [Urgency: ${condition.urgency}]`, 30, y);
          y += 5;
        });
        y += 6;
      });

      doc.save(`mediscan-history-${Date.now()}.pdf`);
      addToast('success', 'PDF history report generated.');
    } catch (error) {
      addToast('error', 'Failed to export PDF. Please try again.');
    }
  };

  const exportToCSV = () => {
    try {
      const csvData = history.map(check => ({
        date: new Date(check.date).toISOString(),
        symptoms: check.symptoms.map(s => s.name).join('; '),
        severities: check.symptoms.map(s => `${s.name}: ${s.severity}`).join('; '),
        conditions: check.conditions.map(c => `${c.name} (${Math.round(c.probability * 100)}%)`).join('; '),
        triggers: check.triggers?.join('; ') || 'None',
      }));
      const csv = papaparse.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `mediscan-history-${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast('success', 'CSV export downloaded successfully.');
    } catch (error) {
      addToast('error', 'Failed to export CSV. Please try again.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-[rgb(var(--ink))] hover:border-[rgb(var(--app-border))] transition-colors"
              title="Return to Home"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{'History'}</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.8125rem] font-semibold bg-[rgb(var(--app-raised))] text-[rgb(var(--ink))] border border-[rgb(var(--app-border))]">
                  {history.length} Record{history.length === 1 ? '' : 's'}
                </span>
              </div>
              <p className="text-sm text-[rgb(var(--ink-soft))]">
                Longitudinal record of clinical symptom checks, differential evaluations, and triggers
              </p>
            </div>
          </div>

          {/* Export Actions */}
          {history.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={exportToPDF}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200/90 text-slate-700 hover:bg-[rgb(var(--app-ground))] hover:border-[rgb(var(--app-border))] text-[0.8125rem] font-semibold transition-colors"
              >
                <FileText className="h-3.5 w-3.5 text-[rgb(var(--ink))]" />
                <span>Export PDF</span>
              </button>
              <button
                onClick={exportToCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200/90 text-slate-700 hover:bg-[rgb(var(--app-ground))] hover:border-[rgb(var(--app-border))] text-[0.8125rem] font-semibold transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-[rgb(var(--ink))]" />
                <span>Export CSV</span>
              </button>
            </div>
          )}
        </div>

        {/* History Records List */}
        {history.length > 0 ? (
          <div className="space-y-3">
            {history.map((check) => (
              <HistoryItem key={check.id} check={check} onRemove={handleRemoveItem} />
            ))}
          </div>
        ) : (
          <div className="app-panel bg-white/90 text-center py-16 px-6 rounded-lg border border-dashed border-slate-200">
            <div className="w-16 h-16 rounded-lg bg-[rgb(var(--app-raised))] border border-[rgb(var(--app-border))]/60 flex items-center justify-center mx-auto mb-4 text-[rgb(var(--ink))]">
              <History className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">No Clinical Records Found</h2>
            <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))] max-w-sm mx-auto mb-6">
              You have not completed any symptom checks yet. Run one to start your history.
            </p>
            <Link
              to="/symptom-checker"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[rgb(var(--ink))] hover:bg-[rgb(var(--field-low))] text-white text-[0.8125rem] font-semibold rounded-lg transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>{'Start a symptom check'}</span>
            </Link>
          </div>
        )}

        {/* Clear History Confirmation */}
        {history.length > 0 && (
          <div className="pt-2 flex justify-center">
            {showConfirmClear ? (
              <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                <span className="text-[0.8125rem] text-rose-700 font-medium">Delete all assessment logs permanently?</span>
                <button
                  onClick={handleClearHistory}
                  className="px-3 py-1 bg-rose-600 text-white text-[0.8125rem] font-semibold rounded-lg hover:bg-rose-700 transition-colors"
                >
                  Yes, Clear All
                </button>
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="px-3 py-1 bg-slate-200 text-slate-700 text-[0.8125rem] font-semibold rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmClear(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-lg text-rose-600 hover:bg-rose-50 hover:border-rose-300 text-[0.8125rem] font-semibold transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear All Records</span>
              </button>
            )}
          </div>
        )}

        {/* Privacy & Storage Notice */}
        <div className="p-4 rounded-lg bg-[rgb(var(--app-ground))]/80 border border-slate-200/80 text-[0.8125rem] text-[rgb(var(--ink-soft))] flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-[rgb(var(--ink))] shrink-0 mt-0.5" />
          <p>
            <strong>Local Privacy Architecture:</strong> Your clinical history is cached locally and synced to your private self-hosted backend. No identifying health records are broadcast to external third-party aggregators.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;