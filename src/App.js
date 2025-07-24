// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import HRDashboard from './pages/HRDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import CreateUser from './pages/CreateUser';
import PasswordReset from './pages/PasswordReset';
import EmployeeOnboardingForm from './pages/EmployeeOnboardingForm';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/hr-dashboard" element={<HRDashboard />} />
        <Route path="/manager-dashboard" element={<ManagerDashboard />} />
        <Route path="/create-user" element={<CreateUser />} />
        <Route path="/reset-password" element={<PasswordReset />} />
        <Route path="/onboard" element={<EmployeeOnboardingForm />} />
      </Routes>
    </Router>
  );
}

export default App;
