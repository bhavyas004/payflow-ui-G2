import React, { useState, useEffect } from 'react';
import { useAuth } from '../../shared/hooks/useAuth';
import Layout from '../../shared/components/Layout';
import PermissionWrapper from '../../shared/components/PermissionWrapper';
import axios from 'axios';
import '../../shared/styles/unified.css';

/**
 * Unified Leave Management Component
 * Role-based leave interface with permission-controlled features
 */
function UnifiedLeaveManagement() {
  const { user, role, getToken, checkRole } = useAuth();
  
  // Helper function to check if user can access certain roles
  const canAccess = (roles) => checkRole(roles);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveStats, setLeaveStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    myLeaveBalance: 20,
    myUsedLeaves: 5
  });

  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [totalDays, setTotalDays] = useState(0);
  const [leaveBalance, setLeaveBalance] = useState({ remaining: 12, used: 0, total: 12 });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // Filter for My Leave Requests
  const [employeeDetails, setEmployeeDetails] = useState(null); // Store complete employee details

  // JWT parser function (matching existing code pattern)
  const parseJwt = (token) => {
    if (!token) return {};
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return {};
    }
  };

  // Fetch complete employee details from the employee endpoint
  const fetchEmployeeDetails = async (employeeId, token) => {
    try {
      console.log('🔍 Fetching employee details for ID:', employeeId);
      
      const response = await axios.get('/payflowapi/onboard-employee/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('👥 All employees response:', response.data);
      
      // Find the specific employee by ID
      let employee = null;
      if (Array.isArray(response.data)) {
        employee = response.data.find(emp => emp.id === employeeId);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        employee = response.data.data.find(emp => emp.id === employeeId);
      }
      
      if (employee) {
        console.log('✅ Found employee details:', employee);
        setEmployeeDetails(employee);
        
        // Update user context with complete employee info if needed
        // This ensures we have the most up-to-date employee information
        return employee;
      } else {
        console.log('❌ Employee not found in the list');
        return null;
      }
      
    } catch (error) {
      console.error('❌ Error fetching employee details:', error);
      console.error('Error response:', error.response?.data);
      return null;
    }
  };

  useEffect(() => {
    console.log('=== useEffect triggered ===');
    console.log('User:', user);
    console.log('Role:', role);
    console.log('User ID:', user?.id);
    
    // Add a small delay to ensure user is fully loaded
    const timer = setTimeout(() => {
      // For EMPLOYEE role, we need user.id (employeeId)
      // For MANAGER/ADMIN/HR roles, we need username which is available
      const hasRequiredUserData = user && (
        (role === 'EMPLOYEE' && user.id) || 
        (role !== 'EMPLOYEE' && user.username)
      );
      
      if (hasRequiredUserData && role) {
        console.log('✅ Calling fetchLeaveData...');
        fetchLeaveData();
      } else {
        console.log('❌ NOT calling fetchLeaveData - missing data:');
        console.log('  - user exists:', !!user);
        console.log('  - user.id exists:', !!user?.id);
        console.log('  - user.username exists:', !!user?.username);
        console.log('  - role exists:', !!role);
        console.log('  - required data for role:', hasRequiredUserData);
      }
    }, 100); // Small delay to ensure state is stable

    return () => clearTimeout(timer);
  }, [user, role]); // Watch both user and role objects

  // Additional useEffect to handle delayed authentication loading
  useEffect(() => {
    console.log('=== Secondary useEffect for auth check ===');
    
    // Check if we have a JWT token but user is not loaded yet
    const token = sessionStorage.getItem('jwtToken');
    if (token && !user) {
      console.log('📍 Token exists but user not loaded, waiting for auth...');
      
      // Set up a polling check for when user becomes available
      const checkAuth = setInterval(() => {
        const hasRequiredUserData = user && (
          (role === 'EMPLOYEE' && user.id) || 
          (role !== 'EMPLOYEE' && user.username)
        );
        
        if (hasRequiredUserData && role) {
          console.log('📍 Auth loaded, fetching data...');
          fetchLeaveData();
          clearInterval(checkAuth);
        }
      }, 500); // Check every 500ms

      // Clear interval after 10 seconds to avoid infinite polling
      setTimeout(() => clearInterval(checkAuth), 10000);
      
      return () => clearInterval(checkAuth);
    }
  }, []); // Run only once on mount

  // Fallback useEffect to ensure data is loaded when tab becomes active
  useEffect(() => {
    const hasRequiredUserData = user && (
      (role === 'EMPLOYEE' && user.id) || 
      (role !== 'EMPLOYEE' && user.username)
    );
    
    if (activeTab === 'overview' && hasRequiredUserData && role && leaveRequests.length === 0 && !loading) {
      console.log('📍 Overview tab active but no data, triggering fetch...');
      fetchLeaveData();
    }
  }, [activeTab, user, role, leaveRequests.length, loading]);

  // Calculate total days when dates change (following existing business logic)
  useEffect(() => {
    if (leaveForm.startDate && leaveForm.endDate) {
      const start = new Date(leaveForm.startDate);
      const end = new Date(leaveForm.endDate);
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end dates
      setTotalDays(diffDays > 0 ? diffDays : 0);
    } else {
      setTotalDays(0);
    }
  }, [leaveForm.startDate, leaveForm.endDate]);

  // Early return if user is not loaded yet - AFTER all hooks
  if (!user) {
    return (
      <div className="unified-layout">
        <div className="unified-content">
          <div className="loading-state">
            <h3>Loading user information...</h3>
            <p>Please wait while we load your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  // Helper functions for formatting (following existing business logic)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const getStatusBadgeClass = (status) => {
    if (!status) return '';
    switch (status.toLowerCase()) {
      case 'approved': return 'approved';
      case 'rejected': return 'rejected';
      case 'pending': return 'pending';
      case 'cancelled': return 'cancelled';
      default: return '';
    }
  };

  const fetchLeaveData = async () => {
    console.log('🚀 fetchLeaveData called');
    
    // Guard clause - don't fetch if user is not loaded
    if (!user) {
      console.log('❌ No user, returning early');
      return;
    }

    try {
      setLoading(true);
      console.log('📡 Starting API call...');
      
      // Use sessionStorage directly like existing code
      const token = sessionStorage.getItem('jwtToken');
      console.log('🔑 Token exists:', !!token);
      
      if (!token) {
        console.log('❌ No JWT token found');
        return;
      }
      
      const headers = { Authorization: `Bearer ${token}` };
      
      // Parse JWT to get employeeId like existing code
      const payload = parseJwt(token);
      const employeeId = payload.employeeId;
      
      console.log('👤 Payload:', payload);
      console.log('🆔 Employee ID:', employeeId);
      console.log('🎭 Role:', role);
      
      if (role === 'EMPLOYEE') {
        console.log('👨‍💼 Processing EMPLOYEE role');
        
        if (!employeeId) {
          console.log('❌ No employee ID found');
          setLeaveRequests([]);
          setLeaveBalance({ total: 12, remaining: 12, used: 0 });
          setLeaveStats({
            totalRequests: 0,
            pendingRequests: 0,
            approvedRequests: 0,
            rejectedRequests: 0,
            myLeaveBalance: 12,
            myUsedLeaves: 0
          });
          return;
        }
        
        // Fetch complete employee details first
        console.log('📋 Fetching employee details...');
        const employeeData = await fetchEmployeeDetails(employeeId, token);
        if (employeeData) {
          console.log('✅ Employee details fetched successfully');
        }
        
        // Use large page size to get all requests (matching existing pattern)
        const endpoint = `/payflowapi/leave-requests/employee/${employeeId}?page=0&size=1000`;
        console.log('📞 Employee API endpoint:', endpoint);
        
        try {
          console.log('🔄 Making employee API call...');
          const response = await axios.get(endpoint, { headers });
          console.log('✅ Employee API response:', response.data);
          
          if (response.data.success) {
            const allRequests = response.data.data || [];
            setLeaveRequests(allRequests);
            
            // Calculate leave balance using existing logic
            const approvedRequests = allRequests.filter(req => req.status?.toLowerCase() === 'approved');
            const pendingRequests = allRequests.filter(req => req.status?.toLowerCase() === 'pending');
            const rejectedRequests = allRequests.filter(req => req.status?.toLowerCase() === 'rejected');
            
            const usedDays = approvedRequests.reduce((total, req) => total + (req.totalDays || 0), 0);
            const pendingDays = pendingRequests.reduce((total, req) => total + (req.totalDays || 0), 0);
            
            const newLeaveBalance = {
              total: 12,
              remaining: Math.max(0, 12 - usedDays),
              used: usedDays
            };
            
            setLeaveBalance(newLeaveBalance);
            
            // Calculate statistics
            const stats = {
              totalRequests: allRequests.length,
              pendingRequests: pendingRequests.length,
              approvedRequests: approvedRequests.length,
              rejectedRequests: rejectedRequests.length,
              myLeaveBalance: Math.max(0, 12 - usedDays),
              myUsedLeaves: usedDays
            };
            
            setLeaveStats(stats);
          } else {
            // Set default values if no data
            setLeaveRequests([]);
            setLeaveBalance({ total: 12, remaining: 12, used: 0 });
            setLeaveStats({
              totalRequests: 0,
              pendingRequests: 0,
              approvedRequests: 0,
              rejectedRequests: 0,
              myLeaveBalance: 12,
              myUsedLeaves: 0
            });
          }
        } catch (error) {
          console.error('Error fetching employee leave data:', error);
          setLeaveRequests([]);
          // Set default values on error
          setLeaveBalance({ total: 12, remaining: 12, used: 0 });
          setLeaveStats({
            totalRequests: 0,
            pendingRequests: 0,
            approvedRequests: 0,
            rejectedRequests: 0,
            myLeaveBalance: 12,
            myUsedLeaves: 0
          });
        }
        return;
      } else if (role === 'MANAGER') {
        console.log('👨‍💼 Processing MANAGER role');
        
        // Parse JWT to get the username that will be sent to backend
        const payload = parseJwt(token);
        console.log('🔍 JWT payload for manager:', payload);
        console.log('📧 Manager username (sub):', payload.sub);
        console.log('📧 Manager username (username field):', payload.username);
        console.log('🆔 Manager employeeId:', payload.employeeId);
        
        // The backend expects the username from JWT token
        const managerUsername = payload.username || payload.sub;
        console.log('🎯 Using manager username:', managerUsername);
        
        try {
          // Use the exact same endpoint as existing ManagerLeaveRequests component
          const teamEndpoint = '/payflowapi/leave-requests/manager/team';
          console.log('📞 Manager API endpoint:', teamEndpoint);
          console.log('🔑 Authorization header:', `Bearer ${token.substring(0, 20)}...`);
          
          console.log('🔄 Making manager API call...');
          const teamResponse = await axios.get(teamEndpoint, { headers });
          console.log('✅ Manager API response:', teamResponse.data);
          
          if (teamResponse.data.success) {
            const allTeamRequests = teamResponse.data.data || [];
            console.log('📋 Setting leave requests:', allTeamRequests);
            console.log('📊 Number of requests to set:', allTeamRequests.length);
            
            setLeaveRequests(allTeamRequests);
            
            // Calculate comprehensive statistics for manager role
            const pendingRequests = allTeamRequests.filter(req => req.status?.toLowerCase() === 'pending');
            const approvedRequests = allTeamRequests.filter(req => req.status?.toLowerCase() === 'approved');
            const rejectedRequests = allTeamRequests.filter(req => req.status?.toLowerCase() === 'rejected');
            
            console.log('📊 Calculated stats:', {
              total: allTeamRequests.length,
              pending: pendingRequests.length,
              approved: approvedRequests.length,
              rejected: rejectedRequests.length
            });
            
            const stats = {
              totalRequests: allTeamRequests.length,
              pendingRequests: pendingRequests.length,
              approvedRequests: approvedRequests.length,
              rejectedRequests: rejectedRequests.length,
              myLeaveBalance: 0, // Not applicable for managers viewing team data
              myUsedLeaves: 0 // Not applicable for managers viewing team data
            };
            
            console.log('📊 Setting stats:', stats);
            setLeaveStats(stats);
            console.log('✅ Manager data fetch completed successfully');
          } else {
            setLeaveRequests([]);
            setLeaveStats({
              totalRequests: 0,
              pendingRequests: 0,
              approvedRequests: 0,
              rejectedRequests: 0,
              myLeaveBalance: 0,
              myUsedLeaves: 0
            });
          }
          
        } catch (managerError) {
          console.error('🚨 Error fetching manager team data:', managerError);
          console.error('🚨 Manager error response:', managerError.response?.data);
          console.error('🚨 Manager error status:', managerError.response?.status);
          console.error('🚨 Manager error message:', managerError.message);
          
          // Check if it's a 401 Unauthorized error
          if (managerError.response?.status === 401) {
            console.error('🚨 Unauthorized - possibly invalid token or expired session');
          }
          
          // Check if it's a 404 Not Found error
          if (managerError.response?.status === 404) {
            console.error('🚨 Endpoint not found - check if API is running and endpoint exists');
          }
          
          // Check if it's a 500 Internal Server Error
          if (managerError.response?.status === 500) {
            console.error('🚨 Server error - check backend logs for database/service issues');
          }
          
          // Fallback to empty state with error logging
          setLeaveRequests([]);
          setLeaveStats({
            totalRequests: 0,
            pendingRequests: 0,
            approvedRequests: 0,
            rejectedRequests: 0,
            myLeaveBalance: 0,
            myUsedLeaves: 0
          });
        }
      } else if (canAccess(['ADMIN', 'HR'])) {
        // Admin/HR sees all leave requests
        const endpoint = '/payflowapi/leave-requests/all';
        
        const response = await axios.get(endpoint, { headers });
        const requests = response.data.data || response.data || [];
        setLeaveRequests(requests);
        
        // Calculate statistics for admin/HR role
        const stats = {
          totalRequests: requests.length,
          pendingRequests: requests.filter(req => req.status?.toLowerCase() === 'pending').length,
          approvedRequests: requests.filter(req => req.status?.toLowerCase() === 'approved').length,
          rejectedRequests: requests.filter(req => req.status?.toLowerCase() === 'rejected').length,
          myLeaveBalance: 0, // Not applicable for admin/HR
          myUsedLeaves: 0 // Not applicable for admin/HR
        };
        
        setLeaveStats(stats);
      }
    } catch (error) {
      console.error('Error fetching leave data:', error);
      console.error('Error details:', error.response?.data);
      setLeaveRequests([]);
      setLeaveBalance({ total: 12, remaining: 12, used: 0 });
      setLeaveStats({
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        myLeaveBalance: 12,
        myUsedLeaves: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Debug function to manually test API endpoints
  const debugManagerAPI = async () => {
    console.log('🐛 Manual debug test for manager API');
    
    try {
      const token = sessionStorage.getItem('jwtToken');
      console.log('🔑 Token:', token ? 'EXISTS' : 'MISSING');
      
      if (!token) {
        console.log('❌ No token found');
        return;
      }
      
      const headers = { Authorization: `Bearer ${token}` };
      const payload = parseJwt(token);
      
      console.log('👤 JWT Payload:', payload);
      console.log('📧 Username (sub):', payload.sub);
      console.log('📧 Username (username):', payload.username);
      console.log('🆔 Employee ID:', payload.employeeId);
      console.log('🎭 Role:', role);
      
      const managerUsername = payload.username || payload.sub;
      console.log('🎯 Using manager username:', managerUsername);
      
      // Test the manager team endpoint
      const teamEndpoint = 'http://localhost:8080/payflowapi/leave-requests/manager/team';
      console.log('📞 Testing endpoint:', teamEndpoint);
      
      const response = await axios.get(teamEndpoint, { headers });
      console.log('✅ Raw API Response:', response);
      console.log('📊 Response data:', response.data);
      console.log('📋 Team requests:', response.data.data);
      
      if (response.data.success) {
        console.log('🎉 API call successful!');
        console.log('📊 Number of requests:', response.data.data?.length || 0);
        
        if (response.data.data?.length === 0) {
          console.log('⚠️ No leave requests found for this manager');
          console.log('🔍 This could mean:');
          console.log('   1. No employees are assigned to this manager');
          console.log('   2. Assigned employees have not submitted any leave requests');
          console.log('   3. Manager username in JWT does not match employee.manager field');
        }
      } else {
        console.log('⚠️ API returned success: false');
      }
      
      // Test additional endpoints for debugging
      try {
        console.log('🔍 Testing additional debug endpoints...');
        
        // Try to get all employees to see the data structure
        const allEmployeesResponse = await axios.get('http://localhost:8080/payflowapi/employees', { headers });
        console.log('👥 All employees response:', allEmployeesResponse.data);
        
        if (allEmployeesResponse.data && Array.isArray(allEmployeesResponse.data)) {
          const employeesWithManagers = allEmployeesResponse.data.filter(emp => emp.manager);
          console.log('👨‍💼 Employees with managers:', employeesWithManagers);
          
          // Test both possible username fields
          const myTeamMembers1 = allEmployeesResponse.data.filter(emp => emp.manager === payload.username);
          const myTeamMembers2 = allEmployeesResponse.data.filter(emp => emp.manager === payload.sub);
          
          console.log('👥 My team members (using payload.username):', myTeamMembers1);
          console.log('👥 My team members (using payload.sub):', myTeamMembers2);
          
          if (myTeamMembers1.length === 0 && myTeamMembers2.length === 0) {
            console.log('⚠️ No team members found for either username field');
            console.log('🔍 Available manager values in database:');
            const uniqueManagers = [...new Set(employeesWithManagers.map(emp => emp.manager))];
            console.log('   Managers in DB:', uniqueManagers);
          }
        }
        
      } catch (debugError) {
        console.log('🔍 Debug endpoints failed:', debugError.message);
      }
      
    } catch (error) {
      console.error('🚨 Debug API call failed:', error);
      console.error('🚨 Error response:', error.response?.data);
      console.error('🚨 Error status:', error.response?.status);
      console.error('🚨 Error message:', error.message);
    }
  };

  // Handle leave request cancellation - following existing pattern
  const handleCancelLeave = async (requestId) => {
    try {
      // Use sessionStorage directly like existing code
      const token = sessionStorage.getItem('jwtToken');
      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // Parse JWT to get employeeId like existing code
      const payload = parseJwt(token);
      const employeeId = payload.employeeId;
      
      if (!employeeId) {
        window.alert('Employee ID not found. Please login again.');
        return;
      }
      
      const endpoint = `/payflowapi/leave-requests/${requestId}/cancel?employeeId=${employeeId}`;
      
      await axios.put(endpoint, {}, { headers });
      
      // Show success message
      window.alert('Leave request cancelled successfully!');
      
      // Refresh data after action
      fetchLeaveData();
    } catch (error) {
      console.error('Error cancelling leave request:', error);
      window.alert(`Failed to cancel leave request: ${error.response?.data?.message || error.message}`);
    }
  };

  // Handle leave request deletion - following existing pattern
  const handleDeleteLeave = async (requestId) => {
    try {
      // Use sessionStorage directly like existing code
      const token = sessionStorage.getItem('jwtToken');
      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const endpoint = `/payflowapi/leave-requests/${requestId}`;
      
      await axios.delete(endpoint, { headers });
      
      // Show success message
      window.alert('Leave request deleted successfully!');
      
      // Refresh data after action
      fetchLeaveData();
    } catch (error) {
      console.error('Error deleting leave request:', error);
      window.alert(`Failed to delete leave request: ${error.response?.data?.message || error.message}`);
    }
  };

  // Handle leave request approval/rejection - following existing pattern
  const handleLeaveAction = async (requestId, action, comments = '') => {
    try {
      // Use sessionStorage directly like existing code
      const token = sessionStorage.getItem('jwtToken');
      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const endpoint = action === 'approve' 
        ? `/payflowapi/leave-requests/${requestId}/approve`
        : `/payflowapi/leave-requests/${requestId}/reject`;
      
      await axios.put(endpoint, { remarks: comments }, { headers });
      
      // Show success message like existing code
      window.alert(`Leave request ${action}d successfully! Email notification sent to employee.`);
      
      // Refresh data after action
      fetchLeaveData();
    } catch (error) {
      console.error(`Error ${action}ing leave request:`, error);
      window.alert(`Failed to ${action} leave request: ${error.response?.data?.error || error.message}`);
    }
  };

  // Validation function following existing business logic
  const validateForm = () => {
    if (!leaveForm.startDate) {
      setFormError('Please select start date');
      return false;
    }
    if (!leaveForm.endDate) {
      setFormError('Please select end date');
      return false;
    }
    if (new Date(leaveForm.startDate) > new Date(leaveForm.endDate)) {
      setFormError('End date cannot be before start date');
      return false;
    }
    if (!leaveForm.reason.trim()) {
      setFormError('Please provide a reason for leave');
      return false;
    }
    if (totalDays > leaveBalance.remaining) {
      setFormError(`Insufficient leave balance. You have ${leaveBalance.remaining} days remaining.`);
      return false;
    }
    if (totalDays <= 0) {
      setFormError('Invalid date range');
      return false;
    }
    return true;
  };

  // Handle leave application submission - following existing business logic
  const handleLeaveSubmission = async (e) => {
    e.preventDefault();
    
    // Guard clause - don't submit if user is not loaded
    if (!user) {
      setFormError('User information not loaded. Please refresh the page.');
      return;
    }
    
    if (!validateForm()) return;
    
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');
    
    try {
      // Use sessionStorage directly like existing code
      const token = sessionStorage.getItem('jwtToken');
      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // Parse JWT to get employeeId like existing code
      const payload = parseJwt(token);
      const employeeId = payload.employeeId;
      
      // Use fetched employee details if available, otherwise fall back to JWT/user data
      const employeeName = employeeDetails?.fullName || payload.fullName || payload.sub || payload.username || 'Employee';
      const employeeEmail = employeeDetails?.email || payload.email || payload.sub || user.email || '';
      
      if (!employeeId) {
        setFormError('Employee ID not found. Please login again.');
        return;
      }
      
      console.log('📝 Submitting with employee data:', {
        employeeId,
        employeeName,
        employeeEmail,
        fromFetchedDetails: !!employeeDetails,
        fetchedDetails: employeeDetails
      });
      
      // Following exact existing leave request structure
      const leaveRequest = {
        employeeId: employeeId,
        employeeName: employeeName,
        employeeEmail: employeeEmail,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        totalDays: totalDays,
        reason: leaveForm.reason,
        leaveYear: new Date().getFullYear()
      };
      
      const response = await axios.post('/payflowapi/leave-requests/apply', leaveRequest, { headers });
      
      if (response.data.success) {
        setFormSuccess('Leave request submitted successfully!');
        setLeaveForm({ startDate: '', endDate: '', reason: '' });
        setTotalDays(0);
        
        // Refresh leave data to show updated stats
        fetchLeaveData();
      } else {
        setFormError(response.data.message || 'Failed to submit leave request');
      }
      setTotalDays(0);
      
      // Update leave balance immediately (optimistic update)
      setLeaveBalance(prev => ({
        ...prev,
        remaining: prev.remaining - totalDays,
        used: prev.used + totalDays
      }));
      
      // Update stats immediately (optimistic update)
      setLeaveStats(prev => ({
        ...prev,
        totalRequests: prev.totalRequests + 1,
        pendingRequests: prev.pendingRequests + 1,
        myUsedLeaves: prev.myUsedLeaves + totalDays,
        myLeaveBalance: prev.myLeaveBalance - totalDays
      }));
      
      // Refresh leave data after a short delay to ensure backend has processed
      setTimeout(() => {
        fetchLeaveData();
      }, 1000);
    } catch (error) {
      console.error('Error submitting leave request:', error);
      
      let errorMessage = 'Failed to submit leave request';
      
      if (error.response) {
        console.error('Server Error Status:', error.response.status);
        console.error('Server Error Data:', error.response.data);
        
        if (error.response.data) {
          errorMessage = error.response.data.message || 
                        error.response.data.error || 
                        `Server error: ${error.response.status}`;
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check if the backend is running.';
      } else {
        errorMessage = error.message || 'Request setup error';
      }
      
      setFormError(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  // Get available tabs based on user permissions
  const getAvailableTabs = () => {
    const tabs = [];
    
    // Overview tab - available to all
    tabs.push({ id: 'overview', label: 'Overview', icon: '📊' });
    
    // My leave requests - Employee
    if (role === 'EMPLOYEE') {
      tabs.push({ id: 'my-leaves', label: 'My Leave Requests', icon: '📋' });
      tabs.push({ id: 'apply', label: 'Apply Leave', icon: '📝' });
    }
    
    // Team leave requests - Manager
    if (role === 'MANAGER') {
      tabs.push({ id: 'team-leaves', label: 'Team Requests', icon: '👥' });
    }
    
    // All leave requests - Admin/HR
    if (canAccess(['ADMIN', 'HR'])) {
      tabs.push({ id: 'all-leaves', label: 'All Requests', icon: '📄' });
    }
    
    // Leave approvals - Manager, Admin, HR
    if (canAccess(['ADMIN', 'HR', 'MANAGER'], ['APPROVE_LEAVES', 'APPROVE_TEAM_LEAVES'])) {
      tabs.push({ id: 'approvals', label: 'Pending Approvals', icon: '✅' });
    }
    
    return tabs;
  };

  // Render overview
  const renderOverview = () => {
    return (
      <div className="leave-overview">
        <div className="overview-header">
          <h3>Leave Management Overview</h3>
          <p>Complete leave tracking and management</p>
        </div>
        
        <div className="overview-stats">
          <PermissionWrapper requiredRoles={['EMPLOYEE']}>
            <div className="employee-leave-stats">
              <div className="stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <h4>{leaveBalance.remaining}</h4>
                  <p>Leave Balance</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <h4>{leaveBalance.used}</h4>
                  <p>Used Leaves</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">🔄</div>
                <div className="stat-content">
                  <h4>{leaveStats.pendingRequests}</h4>
                  <p>Pending Requests</p>
                </div>
              </div>
            </div>
          </PermissionWrapper>
          
          <PermissionWrapper requiredRoles={['ADMIN', 'HR', 'MANAGER']}>
            <div className="manager-leave-stats">
              <div className="stat-card">
                <div className="stat-icon">�</div>
                <div className="stat-content">
                  <h4>{leaveStats.totalRequests}</h4>
                  <p>Total Requests</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">⏰</div>
                <div className="stat-content">
                  <h4>{leaveStats.pendingRequests}</h4>
                  <p>Pending Approval</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <h4>{leaveStats.approvedRequests}</h4>
                  <p>Approved</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">❌</div>
                <div className="stat-content">
                  <h4>{leaveStats.rejectedRequests}</h4>
                  <p>Rejected</p>
                </div>
              </div>
            </div>
          </PermissionWrapper>
        </div>
        
        <div className="quick-actions">
          <h4>Quick Actions</h4>
          <div className="action-buttons">
            <PermissionWrapper requiredRoles={['EMPLOYEE']}>
              <button 
                className="btn btn-primary"
                onClick={() => setActiveTab('apply')}
              >
                📝 Apply for Leave
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setActiveTab('my-leaves')}
              >
                📋 View My Requests
              </button>
            </PermissionWrapper>
            
            <PermissionWrapper requiredRoles={['ADMIN', 'HR', 'MANAGER']}>
              <button 
                className="btn btn-primary"
                onClick={() => setActiveTab('approvals')}
              >
                ✅ Pending Approvals ({leaveStats.pendingRequests})
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setActiveTab(role === 'MANAGER' ? 'team-leaves' : 'all-leaves')}
              >
                📄 View All Requests
              </button>
            </PermissionWrapper>
            
            <button 
              className="btn btn-ghost"
              onClick={fetchLeaveData}
              disabled={loading}
            >
              🔄 Refresh Data
            </button>
            
          </div>
        </div>
      </div>
    );
  };

  // Render leave request list with optional filtering
  const renderLeaveList = (title, subtitle, showActions = false, filterStatus = null) => {
    // Filter requests based on status if specified
    const filteredRequests = filterStatus 
      ? leaveRequests.filter(request => request.status?.toLowerCase() === filterStatus.toLowerCase())
      : leaveRequests;
    
    return (
      <div className="leave-list">
        <div className="list-header">
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        
        {loading ? (
          <div className="loading-state">Loading leave requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="empty-state">
            <h4>No leave requests found</h4>
            <p>
              {filterStatus === 'pending' 
                ? 'No pending leave requests requiring approval' 
                : 'No leave requests match the current criteria'
              }
            </p>
          </div>
        ) : (
          <div className="leave-requests-grid">
            {filteredRequests.map(request => (
              <div key={request.id} className="leave-request-card">
                <div className="leave-card-header">
                  <div className="leave-id">Leave ID: #{request.id}</div>
                  <span className={`status-badge ${getStatusBadgeClass(request.status)}`}>
                    {request.status}
                  </span>
                </div>

                <div className="leave-card-body">
                  {/* Show employee name for managers/admins */}
                  {(role === 'MANAGER' || role === 'ADMIN' || role === 'HR') && request.employeeName && (
                    <div className="leave-detail-row">
                      <span className="detail-label">Employee:</span>
                      <span className="detail-value">{request.employeeName}</span>
                    </div>
                  )}

                  <div className="leave-detail-row">
                    <span className="detail-label">Applied Date:</span>
                    <span className="detail-value">{formatDate(request.createdAt)}</span>
                  </div>

                  <div className="leave-detail-row">
                    <span className="detail-label">Leave Period:</span>
                    <span className="detail-value">
                      {formatDate(request.startDate)} - {formatDate(request.endDate)}
                    </span>
                  </div>

                  <div className="leave-detail-row">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">{request.totalDays} days</span>
                  </div>

                  <div className="leave-detail-row">
                    <span className="detail-label">Reason:</span>
                    <span className="detail-value">
                      {request.reason || 'No reason provided'}
                    </span>
                  </div>

                  {request.approvedBy && (
                    <div className="leave-detail-row">
                      <span className="detail-label">Approved By:</span>
                      <span className="detail-value">{request.approvedBy}</span>
                    </div>
                  )}

                  {request.rejectedBy && (
                    <div className="leave-detail-row">
                      <span className="detail-label">Rejected By:</span>
                      <span className="detail-value">{request.rejectedBy}</span>
                    </div>
                  )}

                  {request.comments && (
                    <div className="leave-detail-row">
                      <span className="detail-label">Comments:</span>
                      <span className="detail-value">{request.comments}</span>
                    </div>
                  )}
                </div>
                
                {showActions && request.status?.toLowerCase() === 'pending' && (
                  <div className="request-actions">
                    <div className="action-buttons-row">
                      <button 
                        className="btn btn-sm btn-success"
                        onClick={() => {
                          const comments = window.prompt('Enter approval comments (optional):');
                          handleLeaveAction(request.id, 'approve', comments || '');
                        }}
                      >
                        ✅ Approve
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => {
                          const comments = window.prompt('Enter rejection reason:');
                          if (comments) {
                            handleLeaveAction(request.id, 'reject', comments);
                          } else {
                            window.alert('Rejection reason is required');
                          }
                        }}
                      >
                        ❌ Reject
                      </button>
                    </div>
                    <div className="action-note">
                      <small>💡 Tip: Employee will be notified via email</small>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render My Leave Requests with filtering
  const renderMyLeaveRequests = () => {
    // Filter requests based on selected filter
    const getFilteredRequests = () => {
      if (selectedFilter === 'all') {
        return leaveRequests;
      }
      return leaveRequests.filter(request => 
        request.status?.toLowerCase() === selectedFilter.toLowerCase()
      );
    };

    const filteredRequests = getFilteredRequests();

    // Calculate counts for each status
    const statusCounts = {
      all: leaveRequests.length,
      pending: leaveRequests.filter(req => req.status?.toLowerCase() === 'pending').length,
      approved: leaveRequests.filter(req => req.status?.toLowerCase() === 'approved').length,
      rejected: leaveRequests.filter(req => req.status?.toLowerCase() === 'rejected').length,
      cancelled: leaveRequests.filter(req => req.status?.toLowerCase() === 'cancelled').length
    };

    return (
      <div className="leave-list">
        <div className="list-header">
          <h3>My Leave Requests</h3>
          <p>View all your leave requests and their status</p>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${selectedFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('all')}
          >
            All ({statusCounts.all})
          </button>
          <button 
            className={`filter-tab ${selectedFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('pending')}
          >
            Pending ({statusCounts.pending})
          </button>
          <button 
            className={`filter-tab ${selectedFilter === 'approved' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('approved')}
          >
            Approved ({statusCounts.approved})
          </button>
          <button 
            className={`filter-tab ${selectedFilter === 'rejected' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('rejected')}
          >
            Rejected ({statusCounts.rejected})
          </button>
          <button 
            className={`filter-tab ${selectedFilter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('cancelled')}
          >
            Cancelled ({statusCounts.cancelled})
          </button>
        </div>
        
        {loading ? (
          <div className="loading-state">Loading leave requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="empty-state">
            <h4>No {selectedFilter === 'all' ? '' : selectedFilter} leave requests found</h4>
            <p>
              {selectedFilter === 'all' 
                ? 'You haven\'t submitted any leave requests yet' 
                : `You don't have any ${selectedFilter} leave requests`
              }
            </p>
            {selectedFilter === 'all' && (
              <button 
                className="btn btn-primary"
                onClick={() => setActiveTab('apply')}
              >
                📝 Apply for Leave
              </button>
            )}
          </div>
        ) : (
          <div className="leave-requests-grid">
            {filteredRequests.map(request => (
              <div key={request.id} className="leave-request-card">
                <div className="leave-card-header">
                  <div className="leave-id">Leave ID: #{request.id}</div>
                  <span className={`status-badge ${getStatusBadgeClass(request.status)}`}>
                    {request.status}
                  </span>
                </div>

                <div className="leave-card-body">
                  <div className="leave-detail-row">
                    <span className="detail-label">Applied Date:</span>
                    <span className="detail-value">{formatDate(request.createdAt)}</span>
                  </div>

                  <div className="leave-detail-row">
                    <span className="detail-label">Leave Period:</span>
                    <span className="detail-value">
                      {formatDate(request.startDate)} - {formatDate(request.endDate)}
                    </span>
                  </div>

                  <div className="leave-detail-row">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">{request.totalDays} days</span>
                  </div>

                  <div className="leave-detail-row">
                    <span className="detail-label">Reason:</span>
                    <span className="detail-value">
                      {request.reason || 'No reason provided'}
                    </span>
                  </div>

                  {request.approvedBy && (
                    <div className="leave-detail-row">
                      <span className="detail-label">Approved By:</span>
                      <span className="detail-value">{request.approvedBy}</span>
                    </div>
                  )}

                  {request.rejectedBy && (
                    <div className="leave-detail-row">
                      <span className="detail-label">Rejected By:</span>
                      <span className="detail-value">{request.rejectedBy}</span>
                    </div>
                  )}

                  {request.comments && (
                    <div className="leave-detail-row">
                      <span className="detail-label">Comments:</span>
                      <span className="detail-value">{request.comments}</span>
                    </div>
                  )}
                </div>
                
                {/* Show cancel/delete options for pending requests */}
                {request.status?.toLowerCase() === 'pending' && (
                  <div className="request-actions">
                    <div className="action-buttons-row">
                      <button 
                        className="btn btn-sm btn-warning"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to cancel this leave request? This will change the status to CANCELLED but keep the record.')) {
                            handleCancelLeave(request.id);
                          }
                        }}
                      >
                        🚫 Cancel Request
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this leave request? This will permanently remove the request and cannot be undone.')) {
                            handleDeleteLeave(request.id);
                          }
                        }}
                      >
                        �️ Delete Request
                      </button>
                    </div>
                    <div className="action-note">
                      <small>💡 Cancel: Marks as cancelled | Delete: Permanently removes</small>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render leave application form
  const renderLeaveApplication = () => {
    return (
      <div className="leave-application">
        <div className="application-header">
          <h3>Apply for Leave</h3>
          <p>Submit a new leave request</p>
        </div>
        
        <form onSubmit={handleLeaveSubmission} className="leave-form">
          {formError && (
            <div className="alert alert-error">
              {formError}
            </div>
          )}
          
          {formSuccess && (
            <div className="alert alert-success">
              {formSuccess}
            </div>
          )}

          {/* Leave Balance Info */}
          <PermissionWrapper requiredRoles={['EMPLOYEE']}>
            <div className="leave-balance-info">
              <div className="balance-card">
                <h4>Leave Balance</h4>
                <div className="balance-details">
                  <span>Total: {leaveBalance.total}</span>
                  <span>Used: {leaveBalance.used}</span>
                  <span>Remaining: <strong>{leaveBalance.remaining}</strong></span>
                </div>
              </div>
            </div>
            
            {/* Employee Details Info */}
            {employeeDetails && (
              <div className="employee-info-card">
                <h4>Employee Information</h4>
                <div className="employee-details">
                  <div className="detail-row">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{employeeDetails.fullName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{employeeDetails.email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Employee ID:</span>
                    <span className="detail-value">{employeeDetails.id}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status:</span>
                    <span className={`status-badge ${employeeDetails.status?.toLowerCase()}`}>
                      {employeeDetails.status}
                    </span>
                  </div>
                  {employeeDetails.manager && (
                    <div className="detail-row">
                      <span className="detail-label">Manager:</span>
                      <span className="detail-value">{employeeDetails.manager}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </PermissionWrapper>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Start Date *</label>
              <input
                type="date"
                id="startDate"
                value={leaveForm.startDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                required
                className="form-control"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="endDate">End Date *</label>
              <input
                type="date"
                id="endDate"
                value={leaveForm.endDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                required
                className="form-control"
                min={leaveForm.startDate || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {totalDays > 0 && (
            <div className="total-days-info">
              <strong>Total Days: {totalDays}</strong>
              {totalDays > leaveBalance.remaining && (
                <span className="insufficient-balance">
                  ⚠️ Insufficient leave balance
                </span>
              )}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="reason">Reason for Leave *</label>
            <textarea
              id="reason"
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              required
              className="form-control"
              rows="4"
              placeholder="Please provide the reason for your leave request"
            />
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setLeaveForm({ startDate: '', endDate: '', reason: '' });
                setFormError('');
                setFormSuccess('');
              }}
            >
              🔄 Reset Form
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={formLoading || totalDays > leaveBalance.remaining}
            >
              {formLoading ? '⏳ Submitting...' : '📝 Submit Leave Request'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'my-leaves':
        return renderMyLeaveRequests();
      case 'team-leaves':
        return renderLeaveList('Team Leave Requests', 'Manage your team\'s leave requests', true);
      case 'all-leaves':
        return renderLeaveList('All Leave Requests', 'View all leave requests across the organization');
      case 'approvals':
        return renderLeaveList('Pending Approvals', 'Leave requests awaiting your approval', true, 'pending');
      case 'apply':
        return renderLeaveApplication();
      default:
        return renderOverview();
    }
  };

  // Double check - ensure user is still loaded before rendering main content
  if (!user || !role) {
    return (
      <div className="unified-layout">
        <div className="unified-content">
          <div className="loading-state">
            <h3>Loading user information...</h3>
            <p>Please wait while we load your profile and permissions.</p>
          </div>
        </div>
      </div>
    );
  }

  const availableTabs = getAvailableTabs();

  return (
    <Layout
      title="Leave Management"
      subtitle="Comprehensive leave tracking and approval system"
      sidebarActive="leaves"
      requiredRoles={['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']}
    >
      <div className="unified-leave-management">
        {/* Tab Navigation */}
        <div className="tab-navigation">
          {availableTabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {renderTabContent()}
        </div>
      </div>
    </Layout>
  );
}

export default UnifiedLeaveManagement;
