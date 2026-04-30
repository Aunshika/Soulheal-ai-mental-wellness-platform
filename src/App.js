import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import MoodTracker from './pages/MoodTracker';
import AssessmentPage from './pages/AssessmentPage';
import AppointmentPage from './pages/AppointmentPage';
import ResourcesPage from './pages/ResourcesPage';
import CounselorPanel from './pages/CounselorPanel';
import AdminDashboard from './pages/AdminDashboard';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';
import LoadingScreen from './components/LoadingScreen';

// Protected route
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectMap = { student: '/dashboard', counselor: '/counselor', admin: '/admin' };
    return <Navigate to={redirectMap[user.role] || '/login'} replace />;
  }
  return children;
};

// Public route (redirect if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) {
    const redirectMap = { student: '/dashboard', counselor: '/counselor', admin: '/admin' };
    return <Navigate to={redirectMap[user.role] || '/dashboard'} replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Global Protected Routes */}
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />

          {/* Student */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/mood" element={<ProtectedRoute allowedRoles={['student']}><MoodTracker /></ProtectedRoute>} />
          <Route path="/assessment" element={<ProtectedRoute allowedRoles={['student']}><AssessmentPage /></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute allowedRoles={['student']}><AppointmentPage /></ProtectedRoute>} />
          <Route path="/chat/:id" element={<ProtectedRoute allowedRoles={['student']}><ChatPage /></ProtectedRoute>} />
          <Route path="/resources" element={<ProtectedRoute allowedRoles={['student', 'counselor']}><ResourcesPage /></ProtectedRoute>} />

          {/* Counselor */}
          <Route path="/counselor" element={<ProtectedRoute allowedRoles={['counselor']}><CounselorPanel /></ProtectedRoute>} />

          {/* Default */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
