// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import HRDashboard from './pages/HRDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeManagement from './pages/EmployeeManagement';
import HREmployeeManagement from './pages/HREmployeeManagement';
import OnboardingPage from './pages/EmployeeOnboardingForm'; // Assuming you have this page
import ResetPasswordForm from './pages/ResetPasswordForm'; // Import the reset password form
import PasswordReset from './pages/PasswordReset';
import EmployeeDashboard from './pages/EmployeeDashboard'; // Assuming you have this page
import EmployeeLoginForm from './pages/EmployeeLoginForm'; // Assuming you have this page


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<HRDashboard />} />
        <Route path="/hr-dashboard" element={<HRDashboard />} />
        <Route path="/manager-dashboard" element={<ManagerDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/employees" element={<EmployeeManagement />} />
        <Route path="/hr-employees" element={<HREmployeeManagement />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
        <Route path="/employee-login" element={<EmployeeLoginForm />} />
        {/* Optionally, add a fallback route */}
        {/* <Route path="*" element={<div>Page Not Found</div>} /> */}
        <Route path="/reset-password" element={<PasswordReset />} />
      </Routes>
    </Router>
  );
}

export default App;
