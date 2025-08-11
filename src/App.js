// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import EmployeeLeaveRequests from './pages/EmployeeLeaveRequests'; // Import the employee leave requests page
import LeaveRequestForm from './pages/LeaveRequestForm'; // Assuming you have this page
import ManagerLeaveRequests from './pages/ManagerLeaveRequests';
import HRPayroll from './pages/HRPayroll';
import CTCManagement from './pages/CTCManagement';
import PayslipView from './pages/PayslipView';
import ManagerEmployees from './pages/ManagerEmployees';
import ManagerEmployeeOnboarding from './pages/ManagerEmployeeOnboarding';
import EmployeePayroll from './pages/EmployeePayroll';
import DesignSystemDemo from './pages/DesignSystemDemo'; // Add design system demo
import DashboardLayoutOptions from './pages/DashboardLayoutOptions'; // Add layout options demo
import UnifiedDemo from './UnifiedDemo'; // Add unified demo

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/employees" element={<EmployeeManagement />} />
        <Route path="/hr-employees" element={<HREmployeeManagement />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/employee-login" element={<EmployeeLoginForm />} />
        <Route path="/employee-leave-requests" element={<EmployeeLeaveRequests />} />
        <Route path="/reset-password" element={<PasswordReset />} />
        <Route path="employee-leave-request" element={<LeaveRequestForm />} />
        <Route path="/manager-leave-requests" element={<ManagerLeaveRequests />} />
        <Route path="/hr-payroll" element={<HRPayroll />} />
        <Route path="/ctc-management" element={<CTCManagement />} />
        <Route path="/payslip-view" element={<PayslipView />} />
        <Route path="/manager-employees" element={<ManagerEmployees />} />
        <Route path="/manager-onboarding" element={<ManagerEmployeeOnboarding />} />
        <Route path="/employee-payroll" element={<EmployeePayroll />} />
        <Route path="/design-demo" element={<DesignSystemDemo />} /> {/* Design System Demo */}
        <Route path="/layout-options" element={<DashboardLayoutOptions />} /> {/* Dashboard Layout Options */}
        <Route path="/payflow-ai" element={<UnifiedDemo />} /> {/* Main Unified Interface */}
        <Route path="/payflow-ai/*" element={<UnifiedDemo />} /> {/* Main Unified Interface Nested Routes */}
        
        {/* Route redirects to unified interface */}
        <Route path="/dashboard" element={<Navigate to="/payflow-ai/dashboard" replace />} />
        <Route path="/admin-dashboard" element={<Navigate to="/payflow-ai/dashboard" replace />} />
        <Route path="/hr-dashboard" element={<Navigate to="/payflow-ai/dashboard" replace />} />
        <Route path="/manager-dashboard" element={<Navigate to="/payflow-ai/dashboard" replace />} />
        <Route path="/employee-dashboard" element={<Navigate to="/payflow-ai/dashboard" replace />} />
        
        {/* Legacy routes for backward compatibility */}
        <Route path="/legacy/dashboard" element={<HRDashboard />} />
        <Route path="/legacy/hr-dashboard" element={<HRDashboard />} />
        <Route path="/legacy/manager-dashboard" element={<ManagerDashboard />} />
        <Route path="/legacy/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/legacy/employee-dashboard" element={<EmployeeDashboard />} />
        
      </Routes>
    </Router>
  );
}

export default App;
