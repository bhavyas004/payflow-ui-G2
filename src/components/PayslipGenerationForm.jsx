import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PayslipGenerationForm = ({ isOpen, onClose, onGenerate, loading = false }) => {
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    selectedEmployees: [],
    payPeriodType: 'monthly', // Fixed as monthly
    includeDeductions: true,
    includeBonuses: true,
    includeOvertime: true,
    includeAttendance: true
  });

  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);

  // Real-world months with proper numeric values
  const months = [
    { value: 1, name: 'January', short: 'Jan' },
    { value: 2, name: 'February', short: 'Feb' },
    { value: 3, name: 'March', short: 'Mar' },
    { value: 4, name: 'April', short: 'Apr' },
    { value: 5, name: 'May', short: 'May' },
    { value: 6, name: 'June', short: 'Jun' },
    { value: 7, name: 'July', short: 'Jul' },
    { value: 8, name: 'August', short: 'Aug' },
    { value: 9, name: 'September', short: 'Sep' },
    { value: 10, name: 'October', short: 'Oct' },
    { value: 11, name: 'November', short: 'Nov' },
    { value: 12, name: 'December', short: 'Dec' }
  ];

  const payPeriodTypes = [
    { value: 'monthly', name: 'Monthly', description: 'Full calendar month' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get('/payflowapi/onboard-employee/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && Array.isArray(response.data)) {
        const activeEmployees = response.data
          .filter(emp => emp.status === 'ACTIVE')
          .map(emp => ({
            id: emp.id,
            name: emp.fullName || `${emp.firstName} ${emp.lastName}` || emp.name,
            email: emp.email,
            department: emp.department || 'Unknown',
            position: emp.position || emp.designation || 'Employee',
            salary: emp.salary || emp.basicSalary || 0,
            employeeId: emp.employeeId || emp.id
          }));
        setEmployees(activeEmployees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      // Fallback sample data
      setEmployees([]);
    }
  };

  // Filter employees based on search
  const filteredEmployees = employees.filter(emp => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(searchLower) ||
      emp.email?.toLowerCase().includes(searchLower) ||
      emp.employeeId?.toLowerCase().includes(searchLower) ||
      emp.department?.toLowerCase().includes(searchLower)
    );
  });

  // Handle employee selection
  const handleEmployeeToggle = (employeeId) => {
    setFormData(prev => ({
      ...prev,
      selectedEmployees: prev.selectedEmployees.includes(employeeId)
        ? prev.selectedEmployees.filter(e => e !== employeeId)
        : [...prev.selectedEmployees, employeeId]
    }));
  };

  // Handle select all employees
  const handleSelectAllEmployees = () => {
    const allSelected = formData.selectedEmployees.length === filteredEmployees.length;
    setFormData(prev => ({
      ...prev,
      selectedEmployees: allSelected ? [] : filteredEmployees.map(emp => emp.id)
    }));
  };

  // Get selected employee names for display
  const getSelectedEmployeeNames = () => {
    if (formData.selectedEmployees.length === 0) return 'Select Employees';
    if (formData.selectedEmployees.length === 1) {
      const emp = employees.find(e => e.id === formData.selectedEmployees[0]);
      return emp?.name || 'Unknown Employee';
    }
    return `${formData.selectedEmployees.length} employees selected`;
  };

  // Validate form
  const validateForm = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Don't allow future months or years
    if (formData.year > currentYear) {
      return { isValid: false, message: 'Cannot generate payslips for future years' };
    }

    if (formData.year === currentYear && formData.month > currentMonth) {
      return { isValid: false, message: 'Cannot generate payslips for future months' };
    }

    if (formData.selectedEmployees.length === 0) {
      return { isValid: false, message: 'Please select at least one employee' };
    }

    return { isValid: true };
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateForm();
    if (!validation.isValid) {
      console.log('Validation failed:', validation.message);
      return;
    }

    // Prepare payload for API - removed cutoffDate
   const payload = {
    month: formData.month,        // API expects 'month' (number 1-12)
    year: formData.year,          // API expects 'year' 
    employeeIds: formData.selectedEmployees,
    options: {
      includeDeductions: formData.includeDeductions,
      includeBonuses: formData.includeBonuses,
      includeOvertime: formData.includeOvertime,
      includeAttendance: formData.includeAttendance
    }
  };

    console.log('🚀 Generating payslips with payload:', payload);
    onGenerate(payload);
  };

  if (!isOpen) return null;

  const validation = validateForm();
  const selectedMonth = months.find(m => m.value === formData.month);

  return (
    <div className="payslip-generation-container">
      <div className="generation-header">
        <div>
          <h3>💼 Generate Employee Payslips</h3>
          <p>Configure payroll parameters and generate payslips for selected period</p>
        </div>
        <button className="close-btn" onClick={onClose} title="Close">✕</button>
      </div>

      <form onSubmit={handleSubmit} className="generation-form">
        {/* Payroll Period Configuration */}
        <div className="form-section">
          <h4>📅 Payroll Period</h4>
          <div className="period-controls">
            <div className="input-group">
              <label htmlFor="year">Financial Year</label>
              <select
                id="year"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="form-select"
                required
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 4 + i; // Show last 4 years + current year
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="month">Pay Period</label>
              <select
                id="month"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                className="form-select"
                required
              >
                {months.map(month => {
                  const currentDate = new Date();
                  const currentYear = currentDate.getFullYear();
                  const currentMonth = currentDate.getMonth() + 1;

                  // Disable future months in current year, and all months in future years
                  const isDisabled = (formData.year === currentYear && month.value > currentMonth) ||
                    (formData.year > currentYear);

                  return (
                    <option
                      key={month.value}
                      value={month.value}
                      disabled={isDisabled}
                    >
                      {month.name} {formData.year} {isDisabled ? '(Future)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Fixed Monthly Period Display */}
            <div className="input-group">
              <label>Pay Frequency</label>
              <div className="fixed-frequency">
                📅 Monthly Payroll
              </div>
            </div>
          </div>

          {/* Period Info Display */}
          <div className={`period-info ${!validation.isValid ? 'error' : 'success'}`}>
            <div className="period-summary">
              <span>📊 <strong>Period:</strong> {selectedMonth?.name} {formData.year}</span>
              <span>💼 <strong>Frequency:</strong> {payPeriodTypes.find(p => p.value === formData.payPeriodType)?.name}</span>
            </div>
            {!validation.isValid && (
              <div className="validation-error">
                ⚠️ {validation.message}
              </div>
            )}
          </div>
        </div>

        {/* Employee Multi-Select Dropdown */}
        <div className="form-section">
          <h4>👥 Employee Selection</h4>
          <div className="employee-selector">
            <div className="dropdown-container">
              <button
                type="button"
                className="dropdown-trigger"
                onClick={() => setEmployeeDropdownOpen(!employeeDropdownOpen)}
              >
                <span className="selected-text">{getSelectedEmployeeNames()}</span>
                <span className="dropdown-icon">
                  {employeeDropdownOpen ? '▲' : '▼'}
                </span>
              </button>

              {employeeDropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <input
                      type="text"
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                    <button
                      type="button"
                      className="select-all-btn"
                      onClick={handleSelectAllEmployees}
                    >
                      {formData.selectedEmployees.length === filteredEmployees.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="employee-options">
                    {filteredEmployees.length === 0 ? (
                      <div className="no-employees">No employees found</div>
                    ) : (
                      filteredEmployees.map(employee => (
                        <label key={employee.id} className="employee-option">
                          <input
                            type="checkbox"
                            checked={formData.selectedEmployees.includes(employee.id)}
                            onChange={() => handleEmployeeToggle(employee.id)}
                          />
                          <div className="employee-info">
                            <div className="employee-primary">
                              <span className="employee-name">{employee.name}</span>
                              <span className="employee-id">#{employee.employeeId}</span>
                            </div>
                            <div className="employee-secondary">
                              <span className="department">{employee.department}</span>
                              <span className="position">{employee.position}</span>
                            </div>
                            <div className="employee-email">{employee.email}</div>
                            {employee.salary > 0 && (
                              <div className="employee-salary">₹{employee.salary.toLocaleString()}/month</div>
                            )}
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {formData.selectedEmployees.length > 0 && (
              <div className="selected-summary">
                <span className="summary-count">{formData.selectedEmployees.length} employee(s) selected</span>
                <button
                  type="button"
                  className="clear-selection"
                  onClick={() => setFormData({ ...formData, selectedEmployees: [] })}
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Payslip Components */}
        <div className="form-section">
          <h4>⚙️ Payslip Components</h4>
          <div className="components-grid">
            <label className="component-option">
              <input
                type="checkbox"
                checked={formData.includeAttendance}
                onChange={(e) => setFormData({ ...formData, includeAttendance: e.target.checked })}
              />
              <div className="component-info">
                <span className="component-title">📊 Attendance Data</span>
                <span className="component-desc">Working days, present days, leave days</span>
              </div>
            </label>

            <label className="component-option">
              <input
                type="checkbox"
                checked={formData.includeDeductions}
                onChange={(e) => setFormData({ ...formData, includeDeductions: e.target.checked })}
              />
              <div className="component-info">
                <span className="component-title">💸 Statutory Deductions</span>
                <span className="component-desc">PF, ESI, TDS, Professional Tax</span>
              </div>
            </label>

            <label className="component-option">
              <input
                type="checkbox"
                checked={formData.includeBonuses}
                onChange={(e) => setFormData({ ...formData, includeBonuses: e.target.checked })}
              />
              <div className="component-info">
                <span className="component-title">🎁 Bonuses & Incentives</span>
                <span className="component-desc">Performance bonus, festival bonus</span>
              </div>
            </label>

            <label className="component-option">
              <input
                type="checkbox"
                checked={formData.includeOvertime}
                onChange={(e) => setFormData({ ...formData, includeOvertime: e.target.checked })}
              />
              <div className="component-info">
                <span className="component-title">⏰ Overtime Pay</span>
                <span className="component-desc">Extra hours and overtime calculations</span>
              </div>
            </label>
          </div>
        </div>

        {/* Generation Summary */}
        {formData.selectedEmployees.length > 0 && (
          <div className="generation-summary">
            <h4>📋 Generation Summary</h4>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Pay Period</span>
                <span className="summary-value">{selectedMonth?.name} {formData.year}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Selected Employees</span>
                <span className="summary-value">{formData.selectedEmployees.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Pay Frequency</span>
                <span className="summary-value">{payPeriodTypes.find(p => p.value === formData.payPeriodType)?.name}</span>
              </div>
              <div className="summary-item total">
                <span className="summary-label">Total Payslips</span>
                <span className="summary-value">{formData.selectedEmployees.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            ❌ Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={!validation.isValid || loading}
          >
            {loading ? (
              <>⏳ Generating...</>
            ) : (
              <>🚀 Generate {formData.selectedEmployees.length} Payslip{formData.selectedEmployees.length !== 1 ? 's' : ''}</>
            )}
          </button>
        </div>
      </form>

      <style jsx>{`
        .payslip-generation-container {
          margin-top: 20px;
          padding: 32px;
          border: 2px solid #007bff;
          border-radius: 16px;
          background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
          box-shadow: 0 12px 35px rgba(0, 123, 255, 0.15);
          animation: slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          max-width: 1000px;
          margin-left: auto;
          margin-right: auto;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .generation-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          padding-bottom: 20px;
          border-bottom: 3px solid #e3f2fd;
        }

        .generation-header h3 {
          margin: 0;
          color: #1976d2;
          font-size: 1.8rem;
          font-weight: 700;
        }

        .generation-header p {
          margin: 8px 0 0 0;
          color: #666;
          font-size: 1rem;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #666;
          padding: 12px;
          border-radius: 50%;
          transition: all 0.3s;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          background: rgba(220, 53, 69, 0.1);
          color: #dc3545;
          transform: rotate(90deg);
        }

        .form-section {
          margin-bottom: 32px;
          padding: 28px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          border: 1px solid #e9ecef;
        }

        .form-section h4 {
          margin: 0 0 24px 0;
          color: #333;
          font-size: 1.3rem;
          font-weight: 600;
          border-bottom: 2px solid #f1f3f4;
          padding-bottom: 12px;
        }

        .period-controls {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
        }

        .input-group label {
          margin-bottom: 8px;
          font-weight: 600;
          color: #555;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-select {
          padding: 14px 16px;
          border: 2px solid #dee2e6;
          border-radius: 8px;
          font-size: 15px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .form-select:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0,123,255,0.25);
        }

        .period-info {
          background: linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%);
          border: 2px solid #28a745;
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
        }

        .period-info.error {
          background: linear-gradient(135deg, #ffe6e6 0%, #fff0f0 100%);
          border-color: #dc3545;
        }

        .period-summary {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }

        .validation-error {
          color: #dc3545;
          font-weight: 600;
          font-size: 14px;
          margin-top: 8px;
        }

        .employee-selector {
          position: relative;
        }

        .dropdown-container {
          position: relative;
          width: 100%;
        }

        .dropdown-trigger {
          width: 100%;
          padding: 16px;
          border: 2px solid #dee2e6;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 15px;
          transition: all 0.3s ease;
        }

        .dropdown-trigger:hover {
          border-color: #007bff;
        }

        .dropdown-trigger:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0,123,255,0.25);
        }

        .selected-text {
          color: #333;
          font-weight: 500;
        }

        .dropdown-icon {
          color: #666;
          transition: transform 0.3s ease;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 2px solid #007bff;
          border-radius: 8px;
          box-shadow: 0 8px 25px rgba(0, 123, 255, 0.2);
          z-index: 1000;
          max-height: 400px;
          overflow: hidden;
          animation: dropdownSlide 0.3s ease;
        }

        @keyframes dropdownSlide {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-header {
          padding: 16px;
          border-bottom: 1px solid #e9ecef;
          background: #f8f9fa;
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .search-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .select-all-btn {
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
        }

        .select-all-btn:hover {
          background: #0056b3;
        }

        .employee-options {
          max-height: 300px;
          overflow-y: auto;
          padding: 8px;
        }

        .employee-option {
          display: flex;
          align-items: flex-start;
          padding: 12px;
          cursor: pointer;
          border-radius: 6px;
          transition: background-color 0.2s;
          gap: 12px;
        }

        .employee-option:hover {
          background: #f8f9fa;
        }

        .employee-option input[type="checkbox"] {
          margin-top: 4px;
          transform: scale(1.2);
        }

        .employee-info {
          flex: 1;
        }

        .employee-primary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .employee-name {
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }

        .employee-id {
          background: #f1f3f4;
          color: #666;
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
        }

        .employee-secondary {
          display: flex;
          gap: 8px;
          margin-bottom: 4px;
        }

        .department {
          background: #e3f2fd;
          color: #1976d2;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 500;
        }

        .position {
          background: #f3e5f5;
          color: #7b1fa2;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 500;
        }

        .employee-email {
          font-size: 12px;
          color: #666;
          margin-bottom: 2px;
        }

        .employee-salary {
          font-size: 12px;
          color: #28a745;
          font-weight: 600;
        }

        .no-employees {
          text-align: center;
          padding: 20px;
          color: #666;
          font-style: italic;
        }

        .selected-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
          padding: 12px;
          background: #e8f5e8;
          border-radius: 6px;
          border: 1px solid #28a745;
        }

        .summary-count {
          color: #155724;
          font-weight: 600;
          font-size: 14px;
        }

        .clear-selection {
          background: #dc3545;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }

        .clear-selection:hover {
          background: #c82333;
        }

        .components-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .component-option {
          display: flex;
          align-items: flex-start;
          padding: 20px;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
          user-select: none;
        }

        .component-option:hover {
          border-color: #007bff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,123,255,0.15);
        }

        .component-option input[type="checkbox"] {
          margin-right: 16px;
          margin-top: 2px;
          transform: scale(1.3);
        }

        .component-info {
          flex: 1;
        }

        .component-title {
          display: block;
          font-weight: 600;
          margin-bottom: 4px;
          font-size: 15px;
        }

        .component-desc {
          display: block;
          font-size: 13px;
          color: #666;
          line-height: 1.4;
        }

        .generation-summary {
          background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
          border: 2px solid #ffc107;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 32px;
        }

        .generation-summary h4 {
          margin: 0 0 20px 0;
          color: #f57c00;
          border-bottom-color: #ffcc02;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
        }

        .summary-item {
          text-align: center;
          padding: 16px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .summary-item.total {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          transform: scale(1.05);
        }

        .summary-label {
          display: block;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .summary-value {
          display: block;
          font-size: 20px;
          font-weight: bold;
        }

        .form-actions {
          display: flex;
          gap: 20px;
          justify-content: flex-end;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 3px solid #e9ecef;
        }

        .btn-primary {
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          box-shadow: 0 6px 20px rgba(0,123,255,0.3);
          min-width: 200px;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0,123,255,0.4);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          background: #545b62;
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .payslip-generation-container {
            padding: 20px;
            margin-top: 16px;
          }

          .generation-header {
            flex-direction: column;
            gap: 16px;
            margin-bottom: 24px;
          }

          .period-controls {
            grid-template-columns: 1fr;
          }

          .components-grid {
            grid-template-columns: 1fr;
          }

          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .form-actions {
            flex-direction: column;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
          }

          .period-summary {
            flex-direction: column;
            gap: 8px;
          }

          .dropdown-header {
            flex-direction: column;
            align-items: stretch;
          }

          .search-input {
            margin-bottom: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default PayslipGenerationForm;