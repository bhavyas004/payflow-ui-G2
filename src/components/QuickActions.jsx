import React from 'react';
import '../styles/App.css';

const QuickActions = ({ onAddEmployee, onImportBulk, onAddHRManager }) => (
  <div className="card">
    <div className="card-content">
      <h3 className="mb-4 font-semibold">Quick Actions</h3>
      <div className="flex flex-col gap-3">
        <button className="btn btn-primary" onClick={onAddEmployee}>
          ➕ Add New Employee
        </button>
        <button className="btn btn-secondary" onClick={onImportBulk}>
          📥 Import Bulk Employees
        </button>
        <button className="btn btn-secondary" onClick={onAddHRManager}>
          👤 Add New HR/Manager
        </button>
      </div>
    </div>
  </div>
);

export default QuickActions; 