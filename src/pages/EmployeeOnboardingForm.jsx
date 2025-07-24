import React, { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import axios from 'axios';
import '../styles/App.css';

const EmployeeOnboardingForm = () => {
  const [form, setForm] = useState({
    fullName: "",
    age: "",
    totalExperience: "",
    pastExperience: "",
    status: "ACTIVE",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('jwtToken');
      await axios.post('/payflowapi/employee/create', form, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      alert("Employee Onboarded: " + form.fullName);
      setForm({
        fullName: "",
        age: "",
        totalExperience: "",
        pastExperience: "",
        status: "ACTIVE",
      });
    } catch (error) {
      alert('Employee onboarding failed: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <DashboardLayout title="Employee Onboarding">
      <div className="onboarding-container">
        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Age</label>
            <input
              name="age"
              type="number"
              value={form.age}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Total Experience</label>
            <input
              name="totalExperience"
              type="text"
              value={form.totalExperience}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Past Experience (optional)</label>
            <textarea
              name="pastExperience"
              value={form.pastExperience}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              required
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <button type="submit">Onboard Employee</button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeOnboardingForm;
