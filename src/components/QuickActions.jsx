import React from 'react';
import '../styles/App.css';

const QuickActions = ({ onAddEmployee, onImportBulk, onAddHRManager }) => (
  <div className="quick-actions-panel">
    <button onClick={onAddEmployee}>➕ Add New Employee</button>
    <button onClick={onImportBulk}>📥 Import Bulk Employees</button>
    <button onClick={onAddHRManager}>👤 Add New HR/Manager</button>
  </div>
);

export default QuickActions; 