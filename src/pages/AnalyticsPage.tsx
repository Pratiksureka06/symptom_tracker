import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  BarChart2, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  Download, 
  Calendar, 
  Zap, 
  Heart,
  Stethoscope 
} from 'lucide-react';
import { useSymptoms } from '../contexts/SymptomContext';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement, 
  Filler 
} from 'chart.js';
import jsPDF from 'jspdf';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement, 
  Filler
);

type TimeRange = '7d' | '30d' | '90d' | 'all';

const AnalyticsPage: React.FC = () => {
  const { history } = useSymptoms();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  // Filter history by selected time range
  const filteredHistory = useMemo(() => {
    if (timeRange === 'all') return history;
    const now = new Date().getTime();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    return history.filter(h => new Date(h.date).getTime() >= cutoff);
  }, [history, timeRange]);

  // 1. Composite Health Score Calculation (0 - 100)
  const healthScoreMetrics = useMemo(() => {
    if (filteredHistory.length === 0) {
      return { score: 100, status: 'Optimal', color: 'emerald', tip: 'No symptoms logged in this period. Keep maintaining your healthy routine!' };
    }

    let severityDeductions = 0;
    let emergencyDeductions = 0;
    let totalSymptomsLogged = 0;

    filteredHistory.forEach(check => {
      check.symptoms.forEach(s => {
        totalSymptomsLogged++;
        if (s.severity === 'severe') severityDeductions += 8;
        else if (s.severity === 'moderate') severityDeductions += 4;
        else severityDeductions += 2;
      });

      const hasEmergency = check.conditions?.some(c => c.urgency === 'emergency' || c.urgency === 'high');
      if (hasEmergency) emergencyDeductions += 10;
    });

    const frequencyPenalty = Math.min(25, filteredHistory.length * 3);
    const totalDeduction = severityDeductions + emergencyDeductions + frequencyPenalty;
    const rawScore = Math.max(20, Math.min(100, Math.round(100 - totalDeduction * (30 / Math.max(30, totalSymptomsLogged * 2)))));

    let status = 'Optimal';
    let color = 'emerald';
    let tip = 'Your health trajectory is stable. Continue balanced nutrition and rest.';

    if (rawScore < 60) {
      status = 'Attention Needed';
      color = 'rose';
      tip = 'High frequency or severe symptoms detected. We recommend booking a comprehensive clinical consultation.';
    } else if (rawScore < 80) {
      status = 'Moderate';
      color = 'amber';
      tip = 'Multiple active symptoms recorded. Monitor triggers, hydrate well, and consider reviewing with a physician.';
    }

    return { score: rawScore, status, color, tip };
  }, [filteredHistory]);

  // 2. Process data for Symptom Frequency
  const symptomFrequency = useMemo(() => {
    return filteredHistory.flatMap(h => h.symptoms).reduce((acc, symptom) => {
      acc[symptom.name] = (acc[symptom.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [filteredHistory]);

  // 3. Process data for Condition Frequency
  const conditionFrequency = useMemo(() => {
    return filteredHistory.flatMap(h => h.conditions).reduce((acc, condition) => {
      acc[condition.name] = (acc[condition.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [filteredHistory]);

  // 4. Temporal Trend Data (Date vs Symptoms Count & Severity)
  const temporalData = useMemo(() => {
    const sorted = [...filteredHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const dateMap: Record<string, { count: number; avgSeverity: number; countSevere: number }> = {};

    sorted.forEach(item => {
      const dateKey = new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { count: 0, avgSeverity: 0, countSevere: 0 };
      }
      dateMap[dateKey].count += item.symptoms.length;

      item.symptoms.forEach(s => {
        if (s.severity === 'severe') dateMap[dateKey].countSevere += 1;
      });
    });

    const labels = Object.keys(dateMap);
    const counts = labels.map(k => dateMap[k].count);
    const severeCounts = labels.map(k => dateMap[k].countSevere);

    return {
      labels,
      datasets: [
        {
          label: 'Symptoms Logged',
          data: counts,
          borderColor: '#0d9488',
          backgroundColor: 'rgba(13, 148, 136, 0.12)',
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Severe Symptoms',
          data: severeCounts,
          borderColor: '#e11d48',
          backgroundColor: 'rgba(225, 29, 72, 0.08)',
          tension: 0.35,
          borderDash: [5, 5],
          pointRadius: 3,
        }
      ]
    };
  }, [filteredHistory]);

  // 5. Trigger-Symptom Correlation Analysis
  const triggerCorrelations = useMemo(() => {
    const triggerMap: Record<string, { total: number; associatedSymptoms: Record<string, number> }> = {};

    filteredHistory.forEach(check => {
      if (check.triggers && check.triggers.length > 0) {
        check.triggers.forEach(trig => {
          if (!triggerMap[trig]) {
            triggerMap[trig] = { total: 0, associatedSymptoms: {} };
          }
          triggerMap[trig].total += 1;

          check.symptoms.forEach(sym => {
            triggerMap[trig].associatedSymptoms[sym.name] = (triggerMap[trig].associatedSymptoms[sym.name] || 0) + 1;
          });
        });
      }
    });

    const list: Array<{ trigger: string; totalLogs: number; topSymptom: string; correlationPct: number }> = [];

    Object.entries(triggerMap).forEach(([trigger, data]) => {
      let topSym = 'None';
      let maxCount = 0;
      Object.entries(data.associatedSymptoms).forEach(([sym, count]) => {
        if (count > maxCount) {
          maxCount = count;
          topSym = sym;
        }
      });
      const pct = Math.min(100, Math.round((maxCount / data.total) * 100));
      list.push({
        trigger,
        totalLogs: data.total,
        topSymptom: topSym,
        correlationPct: pct
      });
    });

    return list.sort((a, b) => b.totalLogs - a.totalLogs).slice(0, 4);
  }, [filteredHistory]);

  // Top Most Frequent Symptom
  const topSymptomName = useMemo(() => {
    const entries = Object.entries(symptomFrequency);
    if (entries.length === 0) return 'None recorded';
    entries.sort((a, b) => b[1] - a[1]);
    return `${entries[0][0]} (${entries[0][1]}x)`;
  }, [symptomFrequency]);

  // Chart configs
  const symptomFrequencyData = {
    labels: Object.keys(symptomFrequency).slice(0, 8),
    datasets: [{
      label: 'Occurrences',
      data: Object.values(symptomFrequency).slice(0, 8),
      backgroundColor: 'rgba(13, 148, 136, 0.75)',
      borderRadius: 6,
    }],
  };

  const conditionFrequencyData = {
    labels: Object.keys(conditionFrequency).slice(0, 6),
    datasets: [{
      label: 'Condition Diagnoses',
      data: Object.values(conditionFrequency).slice(0, 6),
      backgroundColor: [
        'rgba(13, 148, 136, 0.8)',
        'rgba(56, 189, 248, 0.8)',
        'rgba(244, 63, 94, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(100, 116, 139, 0.8)',
      ],
      borderWidth: 2,
    }],
  };

  // Export Analytics PDF
  const exportAnalyticsPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header Banner
      doc.setFillColor(13, 148, 136);
      doc.rect(0, 0, pageWidth, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text("MediScan — Patient Health Analytics Report", 14, 18);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Time Window: ${timeRange.toUpperCase()} | Generated: ${new Date().toLocaleDateString()}`, pageWidth - 14, 18, { align: 'right' });

      let y = 38;
      doc.setTextColor(30, 41, 59);

      // KPI Box
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, y, pageWidth - 28, 26, 3, 3, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, y, pageWidth - 28, 26, 3, 3, 'D');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text("COMPOSITE HEALTH SCORE:", 20, y + 10);
      doc.setFontSize(14);
      doc.setTextColor(healthScoreMetrics.color === 'emerald' ? 15 : healthScoreMetrics.color === 'amber' ? 180 : 225, 118, 110);
      doc.text(`${healthScoreMetrics.score} / 100 (${healthScoreMetrics.status})`, 85, y + 10);

      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Total Checks: ${filteredHistory.length}   |   Primary Symptom: ${topSymptomName}   |   Triggers Tracked: ${triggerCorrelations.length}`, 20, y + 19);

      y += 34;

      // Symptom Frequency Table
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text("Symptom Occurrences", 14, y);
      y += 6;

      doc.setFillColor(241, 245, 249);
      doc.rect(14, y - 4, pageWidth - 28, 6, 'F');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text("SYMPTOM", 20, y);
      doc.text("OCCURRENCE COUNT", 120, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      Object.entries(symptomFrequency).slice(0, 8).forEach(([sym, count]) => {
        doc.text(sym, 20, y);
        doc.text(`${count} times`, 120, y);
        y += 5.5;
      });

      y += 6;

      // Trigger Correlation Section
      if (triggerCorrelations.length > 0) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text("Identified Trigger Correlations", 14, y);
        y += 6;

        triggerCorrelations.forEach(tc => {
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'normal');
          doc.text(`• ${tc.trigger}: Correlates with "${tc.topSymptom}" in ${tc.correlationPct}% of reported logs (${tc.totalLogs} events)`, 20, y);
          y += 5.5;
        });
        y += 6;
      }

      // Attending Physician Review
      y += 8;
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, y, pageWidth - 28, 24, 'D');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Physician Longitudinal Evaluation & Comments:", 18, y + 6);
      doc.line(18, y + 18, 95, y + 18);
      doc.text("Signature & Review Date", 18, y + 22);

      doc.save(`MediScan-Analytics-Summary-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error('Analytics PDF export failed:', e);
    }
  };

  return (
    <div className="px-4 py-8 bg-[rgb(var(--app-ground))] min-h-[100svh]">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Top Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center">
            <Link to="/" className="text-[rgb(var(--ink))] hover:text-[rgb(var(--ink))] mr-3 p-1 rounded-md hover:bg-[rgb(var(--app-raised))] transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Activity className="h-6 w-6 text-[rgb(var(--ink))]" />
                Your health over time
              </h1>
              <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))]">How your symptoms have changed, and what seems to set them off</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Time Window Filter */}
            <div className="inline-flex bg-white border border-slate-200 rounded-lg p-0.5 text-[0.8125rem] font-medium text-slate-600">
              {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
 timeRange === r 
 ? 'bg-[rgb(var(--ink))] text-white font-semibold ' 
 : 'hover:text-slate-900 hover:bg-[rgb(var(--app-raised))]'
 }`}
                >
                  {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : r === '90d' ? '90 Days' : 'All Time'}
                </button>
              ))}
            </div>

            {filteredHistory.length > 0 && (
              <button
                onClick={exportAnalyticsPDF}
                className="inline-flex items-center px-3 py-1.5 border border-[rgb(var(--app-border))]/30 bg-[rgb(var(--app-raised))] text-[rgb(var(--ink))] rounded-lg text-[0.8125rem] font-semibold hover:bg-[rgb(var(--app-raised))] transition-colors"
                title="Download Analytics PDF Summary"
              >
                <Download className="h-3.5 w-3.5 mr-1 text-[rgb(var(--ink))]" />
                Export PDF
              </button>
            )}
          </div>
        </div>

        {filteredHistory.length > 0 ? (
          <>
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Composite Health Score */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[0.8125rem] font-semibold text-[rgb(var(--ink-soft))] mb-1">
                    Health Score
                  </div>
                  <div className="text-2xl font-extrabold text-slate-800 flex items-baseline gap-1.5">
                    {healthScoreMetrics.score}
                    <span className="text-[0.8125rem] font-normal text-[rgb(var(--ink-soft))]">/100</span>
                  </div>
                  <div className={`text-[0.8125rem] font-medium mt-1 ${
 healthScoreMetrics.color === 'emerald' ? 'text-[rgb(var(--ink))]' :
 healthScoreMetrics.color === 'amber' ? 'text-amber-600' : 'text-rose-600'
 }`}>
                    ● {healthScoreMetrics.status}
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
 healthScoreMetrics.color === 'emerald' ? 'bg-[rgb(var(--app-raised))] text-[rgb(var(--ink))]' :
 healthScoreMetrics.color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
 }`}>
                  <Heart className="h-6 w-6" />
                </div>
              </div>

              {/* Total Checks */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[0.8125rem] font-semibold text-[rgb(var(--ink-soft))] mb-1">
                    Checks Logged
                  </div>
                  <div className="text-2xl font-extrabold text-slate-800">
                    {filteredHistory.length}
                  </div>
                  <div className="text-[0.8125rem] text-[rgb(var(--ink-soft))] mt-1">
                    In selected window
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-[rgb(var(--app-raised))] text-[rgb(var(--ink))] flex items-center justify-center">
                  <Calendar className="h-6 w-6" />
                </div>
              </div>

              {/* Top Symptom */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                <div className="overflow-hidden pr-2">
                  <div className="text-[0.8125rem] font-semibold text-[rgb(var(--ink-soft))] mb-1">
                    Top Symptom
                  </div>
                  <div className="text-lg font-bold text-slate-800 truncate" title={topSymptomName}>
                    {topSymptomName}
                  </div>
                  <div className="text-[0.8125rem] text-[rgb(var(--ink-soft))] mt-1">
                    Most repeated signal
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-[rgb(var(--app-raised))] text-[rgb(var(--ink))] flex items-center justify-center shrink-0">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>

              {/* Triggers Identified */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[0.8125rem] font-semibold text-[rgb(var(--ink-soft))] mb-1">
                    Triggers Active
                  </div>
                  <div className="text-2xl font-extrabold text-slate-800">
                    {triggerCorrelations.length}
                  </div>
                  <div className="text-[0.8125rem] text-[rgb(var(--ink-soft))] mt-1">
                    Environmental factors
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Zap className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Health Recommendation Tip */}
            <div className={`p-4 rounded-lg border flex items-start gap-3 ${
 healthScoreMetrics.color === 'emerald' ? 'bg-[rgb(var(--app-raised))]/70 border-[rgb(var(--app-border))] text-[rgb(var(--ink))]' :
 healthScoreMetrics.color === 'amber' ? 'bg-amber-50/70 border-amber-200 text-amber-900' :
 'bg-rose-50/70 border-rose-200 text-rose-900'
 }`}>
              <ShieldCheck className="h-5 w-5 mt-0.5 shrink-0 text-[rgb(var(--ink))]" />
              <div>
                <span className="font-semibold text-sm">Clinical AI Insight: </span>
                <span className="text-sm">{healthScoreMetrics.tip}</span>
              </div>
            </div>

            {/* Temporal Trend Chart */}
            <div className="bg-white p-5 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[rgb(var(--ink))]" />
                    Temporal Symptom Trajectory
                  </h2>
                  <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))]">Total and severe symptom occurrences mapped across time</p>
                </div>
                <span className="text-[0.8125rem] text-[rgb(var(--ink-soft))] font-medium">Timeline Trend</span>
              </div>
              <div className="h-64">
                <Line 
                  data={temporalData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    scales: {
                      y: { beginAtZero: true, ticks: { stepSize: 1 } }
                    }
                  }} 
                />
              </div>
            </div>

            {/* Trigger-Symptom Correlation Matrix */}
            {triggerCorrelations.length > 0 && (
              <div className="bg-white p-5 rounded-lg border border-slate-200">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-1">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Trigger-Symptom Correlation Matrix
                </h2>
                <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))] mb-4">Co-occurrence pattern between logged lifestyle factors and symptoms</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {triggerCorrelations.map((tc, idx) => (
                    <div key={idx} className="p-3.5 rounded-lg border border-slate-100 bg-[rgb(var(--app-ground))]/60 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[0.8125rem] text-slate-800">{tc.trigger}</span>
                          <span className="text-[11px] font-bold text-[rgb(var(--ink))] bg-[rgb(var(--app-raised))]/70 px-1.5 py-0.5 rounded">
                            {tc.correlationPct}%
                          </span>
                        </div>
                        <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))] mt-1.5">
                          Linked with <strong className="text-slate-700">{tc.topSymptom}</strong>
                        </p>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mt-3">
                        <div 
                          className="bg-[rgb(var(--ink))] h-1.5 rounded-full" 
                          style={{ width: `${tc.correlationPct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Symptom & Condition Frequency Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Symptom Frequency */}
              <div className="bg-white p-5 rounded-lg border border-slate-200">
                <h2 className="text-base font-bold text-slate-800 mb-1">Symptom Frequency Distribution</h2>
                <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))] mb-4">Top reported symptoms in the current period</p>
                <div className="h-60 flex items-center justify-center">
                  <Bar 
                    data={symptomFrequencyData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                    }} 
                  />
                </div>
              </div>

              {/* Condition Diagnoses */}
              <div className="bg-white p-5 rounded-lg border border-slate-200">
                <h2 className="text-base font-bold text-slate-800 mb-1">Predicted Condition Distribution</h2>
                <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))] mb-4">Frequency of matched differential conditions</p>
                <div className="h-60 flex items-center justify-center">
                  {Object.keys(conditionFrequency).length > 0 ? (
                    <Doughnut 
                      data={conditionFrequencyData} 
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } } }
                      }} 
                    />
                  ) : (
                    <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))]">No condition data recorded.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="bg-white text-center py-16 px-4 rounded-lg border border-slate-200">
            <div className="w-16 h-16 rounded-full bg-[rgb(var(--app-raised))] text-[rgb(var(--ink))] flex items-center justify-center mx-auto mb-4">
              <BarChart2 className="h-8 w-8 text-[rgb(var(--ink))]" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Nothing to chart yet</h2>
            <p className="text-sm text-[rgb(var(--ink-soft))] max-w-md mx-auto mb-6">
              Run your first check and this fills in: how your symptoms move over time, what sets them off, and your health score.
            </p>
            <Link
              to="/symptom-checker"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-[rgb(var(--ink))] text-white font-medium text-sm hover:bg-[rgb(var(--ink))] transition-colors"
            >
              <Stethoscope className="h-4 w-4 mr-2" />
              Start a Symptom Check
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
