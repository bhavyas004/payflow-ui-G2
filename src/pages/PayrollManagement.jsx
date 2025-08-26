import React, { useState, useEffect } from 'react';
import { useAuth } from '../shared/hooks/useAuth';
import Layout from '../shared/components/Layout';
import PermissionWrapper from '../shared/components/PermissionWrapper';
import axios from 'axios';
import '../shared/styles/unified.css';

/**
 * Unified Payroll Management Component
 * Role-based payroll interface with permission-controlled features
 */
function PayrollManagement() {
  const { user, role, getToken, checkRole, checkPermission } = useAuth();
  
  // Helper function to check if user can access certain roles or permissions
  const canAccess = (roles, permissions = []) => {
    const hasRole = checkRole(roles);
    const hasPermission = permissions.length === 0 || permissions.some(permission => checkPermission(permission));
    return hasRole && hasPermission;
  };
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  
  // CTC Management search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  
  // CTC Edit Modal state
  const [showCTCModal, setShowCTCModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [ctcFormData, setCTCFormData] = useState({
    basicSalary: '',
    allowances: '', // Special allowances (transport, medical, etc.)
    bonuses: '', // Variable pay/bonus (performance-based)
    effectiveFrom: new Date().toISOString().split('T')[0],
    isMetroCity: true // Toggle for HRA calculation (50% metro vs 40% non-metro)
  });
  
  const [calculatedComponents, setCalculatedComponents] = useState({
    hra: 0,
    pfContribution: 0,
    gratuity: 0,
    totalCTC: 0
  });
  
  const [calculating, setCalculating] = useState(false);

  // Payslip Generation state
  const [allEmployees, setAllEmployees] = useState([]);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('AUGUST');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [generationType, setGenerationType] = useState('all'); // 'all' or 'selected'
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [generatingPayslips, setGeneratingPayslips] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Payslip Search Filters state
  const [filterMonth, setFilterMonth] = useState('ALL');
  const [filterYear, setFilterYear] = useState('ALL');
  const [filteredPayslips, setFilteredPayslips] = useState([]);

  // Real-time CTC calculation
  useEffect(() => {
    // Debounce calculation to avoid too many API calls
    const timeoutId = setTimeout(() => {
      calculateCTCPreview();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [ctcFormData.basicSalary, ctcFormData.allowances, ctcFormData.bonuses, ctcFormData.isMetroCity]);

  const calculateCTCPreview = async () => {
    const basicSalary = parseFloat(ctcFormData.basicSalary) || 0;
    
    if (basicSalary <= 0) {
      setCalculatedComponents({
        hra: 0,
        pfContribution: 0,
        gratuity: 0,
        totalCTC: 0
      });
      return;
    }

    try {
      setCalculating(true);
      const token = getToken();
      
      const response = await axios.post('http://localhost:8080/payflowapi/payroll/ctc/preview', {
        basicSalary: basicSalary,
        allowances: parseFloat(ctcFormData.allowances) || 0,
        bonuses: parseFloat(ctcFormData.bonuses) || 0,
        isMetroCity: ctcFormData.isMetroCity
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const data = response.data.data;
        setCalculatedComponents({
          hra: data.hra,
          pfContribution: data.pfContribution,
          gratuity: data.gratuity,
          totalCTC: data.totalCTC
        });
      }
    } catch (error) {
      console.error('Error calculating CTC preview:', error);
      // Fall back to frontend calculation if backend fails
      const basicSalary = parseFloat(ctcFormData.basicSalary) || 0;
      const allowances = parseFloat(ctcFormData.allowances) || 0;
      const bonuses = parseFloat(ctcFormData.bonuses) || 0;
      
      const hra = basicSalary * (ctcFormData.isMetroCity ? 0.50 : 0.40);
      const pfContribution = basicSalary * 0.12;
      const gratuity = basicSalary * 0.0481;
      const totalCTC = basicSalary + hra + allowances + bonuses + pfContribution + gratuity;
      
      setCalculatedComponents({
        hra: Math.round(hra),
        pfContribution: Math.round(pfContribution),
        gratuity: Math.round(gratuity),
        totalCTC: Math.round(totalCTC)
      });
    } finally {
      setCalculating(false);
    }
  };
  
  const [payrollData, setPayrollData] = useState({
    statistics: {
      totalPayslips: 0,
      totalEmployees: 0,
      totalPayrollAmount: 0,
      currentMonth: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
    },
    payslips: [],
    employees: []
  });

  useEffect(() => {
    // Debug information
    console.log('PayrollManagement mounted');
    console.log('User:', user);
    console.log('Role:', role);
    console.log('Token from sessionStorage:', sessionStorage.getItem('jwtToken'));
    
    fetchPayrollData();
    fetchAllEmployees(); // Fetch employees for payslip generation
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize filtered employees when payroll data changes
  useEffect(() => {
    setFilteredEmployees(payrollData.employees);
  }, [payrollData.employees]);

  // Filter employees based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredEmployees(payrollData.employees);
    } else {
      const filtered = payrollData.employees.filter(employee => 
        employee.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.id?.toString().includes(searchTerm) ||
        employee.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
  }, [searchTerm, payrollData.employees]);

  // Fetch employees when Generate Payslips tab is active
  useEffect(() => {
    if (activeTab === 'generate' && allEmployees.length === 0) {
      console.log('Generate Payslips tab activated, fetching employees...');
      fetchAllEmployees();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter payslips based on month and year filters
  useEffect(() => {
    let filtered = [...payrollData.payslips];
    
    // Filter by month if not 'ALL'
    if (filterMonth !== 'ALL') {
      filtered = filtered.filter(payslip => 
        payslip.month?.toUpperCase() === filterMonth.toUpperCase()
      );
    }
    
    // Filter by year if not 'ALL'
    if (filterYear !== 'ALL') {
      filtered = filtered.filter(payslip => 
        payslip.year?.toString() === filterYear.toString()
      );
    }
    
    setFilteredPayslips(filtered);
  }, [payrollData.payslips, filterMonth, filterYear]);

  // Clear selected employees when month/year changes to avoid ineligible selections
  useEffect(() => {
    if (selectedEmployeeIds.length > 0) {
      // Filter out any employees that are no longer eligible for the new month/year
      const stillEligibleIds = selectedEmployeeIds.filter(id => {
        const employee = allEmployees.find(emp => emp.id === id);
        return employee && isEmployeeEligibleForMonth(employee);
      });
      
      if (stillEligibleIds.length !== selectedEmployeeIds.length) {
        console.log('Removing ineligible employees due to month/year change');
        setSelectedEmployeeIds(stillEligibleIds);
      }
    }
  }, [selectedMonth, selectedYear, allEmployees]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle search functionality
  const handleSearch = () => {
    // Search functionality is already handled by useEffect above
    // This function can be used for additional search actions if needed
    console.log('Searching for:', searchTerm);
  };

  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleEditCTC = (employee) => {
    console.log('Edit CTC for employee:', employee);
    setSelectedEmployee(employee);
    
    // Pre-populate form with existing CTC data if available
    if (employee.ctcDetails) {
      setCTCFormData({
        basicSalary: employee.ctcDetails.basicSalary || '',
        allowances: employee.ctcDetails.allowances || '',
        bonuses: employee.ctcDetails.bonuses || '',
        effectiveFrom: employee.ctcDetails.effectiveFrom || new Date().toISOString().split('T')[0],
        isMetroCity: true // Default to metro city, could be stored in employee data
      });
    } else {
      // Reset form for new CTC entry
      setCTCFormData({
        basicSalary: '',
        allowances: '',
        bonuses: '',
        effectiveFrom: new Date().toISOString().split('T')[0],
        isMetroCity: true
      });
    }
    
    setShowCTCModal(true);
  };

  const handleCTCFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCTCFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCTCFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedEmployee) return;
    
    try {
      setLoading(true);
      const token = getToken();
      
      const ctcData = {
        employeeId: selectedEmployee.id,
        basicSalary: parseFloat(ctcFormData.basicSalary) || 0,
        hra: calculatedComponents.hra,
        allowances: parseFloat(ctcFormData.allowances) || 0,
        bonuses: parseFloat(ctcFormData.bonuses) || 0,
        pfContribution: calculatedComponents.pfContribution,
        gratuity: calculatedComponents.gratuity,
        effectiveFrom: ctcFormData.effectiveFrom,
        totalCtc: calculatedComponents.totalCTC
      };
      
      console.log('Sending CTC data:', ctcData);
      
      const response = await axios.post(
        'http://localhost:8080/payflowapi/payroll/ctc/add',
        ctcData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        window.alert('CTC updated successfully!');
        setShowCTCModal(false);
        setSelectedEmployee(null);
        // Refresh the payroll data to show updated CTC
        fetchPayrollData();
      } else {
        window.alert('Failed to update CTC: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating CTC:', error);
      let errorMessage = 'Error updating CTC: ';
      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.response?.status === 404) {
        errorMessage += 'API endpoint not found. Please check if the backend server is running.';
      } else if (error.response?.status === 401) {
        errorMessage += 'Unauthorized. Please login again.';
      } else {
        errorMessage += error.message;
      }
      window.alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const closeCTCModal = () => {
    setShowCTCModal(false);
    setSelectedEmployee(null);
    setCTCFormData({
      basicSalary: '',
      allowances: '',
      bonuses: '',
      effectiveFrom: new Date().toISOString().split('T')[0],
      isMetroCity: true
    });
    setCalculatedComponents({
      hra: 0,
      pfContribution: 0,
      gratuity: 0,
      totalCTC: 0
    });
  };

  // Fetch employees for payslip generation (with CTC validation and active status filtering)
  const fetchAllEmployees = async () => {
    try {
      console.log('fetchAllEmployees called with role:', role);
      const token = getToken();
      console.log('Token available:', !!token);
      
      if (!token) {
        console.warn('No token available for fetchAllEmployees');
        return;
      }
      
      if (role === 'EMPLOYEE') {
        console.log('Role is EMPLOYEE, skipping employee fetch for payslip generation');
        return; // Employees don't need to see employee list for payslip generation
      }

      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      console.log('Fetching all employees for payslip generation...');
      const response = await axios.get('http://localhost:8080/payflowapi/onboard-employee/employees', { headers });
      
      console.log('Employee fetch response:', response);
      if (response.data) {
        console.log('Raw employees fetched:', response.data.length);
        
        // Filter only active employees and fetch their CTC data
        const activeEmployees = response.data.filter(emp => emp.status === 'ACTIVE');
        console.log('Active employees found:', activeEmployees.length);
        
        // Fetch CTC data for each active employee
        const employeesWithCTC = await Promise.all(
          activeEmployees.map(async employee => {
            try {
              console.log(`Fetching CTC for employee ${employee.id} (${employee.fullName})`);
              const ctcResponse = await axios.get(
                `http://localhost:8080/payflowapi/payroll/ctc/${employee.id}/current`, 
                { headers }
              );
              
              const ctcData = ctcResponse.data?.data;
              const totalCTC = ctcData?.totalCtc || ctcData?.total_ctc || 0;
              
              // Only include employees with CTC data
              if (totalCTC > 0) {
                return {
                  ...employee,
                  ctcDetails: ctcData,
                  currentCTC: totalCTC,
                  hasCTC: true
                };
              } else {
                console.warn(`Employee ${employee.fullName} (ID: ${employee.id}) has no CTC data, excluding from payslip generation`);
                return null;
              }
            } catch (ctcError) {
              console.warn(`Failed to fetch CTC for employee ${employee.id} (${employee.fullName}):`, ctcError.response?.data || ctcError.message);
              return null;
            }
          })
        );
        
        // Filter out employees without CTC
        const validEmployees = employeesWithCTC.filter(emp => emp !== null);
        console.log('Employees with CTC data for payslip generation:', validEmployees.length);
        
        setAllEmployees(validEmployees);
      } else {
        console.warn('No employee data received');
        setAllEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching employees for payslip generation:', error);
      console.error('Error details:', error.response?.data);
      setAllEmployees([]);
    }
  };

  // Handle payslip generation with business logic validation
  const handleGeneratePayslips = async () => {
    try {
      // Validate form data first
      const validation = validatePayslipForm();
      if (!validation.isValid) {
        window.alert(validation.message);
        return;
      }

      setGeneratingPayslips(true);
      const token = getToken();
      
      if (!token) {
        window.alert('Authentication token not found. Please login again.');
        return;
      }

      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Convert month name to number for API
      const monthNumber = getMonthNumber(selectedMonth);
      
      const requestData = {
        month: monthNumber,
        year: parseInt(selectedYear),
        employeeIds: generationType === 'selected' ? selectedEmployeeIds : null
      };

      console.log('Generating payslips with data:', requestData);

      const response = await axios.post('http://localhost:8080/payflowapi/payroll/payslips/generate', requestData, { headers });
      
      if (response.data.success) {
        window.alert(`Successfully generated payslips for ${selectedMonth} ${selectedYear}`);
        // Refresh payroll data to show new payslips
        fetchPayrollData();
      } else {
        window.alert('Failed to generate payslips: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating payslips:', error);
      let errorMessage = 'Error generating payslips: ';
      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.response?.status === 404) {
        errorMessage += 'API endpoint not found. Please check if the backend server is running.';
      } else {
        errorMessage += error.message;
      }
      window.alert(errorMessage);
    } finally {
      setGeneratingPayslips(false);
    }
  };

  // Validate payslip generation form
  const validatePayslipForm = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const selectedMonthNumber = getMonthNumber(selectedMonth);
    const selectedYearNumber = parseInt(selectedYear);

    // Don't allow future months or years
    if (selectedYearNumber > currentYear) {
      return { isValid: false, message: 'Cannot generate payslips for future years' };
    }

    if (selectedYearNumber === currentYear && selectedMonthNumber > currentMonth) {
      return { isValid: false, message: 'Cannot generate payslips for future months' };
    }

    if (generationType === 'selected' && selectedEmployeeIds.length === 0) {
      return { isValid: false, message: 'Please select at least one employee' };
    }

    // Check if selected employees are eligible for the selected month
    if (generationType === 'selected') {
      const selectedEmployees = allEmployees.filter(emp => selectedEmployeeIds.includes(emp.id));
      const ineligibleEmployees = selectedEmployees.filter(emp => !isEmployeeEligibleForMonth(emp));
      
      if (ineligibleEmployees.length > 0) {
        const names = ineligibleEmployees.map(emp => emp.fullName).join(', ');
        return { 
          isValid: false, 
          message: `Some selected employees joined after ${selectedMonth} ${selectedYear}: ${names}` 
        };
      }
    }

    const eligibleCount = getEligibleEmployeeCount();
    if (generationType === 'all' && eligibleCount === 0) {
      return { 
        isValid: false, 
        message: `No employees were working during ${selectedMonth} ${selectedYear}. Please select a different period.` 
      };
    }

    return { isValid: true };
  };

  // Convert month name to number
  const getMonthNumber = (monthName) => {
    const months = {
      'JANUARY': 1, 'FEBRUARY': 2, 'MARCH': 3, 'APRIL': 4,
      'MAY': 5, 'JUNE': 6, 'JULY': 7, 'AUGUST': 8,
      'SEPTEMBER': 9, 'OCTOBER': 10, 'NOVEMBER': 11, 'DECEMBER': 12
    };
    return months[monthName] || 8; // Default to August
  };

  // Get available years (current year and past 2 years)
  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2];
  };

  // Get available months based on selected year
  const getAvailableMonths = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const selectedYearNumber = parseInt(selectedYear);

    const allMonths = [
      'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
      'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
    ];

    // If current year is selected, only show months up to current month
    if (selectedYearNumber === currentYear) {
      return allMonths.slice(0, currentMonth);
    }

    return allMonths;
  };

  // Handle employee selection for payslip generation
  const handleEmployeeSelect = (employeeId, isSelected) => {
    if (isSelected) {
      setSelectedEmployeeIds(prev => [...prev, employeeId]);
    } else {
      setSelectedEmployeeIds(prev => prev.filter(id => id !== employeeId));
    }
  };

  // Handle select all employees (filtered and eligible only)
  const handleSelectAllEmployees = (isSelected) => {
    const filteredEmployees = getFilteredEmployees();
    const eligibleEmployees = filteredEmployees.filter(emp => isEmployeeEligibleForMonth(emp));
    
    if (isSelected) {
      const newSelections = eligibleEmployees.map(emp => emp.id);
      setSelectedEmployeeIds(prev => [...new Set([...prev, ...newSelections])]);
    } else {
      const eligibleIds = eligibleEmployees.map(emp => emp.id);
      setSelectedEmployeeIds(prev => prev.filter(id => !eligibleIds.includes(id)));
    }
  };

  // Get filtered employees based on search term and joining date eligibility
  const getFilteredEmployees = () => {
    let employees = allEmployees;
    
    // First filter by joining date eligibility
    employees = employees.filter(emp => isEmployeeEligibleForMonth(emp));
    
    // Then filter by search term if provided
    if (!employeeSearchTerm.trim()) {
      return employees;
    }
    
    const searchLower = employeeSearchTerm.toLowerCase();
    return employees.filter(emp =>
      emp.fullName?.toLowerCase().includes(searchLower) ||
      emp.email?.toLowerCase().includes(searchLower) ||
      emp.id?.toString().includes(searchLower) ||
      emp.department?.toLowerCase().includes(searchLower) ||
      emp.position?.toLowerCase().includes(searchLower)
    );
  };

  // Check if employee is eligible for payslip generation for the selected month/year
  const isEmployeeEligibleForMonth = (employee) => {
    if (!employee.createdAt && !employee.joiningDate && !employee.onboardedDate) {
      // If no joining date is available, include the employee (fallback)
      console.warn(`No joining date found for employee ${employee.fullName} (ID: ${employee.id}), including by default`);
      return true;
    }

    // Try different possible date fields
    const joiningDate = employee.joiningDate || employee.onboardedDate || employee.createdAt;
    const employeeJoinDate = new Date(joiningDate);
    
    // Create date for the LAST DAY of the selected month/year (not first day)
    const selectedMonthNumber = getMonthNumber(selectedMonth);
    const selectedYearNumber = parseInt(selectedYear);
    const selectedMonthLastDay = new Date(selectedYearNumber, selectedMonthNumber, 0); // Last day of month
    
    // Employee is eligible if they joined before or during the selected month
    const isEligible = employeeJoinDate <= selectedMonthLastDay;
    
    if (!isEligible) {
      console.log(`Employee ${employee.fullName} (ID: ${employee.id}) joined on ${employeeJoinDate.toLocaleDateString()}, not eligible for ${selectedMonth} ${selectedYear}`);
    } else {
      console.log(`Employee ${employee.fullName} (ID: ${employee.id}) joined on ${employeeJoinDate.toLocaleDateString()}, eligible for ${selectedMonth} ${selectedYear}`);
    }
    
    return isEligible;
  };

  // Check if employee joined mid-month and needs pro-rating
  const isProRatedEmployee = (employee) => {
    if (!employee.createdAt && !employee.joiningDate && !employee.onboardedDate) {
      return false;
    }

    const joiningDate = employee.joiningDate || employee.onboardedDate || employee.createdAt;
    const employeeJoinDate = new Date(joiningDate);
    const selectedMonthNumber = getMonthNumber(selectedMonth);
    const selectedYearNumber = parseInt(selectedYear);
    
    // Check if employee joined in the middle of the selected month
    const monthStart = new Date(selectedYearNumber, selectedMonthNumber - 1, 1);
    const monthEnd = new Date(selectedYearNumber, selectedMonthNumber, 0);
    
    // Pro-rated if joined after 1st day but within the month
    return employeeJoinDate > monthStart && employeeJoinDate <= monthEnd;
  };

  // Calculate pro-rated salary information
  const getProRatedInfo = (employee) => {
    if (!isProRatedEmployee(employee)) {
      return { isProRated: false, workingDays: null, totalDays: null, percentage: 100 };
    }

    const joiningDate = employee.joiningDate || employee.onboardedDate || employee.createdAt;
    const employeeJoinDate = new Date(joiningDate);
    const selectedMonthNumber = getMonthNumber(selectedMonth);
    const selectedYearNumber = parseInt(selectedYear);
    
    const monthEnd = new Date(selectedYearNumber, selectedMonthNumber, 0);
    const totalDaysInMonth = monthEnd.getDate();
    
    // Calculate working days from joining date to end of month
    const workingDays = monthEnd.getDate() - employeeJoinDate.getDate() + 1;
    const percentage = Math.round((workingDays / totalDaysInMonth) * 100);
    
    return {
      isProRated: true,
      workingDays,
      totalDays: totalDaysInMonth,
      percentage,
      joiningDate: employeeJoinDate.toLocaleDateString()
    };
  };

  // Get eligible employee count for the selected period
  const getEligibleEmployeeCount = () => {
    return allEmployees.filter(emp => isEmployeeEligibleForMonth(emp)).length;
  };

  // View payslip in new tab
  const handleView = async (payslip) => {
    try {
      const token = getToken();
      const viewUrl = `http://localhost:8080/payflowapi/payroll/payslips/download/${payslip.employeeId}/${payslip.month.toLowerCase()}/${payslip.year}`;
      
      // Open in new tab with authorization header
      const newWindow = window.open('', '_blank');
      
      try {
        const response = await fetch(viewUrl, {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const htmlContent = await response.text();
          newWindow.document.write(htmlContent);
          newWindow.document.close();
        } else {
          newWindow.close();
          window.alert('Failed to view payslip');
        }
      } catch (error) {
        newWindow.close();
        console.error('Error viewing payslip:', error);
        window.alert('Failed to view payslip. Please try downloading instead.');
      }
    } catch (error) {
      console.error('Error viewing payslip:', error);
      window.alert('Failed to view payslip. Please try again.');
    }
  };

  // Download payslip as HTML file
  const handleDownload = async (payslip) => {
    try {
      setDownloading(true);
      const token = getToken();
      
      const downloadUrl = `http://localhost:8080/payflowapi/payroll/payslips/download/${payslip.employeeId}/${payslip.month.toLowerCase()}/${payslip.year}`;
      
      console.log('Downloading from:', downloadUrl);
      
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payslip_${payslip.employeeId}_${payslip.month}_${payslip.year}.html`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        window.alert('Payslip downloaded successfully! You can open the HTML file in your browser and print it as PDF.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        window.alert(`Download failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error downloading payslip:', error);
      window.alert('Failed to download payslip. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      console.log('Current user role:', role);
      console.log('Auth token available:', !!token);
      
      if (!token) {
        console.error('No authentication token available');
        return;
      }
      
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const promises = [];
      
      // Admin and HR can see all payslips
      if (role === 'ADMIN' || role === 'HR') {
        console.log('Fetching all payslips for', role);
        promises.push(
          axios.get('http://localhost:8080/payflowapi/payroll/payslips', { headers })
            .then(res => {
              console.log('Payslips API response:', res.data);
              return { type: 'payslips', data: res.data?.data || res.data || [] };
            })
            .catch(error => {
              console.error('Error fetching payslips:', error.response?.data || error.message);
              // Try alternative endpoint
              return axios.get('http://localhost:8080/payflowapi/payslips', { headers })
                .then(res => {
                  console.log('Alternative payslips API response:', res.data);
                  return { type: 'payslips', data: res.data?.data || res.data || [] };
                })
                .catch(altError => {
                  console.error('Alternative payslips endpoint also failed:', altError.response?.data || altError.message);
                  return { type: 'payslips', data: [] };
                });
            })
        );
      } else if (role === 'EMPLOYEE') {
        // Employee can only see their own payslips
        const userInfo = user;
        if (userInfo?.id) {
          promises.push(
            axios.get(`http://localhost:8080/payflowapi/payroll/payslips/employee/${userInfo.id}`, { headers })
              .then(res => ({ type: 'payslips', data: res.data?.data || res.data || [] }))
              .catch(error => {
                console.error('Error fetching employee payslips:', error);
                return { type: 'payslips', data: [] };
              })
          );
        }
      }
      
      // Admin, HR, and Manager can see employee data
      if (role === 'ADMIN' || role === 'HR' || role === 'MANAGER') {
        console.log('Fetching employees for', role);
        promises.push(
          axios.get('http://localhost:8080/payflowapi/onboard-employee/employees', { headers })
            .then(async res => {
              console.log('Employees API response:', res.data);
              const employees = res.data || [];
              
              // Fetch CTC details for each employee
              const employeesWithCTC = await Promise.all(
                employees.map(async employee => {
                  try {
                    console.log(`Fetching CTC for employee ${employee.id} (${employee.fullName})`);
                    const ctcResponse = await axios.get(
                      `http://localhost:8080/payflowapi/payroll/ctc/${employee.id}/current`, 
                      { headers }
                    );
                    console.log(`CTC Response for employee ${employee.id} (${employee.fullName}):`, ctcResponse.data);
                    console.log(`Full CTC Response structure:`, JSON.stringify(ctcResponse.data, null, 2));
                    
                    const ctcData = ctcResponse.data?.data;
                    console.log(`Extracted CTC data for employee ${employee.id}:`, ctcData);
                    
                    // Handle different field naming conventions (camelCase vs snake_case)
                    const totalCTC = ctcData?.totalCtc || ctcData?.total_ctc || 0;
                    console.log(`Final totalCTC for employee ${employee.id}: ${totalCTC}`);
                    
                    return {
                      ...employee,
                      ctcDetails: ctcData,
                      currentCTC: totalCTC,
                      lastUpdated: ctcData?.createdAt ? new Date(ctcData.createdAt).toLocaleDateString() : 'N/A'
                    };
                  } catch (ctcError) {
                    console.warn(`Failed to fetch CTC for employee ${employee.id} (${employee.fullName}):`, ctcError.response?.data || ctcError.message);
                    console.error(`CTC Error details for employee ${employee.id}:`, ctcError);
                    return {
                      ...employee,
                      ctcDetails: null,
                      currentCTC: 0,
                      lastUpdated: 'N/A'
                    };
                  }
                })
              );
              
              return { type: 'employees', data: employeesWithCTC };
            })
            .catch(error => {
              console.error('Error fetching employees:', error.response?.data || error.message);
              return { type: 'employees', data: [] };
            })
        );
      }

      const results = await Promise.all(promises);
      
      // Debug logging
      console.log('Payroll API Results:', results);
      
      let newPayrollData = { ...payrollData };
      
      results.forEach(result => {
        switch (result.type) {
          case 'payslips':
            newPayrollData.payslips = result.data;
            newPayrollData.statistics.totalPayslips = result.data.length;
            newPayrollData.statistics.totalPayrollAmount = result.data.reduce(
              (sum, payslip) => sum + (Number(payslip.netPay) || 0), 0
            );
            break;
          case 'employees':
            newPayrollData.employees = result.data;
            newPayrollData.statistics.totalEmployees = result.data.length;
            break;
          default:
            break;
        }
      });
      
      console.log('Final Payroll Data:', newPayrollData);
      setPayrollData(newPayrollData);
    } catch (error) {
      console.error('Error fetching payroll data:', error);
      
      // Fallback: Use mock data for testing UI
      console.log('Using fallback mock data for testing');
      const mockData = {
        statistics: {
          totalPayslips: 5,
          totalEmployees: 12,
          totalPayrollAmount: 750000,
          currentMonth: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
        },
        payslips: [
          {
            employeeId: 'EMP001',
            month: 'August',
            year: '2025',
            netPay: 45000,
            deductions: 5000,
            generatedOn: new Date().toISOString()
          },
          {
            employeeId: 'EMP002',
            month: 'August',
            year: '2025',
            netPay: 55000,
            deductions: 7000,
            generatedOn: new Date().toISOString()
          }
        ],
        employees: [
          { id: 'EMP001', fullName: 'John Doe' },
          { id: 'EMP002', fullName: 'Jane Smith' }
        ]
      };
      setPayrollData(mockData);
    } finally {
      setLoading(false);
    }
  };

  // Get available tabs based on user permissions
  const getAvailableTabs = () => {
    const tabs = [];
    
    // Overview tab - available to all
    tabs.push({ id: 'overview', label: 'Overview', icon: '📊' });
    
    // Payslip management - Admin and HR
    if (canAccess(['ADMIN', 'HR'], ['VIEW_ALL_PAYSLIPS'])) {
      tabs.push({ id: 'payslips', label: 'All Payslips', icon: '📄' });
    }
    
    // Employee payslips - for employees
    if (role === 'EMPLOYEE') {
      tabs.push({ id: 'my-payslips', label: 'My Payslips', icon: '📋' });
    }
    
    // Payroll generation - Admin and HR only
    if (canAccess(['ADMIN', 'HR'], ['GENERATE_PAYSLIPS'])) {
      tabs.push({ id: 'generate', label: 'Generate Payslips', icon: '🚀' });
    }
    
    // CTC Management - Admin and HR only
    if (canAccess(['ADMIN', 'HR'], ['MANAGE_CTC'])) {
      tabs.push({ id: 'ctc', label: 'CTC Management', icon: '💼' });
    }
    
    return tabs;
  };

  // Render payroll overview
  const renderOverview = () => {
    const stats = payrollData.statistics;
    
    if (loading) {
      return (
        <div className="payroll-overview">
          <div className="loading-state">
            <h3>Loading payroll data...</h3>
            <p>Please wait while we fetch the latest information.</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="payroll-overview">
        <div className="overview-header">
          <h3>Payroll Overview</h3>
          <p>Current month: {stats.currentMonth}</p>
        </div>
        
        <div className="overview-stats">
          <PermissionWrapper requiredRoles={['ADMIN', 'HR']}>
            <div className="stat-card">
              <div className="stat-icon">📄</div>
              <div className="stat-content">
                <h4>{stats.totalPayslips}</h4>
                <p>Total Payslips</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <h4>{stats.totalEmployees}</h4>
                <p>Total Employees</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <h4>₹{stats.totalPayrollAmount.toLocaleString()}</h4>
                <p>Total Payroll</p>
              </div>
            </div>
          </PermissionWrapper>
          
          <PermissionWrapper requiredRoles={['EMPLOYEE']}>
            <div className="employee-overview">
              <h4>Your Payroll Information</h4>
              <div className="employee-stats">
                <div className="stat-card">
                  <div className="stat-icon">📋</div>
                  <div className="stat-content">
                    <h4>{payrollData.payslips.length}</h4>
                    <p>Your Payslips</p>
                  </div>
                </div>
                
                {payrollData.payslips.length > 0 && (
                  <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                      <h4>₹{Number(payrollData.payslips[0]?.netPay || 0).toLocaleString()}</h4>
                      <p>Latest Net Pay</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </PermissionWrapper>
        </div>
        
        <PermissionWrapper requiredRoles={['ADMIN', 'HR']}>
          <div className="quick-actions">
            <h4>Quick Actions</h4>
            <div className="action-buttons">
              <button 
                className="btn btn-primary"
                onClick={() => setActiveTab('generate')}
              >
                🚀 Generate Payslips
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setActiveTab('payslips')}
              >
                📄 View All Payslips
              </button>
              <button 
                className="btn btn-ghost"
                onClick={() => setActiveTab('ctc')}
              >
                💼 Manage CTC
              </button>
            </div>
          </div>
        </PermissionWrapper>
      </div>
    );
  };

  // Render payslip search filters
  const renderPayslipFilters = () => {
    // Get unique months and years from payslips data
    const months = ['ALL', ...new Set(payrollData.payslips.map(p => p.month?.toUpperCase()).filter(Boolean))];
    const years = ['ALL', ...new Set(payrollData.payslips.map(p => p.year?.toString()).filter(Boolean))].sort((a, b) => {
      if (a === 'ALL') return -1;
      if (b === 'ALL') return 1;
      return b - a; // Sort years in descending order
    });

    return (
      <div className="payslip-filters">
        <div className="filter-group">
          <label htmlFor="month-filter">Filter by Month:</label>
          <select 
            id="month-filter"
            value={filterMonth} 
            onChange={(e) => setFilterMonth(e.target.value)}
            className="filter-select"
          >
            {months.map(month => (
              <option key={month} value={month}>
                {month === 'ALL' ? 'All Months' : month}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="year-filter">Filter by Year:</label>
          <select 
            id="year-filter"
            value={filterYear} 
            onChange={(e) => setFilterYear(e.target.value)}
            className="filter-select"
          >
            {years.map(year => (
              <option key={year} value={year}>
                {year === 'ALL' ? 'All Years' : year}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-results">
          <span className="results-count">
            Showing {filteredPayslips.length} of {payrollData.payslips.length} payslips
          </span>
        </div>
      </div>
    );
  };

  // Render all payslips (Admin/HR view)
  const renderAllPayslips = () => {
    return (
      <div className="all-payslips">
        <div className="payslips-header">
          <h3>All Employee Payslips</h3>
          <p>Manage and view all generated payslips</p>
        </div>
        
        {/* Add filter controls */}
        {payrollData.payslips.length > 0 && renderPayslipFilters()}
        
        {loading ? (
          <div className="loading-state">Loading payslips...</div>
        ) : (
          <div className="payslips-grid">
            {payrollData.payslips.length === 0 ? (
              <div className="empty-state">
                <h4>No payslips found</h4>
                <p>Generate payslips to see them here</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setActiveTab('generate')}
                >
                  Generate Payslips
                </button>
              </div>
            ) : filteredPayslips.length === 0 ? (
              <div className="empty-state">
                <h4>No payslips match your filters</h4>
                <p>Try adjusting your month and year filters</p>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setFilterMonth('ALL');
                    setFilterYear('ALL');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredPayslips.map(payslip => (
                <div key={`${payslip.employeeId}-${payslip.month}-${payslip.year}`} className="payslip-card">
                  <div className="payslip-header">
                    <h4>Employee ID: {payslip.employeeId}</h4>
                    <span className="payslip-period">{payslip.month} {payslip.year}</span>
                  </div>
                  <div className="payslip-details">
                    <div className="detail-row">
                      <span>Net Pay:</span>
                      <span className="amount">₹{Number(payslip.netPay).toLocaleString()}</span>
                    </div>
                    <div className="detail-row">
                      <span>Deductions:</span>
                      <span className="deduction">₹{Number(payslip.deductions).toLocaleString()}</span>
                    </div>
                    <div className="detail-row">
                      <span>Generated:</span>
                      <span>{new Date(payslip.generatedOn).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-row">
                      <span>Unpaid Leaves:</span>
                      <span className="deduction">{payslip.unpaidLeaves || 0}</span>
                    </div>
                    <div className="detail-row">
                      <span>Unpaid Leave Deduction:</span>
                      <span className="deduction">₹{Number(payslip.unpaidLeaveDeduction || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="payslip-actions">
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleView(payslip)}
                      style={{ marginRight: '8px' }}
                    >
                      👁️ View
                    </button>
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => handleDownload(payslip)}
                      disabled={downloading}
                    >
                      {downloading ? '⏳ Downloading...' : '📄 Download'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  // Render employee payslips (Employee view)
  const renderMyPayslips = () => {
    return (
      <div className="my-payslips">
        <div className="payslips-header">
          <h3>My Payslips</h3>
          <p>View and download your payslips</p>
        </div>
        
        {/* Add filter controls */}
        {payrollData.payslips.length > 0 && renderPayslipFilters()}
        
        {loading ? (
          <div className="loading-state">Loading your payslips...</div>
        ) : (
          <div className="payslips-list">
            {payrollData.payslips.length === 0 ? (
              <div className="empty-state">
                <h4>No payslips available</h4>
                <p>Your payslips will appear here once generated by HR</p>
              </div>
            ) : filteredPayslips.length === 0 ? (
              <div className="empty-state">
                <h4>No payslips match your filters</h4>
                <p>Try adjusting your month and year filters</p>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setFilterMonth('ALL');
                    setFilterYear('ALL');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredPayslips.map(payslip => (
                <div key={`${payslip.month}-${payslip.year}`} className="my-payslip-card">
                  <div className="payslip-header">
                    <div className="payslip-period">{payslip.month} {payslip.year}</div>
                    <div className="payslip-status">Paid</div>
                  </div>
                  <div className="payslip-info">
                    <div className="pay-details">
                      <div className="pay-item">
                        <span>Gross Salary:</span>
                        <span>₹{(Number(payslip.netPay) + Number(payslip.deductions)).toLocaleString()}</span>
                      </div>
                      <div className="pay-item">
                        <span>Deductions:</span>
                        <span className="deduction">-₹{Number(payslip.deductions).toLocaleString()}</span>
                      </div>
                      <div className="pay-item net-pay">
                        <span>Net Pay:</span>
                        <span>₹{Number(payslip.netPay).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="payslip-actions">
                      <button 
                        className="btn btn-secondary"
                        onClick={() => handleView(payslip)}
                      >
                        👁️ View
                      </button>
                      <button 
                        className="btn btn-primary"
                        onClick={() => handleDownload(payslip)}
                        disabled={downloading}
                      >
                        {downloading ? '⏳ Downloading...' : '📄 Download'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  // Render payslip generation (Admin/HR only)
  const renderPayslipGeneration = () => {
    return (
      <div className="payslip-generation">
        <div className="generation-header">
          <h3>Generate Payslips</h3>
          <p>Create payslips for employees</p>
        </div>
        
        <div className="generation-form">
          <div className="form-section">
            <h4>Select Generation Period</h4>
            <div className="period-controls">
              <div className="form-group">
                <label>Month:</label>
                <select 
                  className="form-control"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {getAvailableMonths().map(month => (
                    <option key={month} value={month}>
                      {month.charAt(0) + month.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Year:</label>
                <select 
                  className="form-control"
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    // Reset month to current month if future year is selected
                    const currentMonth = new Date().getMonth();
                    const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
                                       'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
                    if (parseInt(e.target.value) === new Date().getFullYear()) {
                      setSelectedMonth(monthNames[currentMonth]);
                    }
                  }}
                >
                  {getAvailableYears().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="period-info" style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              backgroundColor: '#e3f2fd',
              borderRadius: '4px',
              fontSize: '0.875rem',
              color: '#1565c0'
            }}>
              ℹ️ Only past and current months are available for payslip generation. 
              Only employees who joined before or during the selected month will be eligible.
            </div>
          </div>
          
          <div className="form-section">
            <h4>Employee Selection</h4>
            <div className="employee-selection">
              <div className="selection-options">
                <label className="radio-option">
                  <input 
                    type="radio" 
                    name="selection" 
                    value="all" 
                    checked={generationType === 'all'}
                    onChange={(e) => setGenerationType(e.target.value)}
                  />
                  <span>Generate for all employees</span>
                </label>
                <label className="radio-option">
                  <input 
                    type="radio" 
                    name="selection" 
                    value="selected" 
                    checked={generationType === 'selected'}
                    onChange={(e) => setGenerationType(e.target.value)}
                  />
                  <span>Generate for selected employees</span>
                </label>
              </div>
              
              {/* Employee selection list - only show when "selected" is chosen */}
              {generationType === 'selected' && (
                <div className="employee-list-container" style={{
                  marginTop: '1rem',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  maxHeight: '500px',
                  overflowY: 'auto'
                }}>
                  <div className="employee-list-header" style={{
                    padding: '0.75rem',
                    backgroundColor: '#f8f9fa',
                    borderBottom: '1px solid #e9ecef',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={(() => {
                          const eligibleEmployees = getFilteredEmployees().filter(emp => isEmployeeEligibleForMonth(emp));
                          return eligibleEmployees.length > 0 && eligibleEmployees.every(emp => selectedEmployeeIds.includes(emp.id));
                        })()}
                        onChange={(e) => handleSelectAllEmployees(e.target.checked)}
                      />
                      <span style={{ fontWeight: '500' }}>
                        Select All Eligible ({selectedEmployeeIds.length}/{(() => {
                          const eligibleCount = getFilteredEmployees().filter(emp => isEmployeeEligibleForMonth(emp)).length;
                          const totalCount = getFilteredEmployees().length;
                          return `${eligibleCount}/${totalCount}`;
                        })()})
                      </span>
                    </div>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                      onClick={fetchAllEmployees}
                    >
                      🔄 Refresh
                    </button>
                  </div>
                  
                  {/* Search bar */}
                  <div style={{
                    padding: '0.75rem',
                    borderBottom: '1px solid #e9ecef',
                    backgroundColor: '#ffffff'
                  }}>
                    <input
                      type="text"
                      placeholder="Search employees by name, email, ID, department..."
                      value={employeeSearchTerm}
                      onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                  
                  {allEmployees.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
                      <p>Loading employees with CTC data...</p>
                      <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        Only active employees with CTC data are eligible for payslip generation
                      </p>
                      <button 
                        className="btn btn-primary" 
                        style={{ marginTop: '1rem' }}
                        onClick={fetchAllEmployees}
                      >
                        Retry Loading
                      </button>
                    </div>
                  ) : getFilteredEmployees().length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
                      <p>No employees found matching "{employeeSearchTerm}"</p>
                      <button 
                        className="btn btn-secondary" 
                        style={{ marginTop: '1rem' }}
                        onClick={() => setEmployeeSearchTerm('')}
                      >
                        Clear Search
                      </button>
                    </div>
                  ) : (
                    <div className="employee-list">
                      {getFilteredEmployees().map(employee => {
                        const isEligible = isEmployeeEligibleForMonth(employee);
                        const proRatedInfo = getProRatedInfo(employee);
                        const joiningDate = employee.joiningDate || employee.onboardedDate || employee.createdAt;
                        
                        return (
                          <div key={employee.id} className="employee-item" style={{
                            padding: '0.75rem',
                            borderBottom: '1px solid #f1f3f4',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            cursor: isEligible ? 'pointer' : 'not-allowed',
                            backgroundColor: selectedEmployeeIds.includes(employee.id) ? '#e3f2fd' : 'transparent',
                            opacity: isEligible ? 1 : 0.6
                          }}>
                            <input
                              type="checkbox"
                              checked={selectedEmployeeIds.includes(employee.id)}
                              onChange={(e) => {
                                if (isEligible) {
                                  handleEmployeeSelect(employee.id, e.target.checked);
                                } else {
                                  window.alert(`${employee.fullName} joined after ${selectedMonth} ${selectedYear} and is not eligible for this period.`);
                                }
                              }}
                              disabled={!isEligible}
                            />
                            <div className="employee-info" style={{ flex: 1 }}>
                              <div style={{ fontWeight: '500', color: '#333', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {employee.fullName}
                                <span style={{
                                  fontSize: '0.75rem',
                                  padding: '0.125rem 0.375rem',
                                  borderRadius: '8px',
                                  backgroundColor: '#d4edda',
                                  color: '#155724'
                                }}>
                                  CTC: ₹{Number(employee.currentCTC).toLocaleString()}
                                </span>
                                {proRatedInfo.isProRated && (
                                  <span style={{
                                    fontSize: '0.75rem',
                                    padding: '0.125rem 0.375rem',
                                    borderRadius: '8px',
                                    backgroundColor: '#fff3cd',
                                    color: '#856404'
                                  }}>
                                    Pro-rated ({proRatedInfo.percentage}%)
                                  </span>
                                )}
                                {!isEligible && (
                                  <span style={{
                                    fontSize: '0.75rem',
                                    padding: '0.125rem 0.375rem',
                                    borderRadius: '8px',
                                    backgroundColor: '#f8d7da',
                                    color: '#721c24'
                                  }}>
                                    Not Eligible
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                                ID: {employee.id} • {employee.email}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#495057' }}>
                                Department: {employee.department || 'N/A'} • Position: {employee.position || 'N/A'}
                                {joiningDate && (
                                  <span style={{ marginLeft: '0.5rem', color: isEligible ? '#28a745' : '#dc3545' }}>
                                    • Joined: {new Date(joiningDate).toLocaleDateString()}
                                  </span>
                                )}
                                {proRatedInfo.isProRated && (
                                  <span style={{ marginLeft: '0.5rem', color: '#856404' }}>
                                    • Working Days: {proRatedInfo.workingDays}/{proRatedInfo.totalDays}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="employee-status" style={{
                              fontSize: '0.75rem',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '12px',
                              backgroundColor: isEligible ? 
                                (proRatedInfo.isProRated ? '#fff3cd' : '#d4edda') : 
                                '#f8d7da',
                              color: isEligible ? 
                                (proRatedInfo.isProRated ? '#856404' : '#155724') : 
                                '#721c24'
                            }}>
                              {isEligible ? 
                                (proRatedInfo.isProRated ? 'PRO-RATED' : 'FULL MONTH') : 
                                'NOT ELIGIBLE'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              className="btn btn-primary" 
              disabled={generatingPayslips}
              onClick={handleGeneratePayslips}
            >
              {generatingPayslips ? '⏳ Generating...' : '🚀 Generate Payslips'}
            </button>
            
            {/* Dynamic validation messages */}
            {(() => {
              const validation = validatePayslipForm();
              if (!validation.isValid) {
                return (
                  <p style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    ⚠️ {validation.message}
                  </p>
                );
              }
              
              // Show success info when form is valid
              const eligibleCount = getEligibleEmployeeCount();
              const employeeCount = generationType === 'selected' ? 
                selectedEmployeeIds.filter(id => {
                  const emp = allEmployees.find(e => e.id === id);
                  return emp && isEmployeeEligibleForMonth(emp);
                }).length : 
                eligibleCount;
                
              return (
                <p style={{ color: '#28a745', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  ✅ Ready to generate payslips for {employeeCount} eligible employee{employeeCount !== 1 ? 's' : ''} 
                  for {selectedMonth.charAt(0) + selectedMonth.slice(1).toLowerCase()} {selectedYear}
                  {eligibleCount < allEmployees.length && (
                    <span style={{ color: '#ffc107', marginLeft: '0.5rem' }}>
                      ({allEmployees.length - eligibleCount} not eligible for this period)
                    </span>
                  )}
                </p>
              );
            })()}
          </div>
        </div>
      </div>
    );
  };

  // Render CTC management (Admin/HR only)
  const renderCTCManagement = () => {
    return (
      <div className="ctc-management">
        <div className="ctc-header">
          <h3>CTC Management</h3>
          <p>Manage employee compensation packages</p>
        </div>
        
        <div className="ctc-content" style={{
          display: 'block',
          width: '100%'
        }}>
          {/* Search Section - Separate Row */}
          {/* <div className="search-section" style={{ 
            display: 'block',
            width: '100%',
            marginBottom: '1.5rem', 
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            boxSizing: 'border-box'
          }}>
            <div className="search-bar" style={{ 
              display: 'flex', 
              gap: '0.75rem', 
              alignItems: 'center',
              maxWidth: '500px',
              width: '100%'
            }}>
              <input 
                type="text" 
                placeholder="Search employees by name, ID, or email..." 
                className="form-control"
                value={searchTerm}
                onChange={handleSearchInputChange}
                style={{ flex: 1 }}
              />
              <button 
                className="btn btn-secondary" 
                onClick={handleSearch}
                style={{
                  minWidth: 'auto',
                  padding: '0.5rem 1rem',
                  whiteSpace: 'nowrap'
                }}
              >
                🔍 Search
              </button>
            </div>
          </div> */}
          
          {/* Table Section - Separate Row */}
          <div className="ctc-table-section" style={{
            display: 'block',
            width: '100%',
            clear: 'both'
          }}>
            <div className="ctc-table" style={{
              width: '100%',
              overflow: 'auto'
            }}>
              <table className="data-table" style={{
                width: '100%',
                tableLayout: 'auto'
              }}>
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Current CTC</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map(employee => (
                      <tr key={employee.id}>
                        <td>{employee.id}</td>
                        <td>{employee.fullName}</td>
                        <td>
                          {employee.currentCTC ? 
                            `₹${Number(employee.currentCTC).toLocaleString('en-IN')}` : 
                            '₹0'
                          }
                        </td>
                        <td>{employee.lastUpdated}</td>
                        <td>
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => handleEditCTC(employee)}
                          >
                            {employee.currentCTC > 0 ? '✏️ Edit CTC' : '➕ Add CTC'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ 
                        textAlign: 'center', 
                        padding: '2rem',
                        color: '#6c757d',
                        fontStyle: 'italic'
                      }}>
                        {searchTerm ? `No employees found matching "${searchTerm}"` : 'No employees available'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'payslips':
        return renderAllPayslips();
      case 'my-payslips':
        return renderMyPayslips();
      case 'generate':
        return renderPayslipGeneration();
      case 'ctc':
        return renderCTCManagement();
      default:
        return renderOverview();
    }
  };

  const availableTabs = getAvailableTabs();

  return (
    <Layout
      title="Payroll Management"
      subtitle="Comprehensive payroll operations"
      sidebarActive="payroll"
      requiredRoles={['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']}
    >
      <div className="payflow-payroll-management">
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
        
        {/* Advanced CTC Edit Modal with Business Logic */}
        {showCTCModal && (
          <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div className="modal-content" style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              width: '95%',
              maxWidth: '900px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <div className="modal-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                borderBottom: '1px solid #eee',
                paddingBottom: '1rem'
              }}>
                <h3>💼 CTC Management - {selectedEmployee?.fullName}</h3>
                <button 
                  onClick={closeCTCModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleCTCFormSubmit}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '2rem',
                  marginBottom: '2rem'
                }}>
                  {/* Employee Information Section */}
                  <div style={{
                    padding: '1.5rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    <h4 style={{ marginBottom: '1rem', color: '#495057' }}>👤 Employee Information</h4>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>ID:</strong> {selectedEmployee?.id}
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>Name:</strong> {selectedEmployee?.fullName}
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>Email:</strong> {selectedEmployee?.email}
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <strong>Experience:</strong> {selectedEmployee?.experience || 'N/A'}
                    </div>
                  </div>

                  {/* HR Input Fields Section */}
                  <div style={{
                    padding: '1.5rem',
                    backgroundColor: '#fff',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px'
                  }}>
                    <h4 style={{ marginBottom: '1rem', color: '#007bff' }}>💼 Earnings</h4>
                    
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Basic Salary (₹) *
                      </label>
                      <input
                        type="number"
                        name="basicSalary"
                        value={ctcFormData.basicSalary}
                        onChange={handleCTCFormChange}
                        className="form-control"
                        required
                        min="0"
                        step="0.01"
                        placeholder="300000"
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
                      />
                      <small style={{ color: '#6c757d' }}>Base salary component (typically 40-50% of CTC)</small>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        HRA (House Rent Allowance) *
                      </label>
                      <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#e9ecef',
                        borderRadius: '4px',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        color: '#495057'
                      }}>
                        ₹{calculatedComponents.hra.toLocaleString()}
                      </div>
                      <small style={{ color: '#6c757d' }}>
                        {ctcFormData.isMetroCity ? '50%' : '40%'} of basic salary 
                        {calculating && <span style={{color: '#007bff'}}> ⏳ Calculating...</span>}
                      </small>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Other Allowances *
                      </label>
                      <input
                        type="number"
                        name="allowances"
                        value={ctcFormData.allowances}
                        onChange={handleCTCFormChange}
                        className="form-control"
                        min="0"
                        step="0.01"
                        placeholder="50000"
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
                      />
                      <small style={{ color: '#6c757d' }}>Transport, medical, communication allowances</small>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Bonus/Incentives *
                      </label>
                      <input
                        type="number"
                        name="bonuses"
                        value={ctcFormData.bonuses}
                        onChange={handleCTCFormChange}
                        className="form-control"
                        min="0"
                        step="0.01"
                        placeholder="50000"
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
                      />
                      <small style={{ color: '#6c757d' }}>Annual performance bonus or variable pay</small>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="checkbox"
                          name="isMetroCity"
                          checked={ctcFormData.isMetroCity}
                          onChange={handleCTCFormChange}
                        />
                        <span style={{ fontWeight: 'bold' }}>Metro City Employee</span>
                      </label>
                      <small style={{ color: '#6c757d' }}>Affects HRA calculation (50% metro vs 40% non-metro)</small>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Effective From *
                      </label>
                      <input
                        type="date"
                        name="effectiveFrom"
                        value={ctcFormData.effectiveFrom}
                        onChange={handleCTCFormChange}
                        className="form-control"
                        required
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Deductions Section */}
                <div style={{
                  padding: '1.5rem',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: '8px',
                  marginBottom: '2rem'
                }}>
                  <h4 style={{ marginBottom: '1rem', color: '#856404' }}>📉 Deductions</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        PF Contribution *
                      </label>
                      <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#f8d7da',
                        borderRadius: '4px',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        color: '#721c24'
                      }}>
                        ₹{calculatedComponents.pfContribution.toLocaleString()}
                      </div>
                      <small style={{ color: '#6c757d' }}>12% of basic salary (Employee + Employer)</small>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Tax Deduction *
                      </label>
                      <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#f8d7da',
                        borderRadius: '4px',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        color: '#721c24'
                      }}>
                        ₹{Math.round(calculatedComponents.totalCTC * 0.10).toLocaleString()}
                      </div>
                      <small style={{ color: '#6c757d' }}>Estimated 10% of total CTC (varies by income slab)</small>
                    </div>
                  </div>
                </div>

                {/* Auto-calculated Components & Summary */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '2rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{
                    padding: '1.5rem',
                    backgroundColor: '#d1ecf1',
                    border: '1px solid #bee5eb',
                    borderRadius: '8px'
                  }}>
                    <h4 style={{ marginBottom: '1rem', color: '#0c5460' }}>🧮 Auto-calculated Components</h4>
                    
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 'bold' }}>💰 Total Earnings</span>
                        <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                          ₹{(
                            (parseFloat(ctcFormData.basicSalary) || 0) +
                            calculatedComponents.hra +
                            (parseFloat(ctcFormData.allowances) || 0) +
                            (parseFloat(ctcFormData.bonuses) || 0)
                          ).toLocaleString()}
                        </span>
                      </div>
                      <small style={{ color: '#6c757d' }}>Basic + HRA + Allowances + Bonuses</small>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 'bold' }}>📉 Total Deductions</span>
                        <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
                          ₹{(calculatedComponents.pfContribution + Math.round(calculatedComponents.totalCTC * 0.10)).toLocaleString()}
                        </span>
                      </div>
                      <small style={{ color: '#6c757d' }}>PF + Tax Deductions</small>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 'bold' }}>🏢 Gratuity Provision</span>
                        <span style={{ fontWeight: 'bold' }}>₹{calculatedComponents.gratuity.toLocaleString()}</span>
                      </div>
                      <small style={{ color: '#6c757d' }}>4.81% of basic salary (annual provision)</small>
                    </div>
                  </div>

                  <div style={{
                    padding: '1.5rem',
                    backgroundColor: '#d4edda',
                    border: '1px solid #c3e6cb',
                    borderRadius: '8px'
                  }}>
                    <h4 style={{ marginBottom: '1rem', color: '#155724' }}>📊 CTC Summary</h4>
                    
                    <div style={{
                      padding: '1rem',
                      backgroundColor: '#fff',
                      borderRadius: '8px',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>🌟 Total CTC:</span>
                        <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#007bff' }}>
                          ₹{calculatedComponents.totalCTC.toLocaleString()}
                        </span>
                      </div>
                      <small style={{ color: '#6c757d' }}>Annual Cost to Company</small>
                    </div>

                    <div style={{
                      padding: '1rem',
                      backgroundColor: '#e8f5e8',
                      borderRadius: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>💵 Net Pay:</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#28a745' }}>
                          ₹{Math.max(0, (
                            (parseFloat(ctcFormData.basicSalary) || 0) +
                            calculatedComponents.hra +
                            (parseFloat(ctcFormData.allowances) || 0) +
                            (parseFloat(ctcFormData.bonuses) || 0)
                          ) - (calculatedComponents.pfContribution + Math.round(calculatedComponents.totalCTC * 0.10))).toLocaleString()}
                        </span>
                      </div>
                      <small style={{ color: '#6c757d' }}>Annual take-home after deductions</small>
                    </div>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #eee'
                }}>
                  <button 
                    type="button" 
                    onClick={closeCTCModal}
                    className="btn btn-secondary"
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderRadius: '4px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading || !ctcFormData.basicSalary}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderRadius: '4px',
                      backgroundColor: loading ? '#6c757d' : '#007bff',
                      color: 'white',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? '💾 Saving...' : '💾 Set CTC'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default PayrollManagement;
