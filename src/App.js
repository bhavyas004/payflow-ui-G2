// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import PasswordReset from './pages/PasswordReset';
import EmployeeLoginForm from './pages/EmployeeLoginForm';
import EmployeeOnboardingForm from './pages/EmployeeOnboardingForm';
import ResetPasswordForm from './pages/ResetPasswordForm';
import UnifiedDemo from './UnifiedDemo';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/employee-login" element={<EmployeeLoginForm />} />
        <Route path="/onboarding" element={<EmployeeOnboardingForm />} />
        <Route path="/reset-password" element={<PasswordReset />} />
        <Route path="/reset-password-form" element={<ResetPasswordForm />} />
        
        {/* PayFlow-AI Unified Interface */}
        <Route path="/payflow-ai" element={<UnifiedDemo />} />
        <Route path="/payflow-ai/*" element={<UnifiedDemo />} />
        
        {/* Legacy route redirects to unified interface */}
        <Route path="/dashboard" element={<Navigate to="/payflow-ai/dashboard" replace />} />
        <Route path="/admin-dashboard" element={<Navigate to="/payflow-ai/dashboard" replace />} />
        <Route path="/hr-dashboard" element={<Navigate to="/payflow-ai/dashboard" replace />} />
        <Route path="/manager-dashboard" element={<Navigate to="/payflow-ai/dashboard" replace />} />
        <Route path="/employee-dashboard" element={<Navigate to="/payflow-ai/dashboard" replace />} />
        
      </Routes>
    </Router>
  );
}

export default App;
