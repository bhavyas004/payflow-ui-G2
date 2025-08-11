import React, { useState, useEffect } from 'react';
import { useGlobalModal } from '../components/modals/ModalProvider';
import PayslipGenerationForm from '../components/PayslipGenerationForm';
import axios from 'axios';

export default function EmployeePayslips() {
  const { showAlert } = useGlobalModal();
  const [showGenerationForm, setShowGenerationForm] = useState(false);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGeneratePayslips = () => {
    setShowGenerationForm(true);
  };

  const handleCloseGenerationForm = () => {
    setShowGenerationForm(false);
  };

  const handleGenerateConfirm = async (payload) => {
    setLoading(true);
    setShowGenerationForm(false);

    try {
      const token = sessionStorage.getItem('jwtToken');
      
      console.log('🚀 Received payload from form:', payload);

      const response = await axios.post('/payflowapi/payroll/payslips/generate', payload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        await showAlert({
          title: 'Payslips Generated Successfully!',
          message: `Generated payslips for ${payload.employeeIds?.length || 0} employees successfully.`,
          variant: 'success',
          autoClose: true,
          autoCloseDelay: 3000
        });
        
        // Refresh payslips list
        fetchPayslips();
      }
    } catch (error) {
      console.error('Error generating payslips:', error);
      await showAlert({
        title: 'Generation Failed',
        message: `Failed to generate payslips: ${error.response?.data?.message || error.message}`,
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPayslips = async () => {
    try {
      const token = sessionStorage.getItem('jwtToken');
      const response = await axios.get('/payflowapi/payslips', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayslips(response.data.payslips || []);
    } catch (error) {
      console.error('Error fetching payslips:', error);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, []);

  return (
    <div className="payslips-container">
      {/* Header */}
      <div className="payslips-header">
        <div>
          <h2>💰 Employee Payslips</h2>
          <p>Generate and manage employee payslips</p>
        </div>
        <button 
          className="btn-primary"
          onClick={handleGeneratePayslips}
          disabled={loading || showGenerationForm}
        >
          {loading ? '⏳ Generating...' : '📊 Generate Payslips'}
        </button>
      </div>

      {/* Generation Form */}
      <PayslipGenerationForm 
        isOpen={showGenerationForm}
        onClose={handleCloseGenerationForm}
        onGenerate={handleGenerateConfirm}
      />

      {/* Existing Payslips */}
      <div className="payslips-content">
        {/* Your existing payslips list here */}
      </div>
    </div>
  );
}