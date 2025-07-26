import React from 'react';
import '../styles/App.css';

const SummaryCard = ({ title, value, onClick, actionable }) => (
  <div className={`summary-card${actionable ? ' actionable' : ''}`} onClick={onClick}>
    <div className="summary-card-title">{title}</div>
    <div className="summary-card-value">{value}</div>
  </div>
);

export default SummaryCard; 