import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const EmployeeOnboardingForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    email: '',
    password: '',
    status: 'ACTIVE',
    manager: '',
    experiences: [
      { companyName: '', startDate: '', endDate: '' }
    ],
  });
  
  const [managers, setManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(true);
  const [userRole, setUserRole] = useState(null);

  // Determine user role and fetch managers
  useEffect(() => {
    const token = sessionStorage.getItem('jwtToken');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        setUserRole(payload.role || 'EMPLOYEE');
      } catch (e) {
        console.error('Error parsing JWT token:', e);
      }
    }

    fetchManagers();
  }, []);

  // Fetch available managers when component mounts
  const fetchManagers = async () => {
    try {
      const token = sessionStorage.getItem('jwtToken');
      console.log('Fetching managers with token:', token ? 'Token exists' : 'No token');
      
      const response = await axios.get('/payflowapi/managers/available', {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      
      console.log('Manager API Response:', response.data);
      
      if (response.data.success) {
        console.log('Managers data:', response.data.data);
        setManagers(response.data.data || []);
      } else {
        console.error('Failed to fetch managers:', response.data.error);
        setManagers([]);
      }
    } catch (error) {
      console.error('Error fetching managers:', error);
      console.error('Error response:', error.response?.data);
      setManagers([]);
    } finally {
      setLoadingManagers(false);
    }
  };

  // Handle main fields
  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle experience fields
  const handleExperienceChange = (idx, e) => {
    const { name, value } = e.target;
    const updatedExperiences = formData.experiences.map((exp, i) =>
      i === idx ? { ...exp, [name]: value } : exp
    );
    setFormData(prev => ({
      ...prev,
      experiences: updatedExperiences,
    }));
  };

  // Add new experience row
  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experiences: [...prev.experiences, { companyName: '', startDate: '', endDate: '' }]
    }));
  };

  // Remove experience row
  const removeExperience = idx => {
    setFormData(prev => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== idx)
    }));
  };

  // Smart back navigation based on user role
  const handleBack = () => {
    switch (userRole) {
      case 'HR':
        navigate('/hr-dashboard');
        break;
      case 'MANAGER':
        navigate('/manager-dashboard');
        break;
      case 'ADMIN':
        navigate('/admin-dashboard');
        break;
      default:
        navigate('/login'); // fallback
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('jwtToken');
      // Prepare payload for backend
      const payload = {
        fullName: formData.full_name,
        age: Number(formData.age),
        email: formData.email,
        password: formData.password,
        status: formData.status,
        manager: formData.manager,
        experiences: formData.experiences
      };
      
      await axios.post('/payflowapi/onboard-employee/add', payload, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      
      alert('Employee onboarded successfully!');
      
      // Reset form
      setFormData({
        full_name: '',
        age: '',
        email: '',
        password: '',
        status: 'ACTIVE',
        manager: '',
        experiences: [{ companyName: '', startDate: '', endDate: '' }]
      });
      
      // Navigate back based on user role
      handleBack();
    } catch (error) {
      alert('Employee onboarding failed: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div className="onboarding-form-container" style={{
        maxWidth: '1000px',
        width: '100%',
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        padding: '2.5rem',
        position: 'relative',
      }}>
        {/* Header with Back Button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <button 
            type="button"
            onClick={handleBack}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '0.5rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              marginRight: '1rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f3f4f6';
              e.target.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'none';
              e.target.style.color = '#6b7280';
            }}
          >
            ←
          </button>
          <div>
            <h2 style={{
              margin: 0,
              color: '#2563eb',
              fontSize: '1.75rem',
              fontWeight: 700
            }}>
              Employee Onboarding
            </h2>
            <p style={{
              margin: '0.25rem 0 0 0',
              color: '#6b7280',
              fontSize: '0.9rem'
            }}>
              Add a new employee to the system
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="onboarding-form">
          {/* Two Column Layout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            
            {/* Left Column */}
            <div>
              {/* Employee Name */}
              <div className="form-group" style={{marginBottom: '1.2rem'}}>
                <label htmlFor="full_name" style={{
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#374151'
                }}>
                  Employee Name *
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  placeholder="Enter employee name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="form-input"
                  style={{
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    border: '2px solid #e5e7eb', 
                    fontSize: '1rem',
                    transition: 'border-color 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Email */}
              <div className="form-group" style={{marginBottom: '1.2rem'}}>
                <label htmlFor="email" style={{
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#374151'
                }}>
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter employee email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="form-input"
                  style={{
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    border: '2px solid #e5e7eb', 
                    fontSize: '1rem',
                    transition: 'border-color 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Password */}
              <div className="form-group" style={{marginBottom: '1.2rem'}}>
                <label htmlFor="password" style={{
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#374151'
                }}>
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Enter employee password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="form-input"
                  style={{
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    border: '2px solid #e5e7eb', 
                    fontSize: '1rem',
                    transition: 'border-color 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Manager Dropdown */}
              <div className="form-group" style={{marginBottom: '1.2rem'}}>
                <label htmlFor="manager" style={{
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#374151'
                }}>
                  Assign Manager
                </label>
                {loadingManagers ? (
                  <div style={{
                    padding: '0.75rem',
                    color: '#6b7280',
                    fontStyle: 'italic',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb'
                  }}>
                    Loading managers...
                  </div>
                ) : (
                  <select
                    id="manager"
                    name="manager"
                    value={formData.manager}
                    onChange={handleChange}
                    className="form-input"
                    style={{
                      width: '100%', 
                      padding: '0.75rem', 
                      borderRadius: '8px', 
                      border: '2px solid #e5e7eb', 
                      fontSize: '1rem',
                      transition: 'border-color 0.2s ease',
                      outline: 'none',
                      background: 'white'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  >
                    <option value="">Select Manager (Optional)</option>
                    {managers.length === 0 ? (
                      <option disabled>No managers available</option>
                    ) : (
                      managers.map((manager) => (
                        <option key={manager.username} value={manager.username}>
                          {manager.fullName || manager.username} ({manager.role}) - {manager.employeeCount} employees
                        </option>
                      ))
                    )}
                  </select>
                )}
                <small style={{
                  color: '#6b7280', 
                  fontSize: '0.875rem', 
                  marginTop: '0.5rem', 
                  display: 'block'
                }}>
                  If no manager is selected, one will be automatically assigned based on workload.
                </small>
              </div>
            </div>

            {/* Right Column */}
            <div>
              {/* Age */}
              <div className="form-group" style={{marginBottom: '1.2rem'}}>
                <label htmlFor="age" style={{
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#374151'
                }}>
                  Age *
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  placeholder="Enter age"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  min="18"
                  max="65"
                  className="form-input"
                  style={{
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    border: '2px solid #e5e7eb', 
                    fontSize: '1rem',
                    transition: 'border-color 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Status */}
              <div className="form-group" style={{marginBottom: '1.2rem'}}>
                <label htmlFor="status" style={{
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#374151'
                }}>
                  Status *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-input"
                  required
                  style={{
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    border: '2px solid #e5e7eb', 
                    fontSize: '1rem',
                    transition: 'border-color 0.2s ease',
                    outline: 'none',
                    background: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              {/* Experience Section */}
              <div className="form-group" style={{marginBottom: '1.2rem'}}>
                <label style={{
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#374151'
                }}>
                  Experience *
                </label>
                <div style={{
                  maxHeight: '250px',
                  overflowY: 'auto',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1rem',
                  background: '#f9fafb'
                }}>
                  {formData.experiences.map((exp, idx) => (
                    <div key={idx} style={{
                      marginBottom: '1rem', 
                      padding: '0.75rem',
                      background: '#fff',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <input
                        type="text"
                        name="companyName"
                        placeholder="Company Name"
                        value={exp.companyName}
                        onChange={e => handleExperienceChange(idx, e)}
                        required
                        style={{
                          width: '100%', 
                          padding: '0.5rem', 
                          borderRadius: '4px', 
                          border: '1px solid #d1d5db', 
                          marginBottom: '0.5rem',
                          fontSize: '0.9rem'
                        }}
                      />
                      <div style={{display: 'flex', gap: '0.5rem', marginBottom: '0.5rem'}}>
                        <div style={{flex: 1}}>
                          <label style={{fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', display: 'block'}}>
                            Start Date
                          </label>
                          <input
                            type="date"
                            name="startDate"
                            value={exp.startDate}
                            onChange={e => handleExperienceChange(idx, e)}
                            required
                            style={{
                              width: '100%', 
                              padding: '0.4rem', 
                              borderRadius: '4px', 
                              border: '1px solid #d1d5db',
                              fontSize: '0.85rem'
                            }}
                          />
                        </div>
                        <div style={{flex: 1}}>
                          <label style={{fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', display: 'block'}}>
                            End Date
                          </label>
                          <input
                            type="date"
                            name="endDate"
                            value={exp.endDate}
                            onChange={e => handleExperienceChange(idx, e)}
                            required
                            style={{
                              width: '100%', 
                              padding: '0.4rem', 
                              borderRadius: '4px', 
                              border: '1px solid #d1d5db',
                              fontSize: '0.85rem'
                            }}
                          />
                        </div>
                      </div>
                      {formData.experiences.length > 1 && (
                        <button 
                          type="button" 
                          style={{
                            background: '#ef4444', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: '4px', 
                            padding: '0.3rem 0.6rem', 
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            transition: 'background-color 0.2s ease'
                          }} 
                          onMouseEnter={(e) => e.target.style.background = '#dc2626'}
                          onMouseLeave={(e) => e.target.style.background = '#ef4444'}
                          onClick={() => removeExperience(idx)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button 
                  type="button" 
                  style={{
                    background: '#10b981', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '6px', 
                    padding: '0.6rem 1rem', 
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    transition: 'background-color 0.2s ease',
                    marginTop: '0.5rem',
                    width: '100%'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#059669'}
                  onMouseLeave={(e) => e.target.style.background = '#10b981'}
                  onClick={addExperience}
                >
                  + Add Another Experience
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
              color: '#fff', 
              borderRadius: '8px', 
              padding: '1rem', 
              border: 'none', 
              fontWeight: 600, 
              fontSize: '1.1rem', 
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
            }}
          >
            Create Employee Account
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmployeeOnboardingForm;