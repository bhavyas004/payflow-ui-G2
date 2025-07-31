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
    manager: '', // Add manager field
    experiences: [
      { companyName: '', startDate: '', endDate: '' }
    ],
  });
  
  const [managers, setManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(true);

  // Fetch available managers when component mounts
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const token = localStorage.getItem('jwtToken');
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

    fetchManagers();
  }, []);

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

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('jwtToken');
      // Prepare payload for backend
      const payload = {
        fullName: formData.full_name,
        age: Number(formData.age),
        email: formData.email,
        password: formData.password,
        status: formData.status,
        manager: formData.manager, // Include manager in payload
        experiences: formData.experiences
      };
      await axios.post('/payflowapi/onboard-employee/add', payload, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      alert('Employee onboarded successfully!');
      setFormData({
        full_name: '',
        age: '',
        email: '',
        password: '',
        status: 'ACTIVE',
        manager: '', // Reset manager field
        experiences: [{ companyName: '', startDate: '', endDate: '' }]
      });
      navigate('/hr-dashboard');
    } catch (error) {
      alert('Employee onboarding failed: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="onboarding-form-container" style={{
      maxWidth: '480px',
      margin: '2rem auto',
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
      padding: '2rem',
      position: 'relative',
    }}>
      <h2 style={{textAlign: 'center', marginBottom: '1.5rem', color: '#2563eb'}}>Employee Onboarding</h2>
      <form onSubmit={handleSubmit} className="onboarding-form">
        <div className="form-group" style={{marginBottom: '1.2rem'}}>
          <label htmlFor="full_name" style={{fontWeight: 600}}>Employee Name</label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            placeholder="Enter employee name"
            value={formData.full_name}
            onChange={handleChange}
            required
            className="form-input"
            style={{width: '100%', padding: '0.7rem', borderRadius: '6px', border: '1px solid #d1d5db', marginTop: '0.3rem'}}
          />
        </div>
        {/* Email */}
        <div className="form-group" style={{marginBottom: '1.2rem'}}>
          <label htmlFor="email" style={{fontWeight: 600}}>Email</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter employee email"
            value={formData.email}
            onChange={handleChange}
            required
            className="form-input"
            style={{width: '100%', padding: '0.7rem', borderRadius: '6px', border: '1px solid #d1d5db', marginTop: '0.3rem'}}
          />
        </div>
        {/* Password */}
        <div className="form-group" style={{marginBottom: '1.2rem'}}>
          <label htmlFor="password" style={{fontWeight: 600}}>Password</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Enter employee password"
            value={formData.password}
            onChange={handleChange}
            required
            className="form-input"
            style={{width: '100%', padding: '0.7rem', borderRadius: '6px', border: '1px solid #d1d5db', marginTop: '0.3rem'}}
          />
        </div>
        {/* Manager Dropdown */}
        <div className="form-group" style={{marginBottom: '1.2rem'}}>
          <label htmlFor="manager" style={{fontWeight: 600}}>Assign Manager</label>
          {loadingManagers ? (
            <div style={{padding: '0.7rem', color: '#666', fontStyle: 'italic'}}>Loading managers...</div>
          ) : (
            <>
              <select
                id="manager"
                name="manager"
                value={formData.manager}
                onChange={handleChange}
                className="form-input"
                style={{width: '100%', padding: '0.7rem', borderRadius: '6px', border: '1px solid #d1d5db', marginTop: '0.3rem'}}
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
              {managers.length === 0 && (
                <div style={{color: '#f44336', fontSize: '0.9rem', marginTop: '0.3rem'}}>
                  No managers found. Check console for errors.
                </div>
              )}
            </>
          )}
          <small style={{color: '#666', fontSize: '0.9rem', marginTop: '0.3rem', display: 'block'}}>
            If no manager is selected, one will be automatically assigned based on workload.
          </small>
        </div>
        <div className="form-group" style={{marginBottom: '1.2rem'}}>
          <label htmlFor="age" style={{fontWeight: 600}}>Age</label>
          <input
            type="number"
            id="age"
            name="age"
            placeholder="Enter age"
            value={formData.age}
            onChange={handleChange}
            required
            className="form-input"
            style={{width: '100%', padding: '0.7rem', borderRadius: '6px', border: '1px solid #d1d5db', marginTop: '0.3rem'}}
          />
        </div>
        <div className="form-group" style={{marginBottom: '1.2rem'}}>
          <label style={{fontWeight: 600}}>Experience</label>
          {formData.experiences.map((exp, idx) => (
            <div key={idx} style={{marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '1rem'}}>
              <input
                type="text"
                name="companyName"
                placeholder="Company Name"
                value={exp.companyName}
                onChange={e => handleExperienceChange(idx, e)}
                required
                style={{width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', marginBottom: '0.5rem'}}
              />
              <input
                type="date"
                name="startDate"
                placeholder="Start Date"
                value={exp.startDate}
                onChange={e => handleExperienceChange(idx, e)}
                required
                style={{width: '48%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', marginRight: '4%'}}
              />
              <input
                type="date"
                name="endDate"
                placeholder="End Date"
                value={exp.endDate}
                onChange={e => handleExperienceChange(idx, e)}
                required
                style={{width: '48%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db'}}
              />
              {formData.experiences.length > 1 && (
                <button type="button" style={{marginTop: '0.5rem', background: '#f44336', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.3rem 0.8rem', cursor: 'pointer'}} onClick={() => removeExperience(idx)}>
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" style={{background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.5rem 1rem', cursor: 'pointer'}} onClick={addExperience}>
            + Add Experience
          </button>
        </div>
        <div className="form-group" style={{marginBottom: '1.2rem'}}>
          <label htmlFor="status" style={{fontWeight: 600}}>Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="form-input"
            required
            style={{width: '100%', padding: '0.7rem', borderRadius: '6px', border: '1px solid #d1d5db', marginTop: '0.3rem'}}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem'}}>
          <button type="button" className="login-btn" style={{background: '#f44336', color: '#fff', borderRadius: '6px', padding: '0.7rem 1.5rem', border: 'none', fontWeight: 600, fontSize: '1rem', cursor: 'pointer'}} onClick={() => navigate('/hr-dashboard')}>
            ← Back
          </button>
          <button type="submit" className="login-btn" style={{background: '#2563eb', color: '#fff', borderRadius: '6px', padding: '0.7rem 1.5rem', border: 'none', fontWeight: 600, fontSize: '1rem', cursor: 'pointer'}}>
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeOnboardingForm;