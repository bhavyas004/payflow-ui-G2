import React from 'react';
import Modal from './Modal';

const AlertModal = ({
  isOpen,
  onClose,
  title = 'Alert',
  message = '',
  variant = 'info', // 'info', 'success', 'warning', 'error'
  buttonText = 'OK',
  icon = null,
  autoClose = false,
  autoCloseDelay = 3000
}) => {
  React.useEffect(() => {
    if (autoClose && isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, isOpen, onClose]);

  const getVariantClass = () => {
    switch (variant) {
      case 'success': return 'alert-success';
      case 'warning': return 'alert-warning';
      case 'error': return 'alert-error';
      default: return 'alert-info';
    }
  };

  const getDefaultIcon = () => {
    switch (variant) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      className={`alert-modal ${getVariantClass()}`}
    >
      <div className="alert-content">
        <div className="alert-icon">
          {icon || getDefaultIcon()}
        </div>
        <div className="alert-message">
          {typeof message === 'string' ? <p>{message}</p> : message}
        </div>
        <div className="alert-actions">
          <button 
            className={`btn btn-${variant === 'error' ? 'danger' : 'primary'}`}
            onClick={onClose}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AlertModal;