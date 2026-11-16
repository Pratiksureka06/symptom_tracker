import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import SymptomCheckerPage from './pages/SymptomCheckerPage';
import ResultsPage from './pages/ResultsPage';
import HistoryPage from './pages/HistoryPage';
import MedicationPage from './pages/MedicationPage';
import AnalyticsPage from './pages/AnalyticsPage';
import DoctorDirectoryPage from './pages/DoctorDirectoryPage';
import DoctorPortalPage from './pages/DoctorPortalPage';
import PatientConsultationsPage from './pages/PatientConsultationsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { SymptomProvider } from './contexts/SymptomContext';
import { MedicationProvider } from './contexts/MedicationContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <ToastProvider>
        <AuthProvider>
          <SymptomProvider>
            <MedicationProvider>
              <Router>
                <div className="flex flex-col min-h-[100svh] bg-surface-sunken">
                  <a href="#main-content" className="skip-link">
                    Skip to main content
                  </a>
                  <Header />
                  <main id="main-content" className="flex-grow">
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/symptom-checker" element={<SymptomCheckerPage />} />
                      <Route path="/results" element={<ResultsPage />} />
                      <Route path="/doctors" element={<DoctorDirectoryPage />} />
                      <Route path="/doctor-portal" element={<DoctorPortalPage />} />
                      <Route path="/my-consultations" element={<PatientConsultationsPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/history" element={<HistoryPage />} />
                      <Route path="/medication" element={<MedicationPage />} />
                      <Route path="/analytics" element={<AnalyticsPage />} />
                    </Routes>
                  </main>
                  <Footer />
                </div>
              </Router>
            </MedicationProvider>
          </SymptomProvider>
        </AuthProvider>
    </ToastProvider>
  );
}

export default App;