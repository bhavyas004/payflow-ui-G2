import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import UnifiedAppRouter from './UnifiedAppRouter';
import './shared/styles/unified.css';

/**
 * Demo Test Page for Unified Components
 * This handles the routing for the new unified architecture
 */
function UnifiedDemo() {
  const [showDemo, setShowDemo] = useState(false);
  const location = useLocation();

  // Check if we're in a nested demo route
  const isInDemoRoute = location.pathname.startsWith('/payflow-ai/');

  if (showDemo || isInDemoRoute) {
    return (
      <Routes>
        <Route path="/*" element={<UnifiedAppRouter />} />
      </Routes>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '3rem',
        maxWidth: '600px',
        textAlign: 'center',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '800', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '1rem'
        }}>
          🚀 PayFlow-AI Interface
        </h1>
        
        <p style={{ 
          fontSize: '1.125rem', 
          color: '#64748b', 
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          Welcome to PayFlow-AI! The intelligent, unified payroll management system with 
          AI-powered features, role-based functionality, and enhanced user experience.
        </p>

        <div style={{
          background: '#f8fafc',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          textAlign: 'left'
        }}>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600', 
            color: '#1e293b',
            marginBottom: '1rem'
          }}>
            ✨ New Features:
          </h3>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0, 
            margin: 0,
            fontSize: '0.875rem',
            color: '#64748b'
          }}>
            <li style={{ marginBottom: '0.5rem' }}>🎯 <strong>Role-Based Navigation:</strong> Smart sidebar adapts to user permissions</li>
            <li style={{ marginBottom: '0.5rem' }}>🤖 <strong>AI-Powered Insights:</strong> Intelligent analytics and recommendations</li>
            <li style={{ marginBottom: '0.5rem' }}>🔧 <strong>Unified Components:</strong> Single codebase for all user types</li>
            <li style={{ marginBottom: '0.5rem' }}>⚡ <strong>Enhanced Performance:</strong> 50-60% code reduction</li>
            <li style={{ marginBottom: '0.5rem' }}>🎨 <strong>Consistent UI/UX:</strong> Modern design system</li>
            <li>📱 <strong>Responsive Design:</strong> Works seamlessly on all devices</li>
          </ul>
        </div>

        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          fontSize: '0.875rem',
          color: '#1e40af'
        }}>
          <strong>ℹ️ Testing Note:</strong> The original application remains fully functional. 
          This is a parallel implementation for testing and validation.
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={() => setShowDemo(true)}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              🚀 Launch PayFlow-AI
            </button>          <button
            onClick={() => window.location.href = '/'}
            style={{
              background: 'white',
              color: '#64748b',
              border: '1px solid #e2e8f0',
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#f8fafc';
              e.target.style.borderColor = '#cbd5e1';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#e2e8f0';
            }}
          >
            ← Back to Original
          </button>
        </div>

        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem',
          background: '#fef3c7',
          borderRadius: '8px',
          fontSize: '0.75rem',
          color: '#92400e'
        }}>
          <strong>⚠️ Development Status:</strong> This is the new unified architecture implementation. 
          Please test thoroughly and report any issues before we proceed with the migration.
        </div>
      </div>
    </div>
  );
}

export default UnifiedDemo;
