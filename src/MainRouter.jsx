import React from 'react';
import { Routes, Route } from 'react-router-dom';
import App from './App';
import UnifiedDemo from './UnifiedDemo';

/**
 * Main App Router - DEPRECATED
 * This file is no longer used. Routing is now handled in App.js with /payflow-ai routes.
 */
function MainRouter() {
  return (
    <Routes>
      {/* Demo route for testing unified components */}
      <Route path="/demo" element={<UnifiedDemo />} />
      
      {/* All other routes handled by original App */}
      <Route path="/*" element={<App />} />
    </Routes>
  );
}

export default MainRouter;
