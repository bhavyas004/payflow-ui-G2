import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function CTCForm({ employee, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    basicSalary: '',
    hra: '',
    allowances: '',
    bonuses: '',
    pfContribution: '',
    gratuity: '',
    effectiveFrom: new Date().toISOString().split('T')[0]
  });
  const [totalCTC, setTotalCTC] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Calculate total CTC whenever form data changes
    const total = Object.keys(formData)
      .filter(key => key !== 'effectiveFrom')
      .reduce((sum, key) => sum + (parseFloat(formData[key]) || 0), 0);
    setTotalCTC(total);
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('jwtToken');
      const ctcData = {
        employeeId: employee.id,
        ...formData,
        totalCtc: totalCTC
      };

      await axios.post('/payflowapi/ctc/add', ctcData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('CTC saved successfully!');
      onSave();
    } catch (error) {
      console.error('Error saving CTC:', error);
      alert('Failed to save CTC. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content ctc-form-modal">
        <div className="modal-header">
          <h3>Add/Update CTC for {employee.fullName}</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="ctc-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Basic Salary (₹)</label>
              <input
                type="number"
                name="basicSalary"
                value={formData.basicSalary}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>HRA (₹)</label>
              <input
                type="number"
                name="hra"
                value={formData.hra}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Allowances (₹)</label>
              <input
                type="number"
                name="allowances"
                value={formData.allowances}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Bonuses (₹)</label>
              <input
                type="number"
                name="bonuses"
                value={formData.bonuses}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>PF Contribution (₹)</label>
              <input
                type="number"
                name="pfContribution"
                value={formData.pfContribution}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Gratuity (₹)</label>
              <input
                type="number"
                name="gratuity"
                value={formData.gratuity}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group full-width">
              <label>Effective From</label>
              <input
                type="date"
                name="effectiveFrom"
                value={formData.effectiveFrom}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group full-width total-ctc">
              <label>Total CTC</label>
              <div className="total-amount">₹{totalCTC.toLocaleString()}</div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : 'Save CTC'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}