import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { RoleProvider } from './contexts/RoleContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { NotificationModalProvider } from './contexts/NotificationModalContext';
import DashboardLayout from './components/DashboardLayout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import ActivityLog from './pages/ActivityLog';
import Demo from './pages/Demo';
import KnowledgeBase from './pages/KnowledgeBase';
import ChatbotPlayground from './pages/ChatbotPlayground';
import WidgetCustomization from './pages/WidgetCustomization';
import Analytics from './pages/Analytics';
import TeamManagement from './pages/TeamManagement';
import UserManagement from './pages/UserManagement';
import APIKeys from './pages/APIKeys';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <ToastProvider>
          <NotificationModalProvider>
            <RoleProvider>
              <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Dashboard Routes */}
              <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
              <Route path="/activity" element={<DashboardLayout><ActivityLog /></DashboardLayout>} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/knowledge-base" element={<DashboardLayout><KnowledgeBase /></DashboardLayout>} />
              <Route path="/playground" element={<DashboardLayout><ChatbotPlayground /></DashboardLayout>} />
              <Route path="/customization" element={<DashboardLayout><WidgetCustomization /></DashboardLayout>} />
              <Route path="/analytics" element={<DashboardLayout><Analytics /></DashboardLayout>} />
              <Route path="/team" element={<DashboardLayout><TeamManagement /></DashboardLayout>} />
              <Route path="/users" element={<DashboardLayout><UserManagement /></DashboardLayout>} />
              <Route path="/api-keys" element={<DashboardLayout><APIKeys /></DashboardLayout>} />
              <Route path="/billing" element={<DashboardLayout><Billing /></DashboardLayout>} />
              <Route path="/settings" element={<DashboardLayout><Settings /></DashboardLayout>} />
              <Route path="/profile" element={<DashboardLayout><Profile /></DashboardLayout>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </RoleProvider>
        </NotificationModalProvider>
        </ToastProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
