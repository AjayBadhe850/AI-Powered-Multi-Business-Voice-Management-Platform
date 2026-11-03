import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VoiceProvider } from './context/VoiceContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import VoiceAssistantModal from './components/VoiceAssistantModal';
import PrintPreviewModal from './components/PrintPreviewModal';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TravelPage from './pages/TravelPage';
import MobileShopPage from './pages/MobileShopPage';
import FuelStationPage from './pages/FuelStationPage';
import VoiceAssistantPage from './pages/VoiceAssistantPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

function ProtectedLayout({ children, onOpenVoiceModal }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-sm font-semibold animate-pulse">Authenticating Session...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar onOpenVoiceModal={onOpenVoiceModal} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function MainApp() {
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedLayout onOpenVoiceModal={() => setIsVoiceModalOpen(true)}>
              <DashboardPage onOpenVoiceModal={() => setIsVoiceModalOpen(true)} />
            </ProtectedLayout>
          }
        />

        <Route
          path="/travel"
          element={
            <ProtectedLayout onOpenVoiceModal={() => setIsVoiceModalOpen(true)}>
              <TravelPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/mobile-shop"
          element={
            <ProtectedLayout onOpenVoiceModal={() => setIsVoiceModalOpen(true)}>
              <MobileShopPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/fuel-station"
          element={
            <ProtectedLayout onOpenVoiceModal={() => setIsVoiceModalOpen(true)}>
              <FuelStationPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/assistant"
          element={
            <ProtectedLayout onOpenVoiceModal={() => setIsVoiceModalOpen(true)}>
              <VoiceAssistantPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedLayout onOpenVoiceModal={() => setIsVoiceModalOpen(true)}>
              <ReportsPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedLayout onOpenVoiceModal={() => setIsVoiceModalOpen(true)}>
              <SettingsPage />
            </ProtectedLayout>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
      <PrintPreviewModal />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <VoiceProvider>
          <MainApp />
        </VoiceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

