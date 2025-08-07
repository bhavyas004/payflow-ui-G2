import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import '../../styles/Modal.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'medium',
  closeOnOverlay = true,
  closeOnEsc = true,
  showCloseButton = true,
  className = '',
  zIndex = 1000
}) => {
  useEffect(() => {
    if (!isOpen) return;

    // Handle ESC key
    const handleEsc = (e) => {
      if (e.key === 'Escape' && closeOnEsc) {
        onClose();
      }
    };

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose, closeOnEsc]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlay) {
      onClose();
    }
  };

  const modalContent = (
    <div 
      className={`modal-overlay ${className}`} 
      onClick={handleOverlayClick}
      style={{ zIndex }}
    >
      <div className={`modal-container modal-${size}`}>
        {(title || showCloseButton) && (
          <div className="modal-header">
            {title && <h3 className="modal-title">{title}</h3>}
            {showCloseButton && (
              <button 
                className="modal-close-btn" 
                onClick={onClose}
                aria-label="Close modal"
              >
                ✕
              </button>
            )}
          </div>
        )}
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );

  // Render modal in portal
  return ReactDOM.createPortal(
    modalContent,
    document.body
  );
};

export default Modal;