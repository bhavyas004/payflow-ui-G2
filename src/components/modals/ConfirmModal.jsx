import React from 'react';
import Modal from './Modal';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default', // 'default', 'danger', 'warning', 'success'
  loading = false,
  icon = null
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  const getVariantClass = () => {
    switch (variant) {
      case 'danger': return 'confirm-danger';
      case 'warning': return 'confirm-warning';
      case 'success': return 'confirm-success';
      default: return 'confirm-default';
    }
  };

  const getDefaultIcon = () => {
    switch (variant) {
      case 'danger': return '⚠️';
      case 'warning': return '⚡';
      case 'success': return '✅';
      default: return '❓';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      className={`confirm-modal ${getVariantClass()}`}
    >
      <div className="confirm-content">
        <div className="confirm-icon">
          {icon || getDefaultIcon()}
        </div>
        <div className="confirm-message">
          {typeof message === 'string' ? <p>{message}</p> : message}
        </div>
        <div className="confirm-actions">
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button 
            className={`btn btn-${variant === 'danger' ? 'danger' : 'primary'}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;