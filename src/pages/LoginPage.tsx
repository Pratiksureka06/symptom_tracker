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
        : 'Logged in as Demo Patient (John Doe)'
    );
    navigate(demoRole === 'doctor' ? '/doctor-portal' : '/');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-teal-50/25 to-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-lg shadow-teal-600/30 mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Sign In to MediScan
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Access intelligent diagnostic tracking & clinical review portal
          </p>
        </div>

        {/* 1-Click Demo Logins Banner */}
        <div className="glass-card bg-teal-50/70 border border-teal-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles className="w-4 h-4 text-teal-700" />
            <span className="text-xs font-bold text-teal-900 uppercase tracking-wider">
              1-Click Academic / Demo Evaluation
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('patient')}
              className="px-3 py-2 rounded-xl bg-white border border-teal-200 hover:border-teal-400 hover:bg-teal-50/50 text-xs font-semibold text-slate-800 text-left transition-all shadow-sm flex items-center gap-2"
            >
              <div className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700 shrink-0 font-bold">
                P
              </div>
              <div className="truncate">
                <p className="font-semibold truncate">Patient Demo</p>
                <p className="text-[10px] text-slate-500">John Doe (42M)</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('doctor', 'Pulmonologist')}
              className="px-3 py-2 rounded-xl bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-xs font-semibold text-slate-800 text-left transition-all shadow-sm flex items-center gap-2"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 font-bold">
                Dr
              </div>
              <div className="truncate">
                <p className="font-semibold truncate">Dr. Thorne, MD</p>
                <p className="text-[10px] text-slate-500">Pulmonologist</p>
              </div>
            </button>
          </div>
        </div>

        {/* Main Login Card */}
        <div className="glass-card bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xl shadow-teal-900/5">
          {/* Role Toggle Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100/90 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => setRole('patient')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${
                role === 'patient'
                  ? 'bg-white text-teal-800 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Patient Portal</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('doctor')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${
                role === 'doctor'
                  ? 'bg-white text-teal-800 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Doctor Portal</span>
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {role === 'doctor' ? 'Physician Email' : 'Patient Email'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'doctor' ? 'dr.thorne@mediscan.org' : 'patient@example.com'}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all text-slate-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all text-slate-900"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm shadow-md shadow-teal-600/25 active:scale-[0.99] transition-all disabled:opacity-50"
              >
                <span>{isLoading ? 'Signing In...' : `Sign In as ${role === 'doctor' ? 'Doctor' : 'Patient'}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-teal-700 hover:text-teal-700">
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
