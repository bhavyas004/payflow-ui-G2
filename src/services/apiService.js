// src/services/apiService.js
import axios from 'axios';

const API_BASE = 'http://localhost:8080/payflowapi';

// Get authentication headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('jwtToken');
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  };
};

// Statistics API calls
export const statisticsAPI = {
  // User statistics for Admin Dashboard
  getTotalUsers: () => axios.get(`${API_BASE}/stats/users/total`, getAuthHeaders()),
  getTotalHRs: () => axios.get(`${API_BASE}/stats/users/hr`, getAuthHeaders()),
  getTotalManagers: () => axios.get(`${API_BASE}/stats/users/managers`, getAuthHeaders()),
  
  // Employee statistics for HR/Manager Dashboards
  getTotalEmployees: () => axios.get(`${API_BASE}/stats/employees/total`, getAuthHeaders()),
  getActiveEmployees: () => axios.get(`${API_BASE}/stats/employees/active`, getAuthHeaders()),
  getInactiveEmployees: () => axios.get(`${API_BASE}/stats/employees/inactive`, getAuthHeaders()),

  // Combined dashboard statistics
  getAllStats: async () => {
    try {
      const [totalUsers, totalHRs, totalManagers, totalEmployees, activeEmployees, inactiveEmployees] = await Promise.all([
        statisticsAPI.getTotalUsers(),
        statisticsAPI.getTotalHRs(),
        statisticsAPI.getTotalManagers(),
        statisticsAPI.getTotalEmployees(),
        statisticsAPI.getActiveEmployees(),
        statisticsAPI.getInactiveEmployees()
      ]);

      return {
        users: {
          total: totalUsers.data.totalUsers || 0,
          hrs: totalHRs.data.totalHRs || 0,
          managers: totalManagers.data.totalManagers || 0
        },
        employees: {
          total: totalEmployees.data.totalEmployees || 0,
          active: activeEmployees.data.totalActiveEmployees || 0,
          inactive: inactiveEmployees.data.totalInactiveEmployees || 0
        }
      };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return {
        users: { total: 0, hrs: 0, managers: 0 },
        employees: { total: 0, active: 0, inactive: 0 }
      };
    }
  },

  // Specific functions for role-based access
  getAdminStats: async () => {
    try {
      const [totalUsers, totalHRs, totalManagers] = await Promise.all([
        statisticsAPI.getTotalUsers(),
        statisticsAPI.getTotalHRs(),
        statisticsAPI.getTotalManagers()
      ]);

      return {
        totalUsers: totalUsers.data.totalUsers || 0,
        totalHRs: totalHRs.data.totalHRs || 0,
        totalManagers: totalManagers.data.totalManagers || 0
      };
    } catch (error) {
      console.error('Error fetching admin statistics:', error);
      return { totalUsers: 0, totalHRs: 0, totalManagers: 0 };
    }
  },

  getEmployeeStats: async () => {
    try {
      const [totalEmployees, activeEmployees, inactiveEmployees] = await Promise.all([
        statisticsAPI.getTotalEmployees(),
        statisticsAPI.getActiveEmployees(),
        statisticsAPI.getInactiveEmployees()
      ]);

      return {
        totalEmployees: totalEmployees.data.totalEmployees || 0,
        activeEmployees: activeEmployees.data.totalActiveEmployees || 0,
        inactiveEmployees: inactiveEmployees.data.totalInactiveEmployees || 0
      };
    } catch (error) {
      console.error('Error fetching employee statistics:', error);
      return { totalEmployees: 0, activeEmployees: 0, inactiveEmployees: 0 };
    }
  }
};

// Employee API calls
export const employeeAPI = {
  getAllEmployees: () => axios.get(`${API_BASE}/onboard-employee/employees`, getAuthHeaders()),
  createEmployee: (employeeData) => axios.post(`${API_BASE}/onboard-employee/add`, employeeData, getAuthHeaders())
};

// User API calls
export const userAPI = {
  createUser: (userData) => axios.post(`${API_BASE}/user/admin/create`, userData, getAuthHeaders()),
  getAllUsers: () => axios.get(`${API_BASE}/user/all`, getAuthHeaders())
};

export default {
  statisticsAPI,
  employeeAPI,
  userAPI
};

// Utility functions
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
