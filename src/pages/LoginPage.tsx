import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { User, Stethoscope, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login, loginAsDemo } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      addToast('error', 'Please enter your email address.');
      return;
    }
    setIsLoading(true);
    try {
      await login(email, role);
      addToast('success', `Welcome back! Logged in as ${role === 'doctor' ? 'Physician' : 'Patient'}.`);
      navigate(role === 'doctor' ? '/doctor-portal' : '/');
    } catch {
      addToast('error', 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (demoRole: UserRole, specialty?: string) => {
    loginAsDemo(demoRole, specialty);
    addToast(
      'success',
      demoRole === 'doctor'
        ? `Logged in as Dr. Thorne (${specialty || 'Pulmonologist'})`
        : 'Signed in as the demo patient, Ananya Rao'
    );
    navigate(demoRole === 'doctor' ? '/doctor-portal' : '/');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="bg-[rgb(var(--ink))] hover:bg-[rgb(var(--field-low))] inline-flex items-center justify-center w-14 h-14 rounded-lg text-white mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="app-title">
            Sign in to MediScan
          </h1>
          <p className="mt-1 text-sm text-[rgb(var(--ink-soft))]">
            Your checks and history, on whichever device you use next.
          </p>
        </div>

        {/* 1-Click Demo Logins Banner */}
        <div className="app-panel bg-[rgb(var(--app-raised))]/70 border border-[rgb(var(--app-border))]/80 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles className="w-4 h-4 text-[rgb(var(--ink))]" />
            <span className="text-[0.8125rem] font-bold text-[rgb(var(--ink))]">
              1-Click Academic / Demo Evaluation
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('patient')}
              className="px-3 py-2 rounded-lg bg-white border border-[rgb(var(--app-border))] hover:border-[rgb(var(--app-border))] hover:bg-[rgb(var(--app-raised))]/50 text-[0.8125rem] font-semibold text-slate-800 text-left transition-colors flex items-center gap-2"
            >
              <div className="w-6 h-6 rounded-lg bg-[rgb(var(--app-raised))] flex items-center justify-center text-[rgb(var(--ink))] shrink-0 font-bold">
                P
              </div>
              <div className="truncate">
                <p className="font-semibold truncate">Patient Demo</p>
                <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))]">Ananya Rao, 42</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('doctor', 'Pulmonologist')}
              className="px-3 py-2 rounded-lg bg-white border border-[rgb(var(--app-border))] hover:border-[rgb(var(--app-border))] hover:bg-[rgb(var(--app-raised))]/50 text-[0.8125rem] font-semibold text-slate-800 text-left transition-colors flex items-center gap-2"
            >
              <div className="w-6 h-6 rounded-lg bg-[rgb(var(--app-raised))] flex items-center justify-center text-[rgb(var(--ink))] shrink-0 font-bold">
                Dr
              </div>
              <div className="truncate">
                <p className="font-semibold truncate">Dr. Thorne, MD</p>
                <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))]">Pulmonologist</p>
              </div>
            </button>
          </div>
        </div>

        {/* Main Login Card */}
        <div className="app-panel bg-white/95 p-6 sm:p-8 rounded-lg border border-slate-200/80">
          {/* Role Toggle Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[rgb(var(--app-raised))]/90 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => setRole('patient')}
              className={`flex items-center justify-center gap-2 py-2 text-[0.8125rem] font-bold rounded-lg transition-colors ${
 role === 'patient'
 ? 'bg-white text-[rgb(var(--ink))] border border-slate-200/60'
 : 'text-slate-600 hover:text-slate-900'
 }`}
            >
              <User className="w-4 h-4" />
              <span>Patient Portal</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('doctor')}
              className={`flex items-center justify-center gap-2 py-2 text-[0.8125rem] font-bold rounded-lg transition-colors ${
 role === 'doctor'
 ? 'bg-white text-[rgb(var(--ink))] border border-slate-200/60'
 : 'text-slate-600 hover:text-slate-900'
 }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Doctor Portal</span>
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[0.8125rem] font-bold text-slate-700 mb-1.5">
                {role === 'doctor' ? 'Physician Email' : 'Patient Email'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[rgb(var(--ink-soft))] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'doctor' ? 'dr.thorne@mediscan.org' : 'patient@example.com'}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-[rgb(var(--app-ground))] border border-slate-200 rounded-lg focus:outline-none focus:border-[rgb(var(--app-border))] focus:ring-4 focus:ring-[rgb(var(--app-border))]/10 transition-colors text-slate-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[0.8125rem] font-bold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[rgb(var(--ink-soft))] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-[rgb(var(--app-ground))] border border-slate-200 rounded-lg focus:outline-none focus:border-[rgb(var(--app-border))] focus:ring-4 focus:ring-[rgb(var(--app-border))]/10 transition-colors text-slate-900"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-[rgb(var(--ink))] hover:bg-[rgb(var(--field-low))] w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-white font-bold text-sm active:scale-[0.99] transition-colors disabled:opacity-50"
              >
                <span>{isLoading ? 'Signing In...' : `Sign In as ${role === 'doctor' ? 'Doctor' : 'Patient'}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[0.8125rem] text-[rgb(var(--ink-soft))]">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-[rgb(var(--ink))] hover:text-[rgb(var(--ink))]">
                Register as Patient or Doctor
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
