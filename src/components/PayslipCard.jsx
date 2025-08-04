// Update PayslipCard component

export function PayslipCard({ payslip, employeeName, onDownload }) {
  return (
    <div className="payslip-card">
      <div className="payslip-header">
        <h4>{employeeName || `Employee ID: ${payslip.employeeId}`}</h4>
        <span className="payslip-period">{payslip.month} {payslip.year}</span>
      </div>
      <div className="payslip-details">
        <div className="detail-row">
          <span>Net Pay:</span>
          <span className="amount">₹{Number(payslip.netPay || 0).toLocaleString()}</span>
        </div>
        <div className="detail-row">
          <span>Deductions:</span>
          <span className="deduction">₹{Number(payslip.deductions || 0).toLocaleString()}</span>
        </div>
        <div className="detail-row">
          <span>Generated:</span>
          <span>{new Date(payslip.generatedOn).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="payslip-actions">
        <button 
          className="btn btn-primary btn-sm"
          onClick={() => onDownload(payslip)}
          title="Download functionality is being implemented"
        >
          📄 Download
        </button>
        <button 
          className="btn btn-secondary btn-sm"
          onClick={() => alert('View functionality coming soon!')}
        >
          👁️ View
        </button>
      </div>
    </div>
  );
}