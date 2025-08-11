import React from 'react';
import '../styles/App.css';

const SummaryCard = ({ title, value, onClick, actionable }) => (
  <div 
    className={`summary-card${actionable ? ' actionable' : ''}`} 
    onClick={onClick}
    style={{ 
      height: '120px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center'
    }}
  >
    <div className="summary-card-title">{title}</div>
    <div className="summary-card-value">{value}</div>
  </div>
);

export default SummaryCard; 