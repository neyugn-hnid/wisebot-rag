import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { RoleProvider, useRole } from './contexts/RoleContext';
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
import WidgetEmbedTest from './pages/WidgetEmbedTest';
import Analytics from './pages/Analytics';
import TeamManagement from './pages/TeamManagement';
import UserManagement from './pages/UserManagement';
import APIKeys from './pages/APIKeys';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

type AppRole = 'ADMIN' | 'OWNER' | 'USER';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: AppRole[] }) {
  const { isAuthenticated, isReady, role } = useRole();

  if (!isReady) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

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
              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
              <Route path="/activity" element={<ProtectedRoute><DashboardLayout><ActivityLog /></DashboardLayout></ProtectedRoute>} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/knowledge-base" element={<ProtectedRoute><DashboardLayout><KnowledgeBase /></DashboardLayout></ProtectedRoute>} />
              <Route path="/playground" element={<ProtectedRoute><DashboardLayout><ChatbotPlayground /></DashboardLayout></ProtectedRoute>} />
              <Route path="/customization" element={<ProtectedRoute><DashboardLayout><WidgetCustomization /></DashboardLayout></ProtectedRoute>} />
              <Route path="/widget-test" element={<ProtectedRoute><WidgetEmbedTest /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><Analytics /></DashboardLayout></ProtectedRoute>} />
              <Route path="/team" element={<ProtectedRoute><DashboardLayout><TeamManagement /></DashboardLayout></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><UserManagement /></DashboardLayout></ProtectedRoute>} />
              <Route path="/api-keys" element={<ProtectedRoute><DashboardLayout><APIKeys /></DashboardLayout></ProtectedRoute>} />
              <Route path="/billing" element={<ProtectedRoute><DashboardLayout><Billing /></DashboardLayout></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><DashboardLayout><Settings /></DashboardLayout></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><DashboardLayout><Profile /></DashboardLayout></ProtectedRoute>} />

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
