import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Menu, 
  X, 
  Globe, 
  History, 
  Home, 
  Activity, 
  BarChart2, 
  Pill, 
  ShieldCheck,
  ChevronDown,
  Stethoscope,
  User,
  LogOut,
  CalendarCheck
} from 'lucide-react';

const Header: React.FC = () => {
  const { language, setLanguage, t, availableLanguages } = useLanguage();
  const { currentUser, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (isLanguageMenuOpen) setIsLanguageMenuOpen(false);
    if (isUserMenuOpen) setIsUserMenuOpen(false);
  };

  const toggleLanguageMenu = () => {
    setIsLanguageMenuOpen(!isLanguageMenuOpen);
    if (isUserMenuOpen) setIsUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
    if (isLanguageMenuOpen) setIsLanguageMenuOpen(false);
  };

  const changeLanguage = (lang: typeof language) => {
    setLanguage(lang);
    setIsLanguageMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  // Language names for display
  const languageNames: Record<string, string> = {
    en: 'English',
    hi: 'हिन्दी',
    bn: 'বাংলা',
    te: 'తెలుగు',
    mr: 'मराठी',
    ta: 'தமிழ்',
    gu: 'ગુજરાતી',
    kn: 'ಕನ್ನಡ',
    ml: 'മലയാളം',
    pa: 'ਪੰਜਾਬੀ',
    as: 'অসমীয়া',
    or: 'ଓଡ଼ିଆ'
  };

  const isDoctor = currentUser?.role === 'doctor';

  const navLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/symptom-checker', label: 'Symptom Checker', icon: Activity },
    { path: '/doctors', label: 'Find Specialists', icon: Stethoscope },
    ...(isDoctor
      ? [{ path: '/doctor-portal', label: 'Doctor Portal', icon: ShieldCheck }]
      : [{ path: '/my-consultations', label: 'Consultations', icon: CalendarCheck }]),
    { path: '/analytics', label: 'Analytics', icon: BarChart2 },
    { path: '/history', label: 'History', icon: History },
    { path: '/medication', label: 'Medication', icon: Pill },
  ];

  return (
    <header className="bg-paper sticky top-0 z-50">
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10 lg:px-12">
        <div className="flex justify-between items-center h-16">
          
          {/* Brand Identity & Logo */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <span className="font-display text-[1.5rem] leading-none text-onink">MediScan</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1 pl-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-2 text-small ${
                      isActive
                        ? 'font-semibold text-onink underline underline-offset-4'
                        : 'text-ink-soft hover:text-onink'
                    }`}
                  >
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Trailing Controls & Status */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* PWA Sync Status Pill */}
            <div className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Online • Synced</span>
            </div>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                onClick={toggleLanguageMenu}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
                aria-expanded={isLanguageMenuOpen}
              >
                <Globe className="h-3.5 w-3.5 text-slate-500" />
                <span className="hidden md:inline">{languageNames[language]}</span>
                <ChevronDown className="h-3 w-3 text-slate-500" />
              </button>

              {isLanguageMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-40 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 max-h-64 overflow-y-auto">
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => changeLanguage(lang)}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors ${
                        language === lang 
                          ? 'bg-teal-50 text-teal-700 font-bold' 
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{languageNames[lang]}</span>
                      {language === lang && <span className="text-teal-700 text-[11px]">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Account / Role Badge */}
            {isAuthenticated && currentUser ? (
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-medium transition-all"
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white text-[11px] font-bold ${
                    isDoctor ? 'bg-gradient-to-tr from-emerald-600 to-teal-500' : 'bg-gradient-to-tr from-teal-600 to-cyan-500'
                  }`}>
                    {isDoctor ? 'Dr' : 'P'}
                  </div>
                  <div className="text-left truncate max-w-[110px]">
                    <p className="font-bold text-slate-800 truncate leading-none">{currentUser.name.split(' ')[0]}</p>
                    <p className="text-[10px] text-teal-700 font-semibold uppercase tracking-wider leading-none mt-0.5">
                      {isDoctor ? 'Physician' : 'Patient'}
                    </p>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-800">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200/60">
                        {isDoctor ? (currentUser as any).specialty || 'Physician' : 'Patient Account'}
                      </span>
                    </div>

                    <div className="py-1">
                      {isDoctor ? (
                        <Link
                          to="/doctor-portal"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                        >
                          <ShieldCheck className="w-4 h-4 text-teal-700" />
                          <span>Doctor Review Dashboard</span>
                        </Link>
                      ) : (
                        <Link
                          to="/my-consultations"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                        >
                          <CalendarCheck className="w-4 h-4 text-teal-700" />
                          <span>My Consultations</span>
                        </Link>
                      )}
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-2 text-small text-ink-soft hover:text-onink"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-onink px-4 py-2 text-small font-semibold text-paper hover:bg-field-low"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 py-3 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {/* Mobile Auth Buttons */}
            <div className="pt-2 border-t border-slate-100 px-3 space-y-2">
              {isAuthenticated && currentUser ? (
                <div className="flex items-center justify-between py-1">
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">{currentUser.name}</p>
                    <p className="text-[11px] text-teal-700">{isDoctor ? 'Physician' : 'Patient'}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-xs text-rose-600 font-bold hover:underline"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-center py-2 bg-slate-100 text-slate-800 text-xs font-bold rounded-xl"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-center py-2 bg-teal-700 text-white text-xs font-bold rounded-xl"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;