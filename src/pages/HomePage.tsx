import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  Mic, 
  BarChart2, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Stethoscope, 
  Brain, 
  Download, 
  WifiOff, 
  TrendingUp,
  FileCheck2
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const HomePage: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="bg-slate-50 min-h-screen">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/60">
        
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-teal-200/30 to-cyan-200/20 blur-3xl pointer-events-none rounded-full" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
            <span>MediScan AI-DX 4.2 • Two-Stage Hierarchical ML</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Intelligent Medical Triage & <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-700 bg-clip-text text-transparent">
              Differential Diagnosis
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Evaluates patient symptoms through organ system triage and Bayesian inference across 
            <strong className="text-slate-900 font-semibold"> 773 medical conditions</strong> and 
            <strong className="text-slate-900 font-semibold"> 377 symptoms</strong>.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/symptom-checker"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 shadow-md shadow-teal-700/20 active:scale-98 transition-all gap-2"
            >
              <Stethoscope className="h-4 w-4" />
              <span>Start Symptom Check</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/analytics"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-all gap-2"
            >
              <BarChart2 className="h-4 w-4 text-teal-700" />
              <span>Explore Analytics</span>
            </Link>
          </div>

          {/* Key Metric Highlights Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-8 max-w-3xl mx-auto">
            <div className="p-3.5 rounded-xl glass-card border border-slate-200 text-center">
              <div className="text-xl sm:text-2xl font-extrabold text-slate-800">773</div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">Disease Entities</div>
            </div>
            <div className="p-3.5 rounded-xl glass-card border border-slate-200 text-center">
              <div className="text-xl sm:text-2xl font-extrabold text-slate-800">377</div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">Symptom Features</div>
            </div>
            <div className="p-3.5 rounded-xl glass-card border border-slate-200 text-center">
              <div className="text-xl sm:text-2xl font-extrabold text-teal-700">Top-3</div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">Differential Ranking</div>
            </div>
            <div className="p-3.5 rounded-xl glass-card border border-slate-200 text-center">
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-700">100%</div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">Self-Hosted / Private</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Technical Capabilities Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-700">
              System Architecture & Features
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Clinical Grade Decision Support
            </h3>
            <p className="text-sm text-slate-500">
              Engineered with modern probabilistic machine learning, structured medical taxonomies, and offline-first client architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1: Two-Stage Hierarchical ML */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-teal-300 hover:shadow-md transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Brain className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Two-Stage Hierarchical ML
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Stage 1 categorizes patient complaints into 10 anatomical organ domains. Stage 2 conditions 
                Bayesian likelihoods within the domain, rejecting cross-system noise.
              </p>
            </div>

            {/* Feature 2: Top-3 Differential Diagnosis */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-teal-300 hover:shadow-md transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <FileCheck2 className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Top-3 Differential Ranking
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Reflects authentic medical practice by outputting Top-1 Primary, Top-3 Differential, and 
                cumulative probability coverage with urgency triage tags.
              </p>
            </div>

            {/* Feature 3: Voice Dictation */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-teal-300 hover:shadow-md transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Mic className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Voice Clinical Dictation
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hands-free conversational symptom intake with live animated audio waveform visualizers 
                and automated entity parsing into discrete symptoms.
              </p>
            </div>

            {/* Feature 4: Longitudinal Analytics */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-teal-300 hover:shadow-md transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Composite Health Score & Trends
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Temporal line charts, trigger-symptom correlation matrix, and personal Health Score 
                algorithm (0–100) with dynamic time-window filtering.
              </p>
            </div>

            {/* Feature 5: PWA & Offline Support */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-teal-300 hover:shadow-md transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <WifiOff className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                PWA & Offline Resilience
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Installable Progressive Web App with service worker asset caching and localStorage 
                persistence for seamless use even without internet connectivity.
              </p>
            </div>

            {/* Feature 6: Physician PDF Export */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-teal-300 hover:shadow-md transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Download className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Clinical PDF Assessment
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generates formatted patient summaries with triage recommendations, symptom timelines, 
                and attending physician notes and signature blocks.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Quick Launch CTA Banner */}
      <section className="py-14 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ready to Evaluate Your Symptoms?
          </h2>
          <p className="text-sm text-teal-100 max-w-xl mx-auto">
            Get instant Bayesian-calibrated medical insights in less than 2 minutes. Completely private and self-hosted.
          </p>
          <div className="pt-2">
            <Link
              to="/symptom-checker"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-white hover:bg-slate-100 text-teal-900 font-bold text-sm shadow-md transition-all active:scale-95"
            >
              <span>Launch Symptom Checker</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;