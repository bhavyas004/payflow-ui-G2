import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import '../styles/App.css';

const CollapsibleSidebar = forwardRef(({ children, logo }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useImperativeHandle(ref, () => ({
    toggleSidebar,
    isMobile,
    isOpen
  }));

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setIsOpen(false); // Close mobile menu when switching to desktop
      }
    };

    handleResize(); // Check initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Sidebar Overlay (only on mobile when open) */}
      {isMobile && (
        <div 
          className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Close button for mobile */}
        {isMobile && (
          <button 
            className="absolute top-4 right-4 text-white text-xl font-bold bg-transparent border-none cursor-pointer z-10"
            onClick={closeSidebar}
            aria-label="Close navigation menu"
          >
            ✕
          </button>
        )}
        
        <div className="sidebar-logo">{logo}</div>
        <nav onClick={isMobile ? closeSidebar : undefined}>
          {children}
        </nav>
      </aside>
    </>
  );
});

export default CollapsibleSidebar;
