// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import PasswordReset from './pages/PasswordReset';
import EmployeeLoginForm from './pages/EmployeeLoginForm';
import EmployeeOnboardingForm from './pages/EmployeeOnboardingForm';
import ResetPasswordForm from './pages/ResetPasswordForm';
import AuthRouter from './AuthRouter';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/employee-login" element={<EmployeeLoginForm />} />
        <Route path="/reset-password" element={<PasswordReset />} />
        
        {/* PayFlow-AI authenticated interface */}
        <Route path="/payflow-ai" element={<AuthRouter />} />
        <Route path="/payflow-ai/*" element={<AuthRouter />} />
        
      </Routes>
    </Router>
  );
}

export default App;
