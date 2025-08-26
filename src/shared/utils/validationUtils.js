/**
 * Shared validation utilities for unified forms
 */

// Username validation - alphanumeric only
export const validateUsername = (username) => {
  const alphanumericRegex = /^[a-zA-Z0-9]+$/;
  if (!username) return 'Username is required';
  if (username.length < 3) return 'Username must be at least 3 characters';
  if (username.length > 20) return 'Username must be less than 20 characters';
  if (!alphanumericRegex.test(username)) return 'Username must contain only letters and numbers';
  return '';
};

// Email validation - standard email pattern
export const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email) return 'Email is required';
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return '';
};

// Password validation - alphanumeric with special characters, min 8 chars (aligned with backend)
export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/(?=.*[a-zA-Z])/.test(password)) return 'Password must contain at least one letter';
  if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one digit';
  if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?])/.test(password)) return 'Password must contain at least one special character';
  return '';
};

// Contact number validation - exactly 10 digits
export const validateContactNumber = (contactNumber) => {
  if (contactNumber && contactNumber.length !== 10) return 'Contact number must be exactly 10 digits';
  return '';
};

// Full name validation
export const validateFullName = (fullName) => {
  const nameRegex = /^[a-zA-Z\s]+$/;
  if (!fullName) return 'Full name is required';
  if (fullName.length < 2) return 'Full name must be at least 2 characters';
  if (fullName.length > 50) return 'Full name must be less than 50 characters';
  if (!nameRegex.test(fullName)) return 'Full name must contain only letters and spaces';
  return '';
};

// Age validation
export const validateAge = (age) => {
  const ageNum = parseInt(age);
  if (!age) return 'Age is required';
  if (isNaN(ageNum)) return 'Age must be a number';
  if (ageNum < 18) return 'Age must be at least 18';
  if (ageNum > 65) return 'Age must be less than 65';
  return '';
};

// Phone number validation (more flexible than contact number)
export const validatePhoneNumber = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  if (phone && !phoneRegex.test(phone)) return 'Phone number must be exactly 10 digits';
  return '';
};

// Employee ID validation
export const validateEmployeeId = (employeeId) => {
  const empIdRegex = /^[A-Z0-9]+$/;
  if (!employeeId) return 'Employee ID is required';
  if (employeeId.length < 3) return 'Employee ID must be at least 3 characters';
  if (employeeId.length > 10) return 'Employee ID must be less than 10 characters';
  if (!empIdRegex.test(employeeId)) return 'Employee ID must contain only uppercase letters and numbers';
  return '';
};

// Salary validation
export const validateSalary = (salary) => {
  const salaryNum = parseFloat(salary);
  if (!salary) return 'Salary is required';
  if (isNaN(salaryNum)) return 'Salary must be a number';
  if (salaryNum < 0) return 'Salary must be positive';
  if (salaryNum > 10000000) return 'Salary must be less than 10,000,000';
  return '';
};

// Department validation
export const validateDepartment = (department) => {
  const deptRegex = /^[a-zA-Z\s]+$/;
  if (!department) return 'Department is required';
  if (department.length < 2) return 'Department must be at least 2 characters';
  if (department.length > 30) return 'Department must be less than 30 characters';
  if (!deptRegex.test(department)) return 'Department must contain only letters and spaces';
  return '';
};

// Generic required field validation
export const validateRequired = (value, fieldName) => {
  if (!value || value.toString().trim() === '') return `${fieldName} is required`;
  return '';
};

// Experience validation functions
export const validateExperienceDate = (dateString, fieldName) => {
  if (!dateString) return `${fieldName} is required`;
  
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Set to end of today

  if (date > today) return `${fieldName} cannot be in the future`;
  return '';
};

export const validateExperienceDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start >= end) return 'End date must be after start date';
  return '';
};

export const validateExperienceOverlap = (experiences, currentIndex) => {
  const currentExp = experiences[currentIndex];
  if (!currentExp.startDate || !currentExp.endDate) return '';
  
  const currentStart = new Date(currentExp.startDate);
  const currentEnd = new Date(currentExp.endDate);
  
  for (let i = 0; i < experiences.length; i++) {
    if (i === currentIndex) continue;
    
    const otherExp = experiences[i];
    if (!otherExp.startDate || !otherExp.endDate) continue;
    
    const otherStart = new Date(otherExp.startDate);
    const otherEnd = new Date(otherExp.endDate);
    
    // Check for overlap
    if (
      (currentStart <= otherEnd && currentEnd >= otherStart) ||
      (otherStart <= currentEnd && otherEnd >= currentStart)
    ) {
      return `Experience dates overlap with ${otherExp.companyName}`;
    }
  }
  
  return '';
};

export const validateAllExperiences = (experiences) => {
  const allErrors = [];
  
  experiences.forEach((exp, index) => {
    const expErrors = [];
    
    // Check company name
    if (!exp.companyName) {
      expErrors.push(`Experience ${index + 1}: Company name is required`);
    }
    
    // Check start date
    const startDateError = validateExperienceDate(exp.startDate, 'Start date');
    if (startDateError) {
      expErrors.push(`Experience ${index + 1}: ${startDateError}`);
    }
    
    // Check end date
    const endDateError = validateExperienceDate(exp.endDate, 'End date');
    if (endDateError) {
      expErrors.push(`Experience ${index + 1}: ${endDateError}`);
    }
    
    // Check date range
    const dateRangeError = validateExperienceDateRange(exp.startDate, exp.endDate);
    if (dateRangeError) {
      expErrors.push(`Experience ${index + 1}: ${dateRangeError}`);
    }
    
    // Check overlap
    const overlapError = validateExperienceOverlap(experiences, index);
    if (overlapError) {
      expErrors.push(`Experience ${index + 1}: ${overlapError}`);
    }
    
    allErrors.push(...expErrors);
  });
  
  return allErrors;
};

// Generic form validation helper
export const validateForm = (formData, validationRules) => {
  const errors = {};
  
  Object.keys(validationRules).forEach(field => {
    const validationFn = validationRules[field];
    if (typeof validationFn === 'function') {
      errors[field] = validationFn(formData[field]);
    }
  });
  
  return {
    errors,
    isValid: !Object.values(errors).some(error => error !== '')
  };
};
