import React from 'react';

export default function CTCHistoryTable({ ctcHistory, onEdit }) {
  if (!ctcHistory || ctcHistory.length === 0) {
    return (
      <div className="no-data">
        <p>No CTC history found for this employee.</p>
      </div>
    );
  }

  return (
    <div className="ctc-history-table">
      <table className="data-table">
        <thead>
          <tr>
            <th>Effective From</th>
            <th>Basic Salary</th>
            <th>HRA</th>
            <th>Allowances</th>
            <th>Total CTC</th>
            <th>Created On</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {ctcHistory.map((ctc, index) => (
            <tr key={ctc.ctcId || index}>
              <td>{new Date(ctc.effectiveFrom).toLocaleDateString()}</td>
              <td>₹{ctc.basicSalary?.toLocaleString()}</td>
              <td>₹{ctc.hra?.toLocaleString()}</td>
              <td>₹{ctc.allowances?.toLocaleString()}</td>
              <td className="total-ctc">₹{ctc.totalCtc?.toLocaleString()}</td>
              <td>{new Date(ctc.createdAt).toLocaleDateString()}</td>
              <td>
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => onEdit(ctc)}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}