import React, { createContext, useContext, useState } from 'react';
import ConfirmModal from './ConfirmModal';
import AlertModal from './AlertModal';

const ModalContext = createContext();

export const useGlobalModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useGlobalModal must be used within ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    config: {}
  });

  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    config: {}
  });

  const showConfirm = (config) => {
    return new Promise((resolve) => {
      setConfirmModal({
        isOpen: true,
        config: {
          ...config,
          onConfirm: () => {
            setConfirmModal({ isOpen: false, config: {} });
            resolve(true);
          },
          onClose: () => {
            setConfirmModal({ isOpen: false, config: {} });
            resolve(false);
          }
        }
      });
    });
  };

  const showAlert = (config) => {
    return new Promise((resolve) => {
      setAlertModal({
        isOpen: true,
        config: {
          ...config,
          onClose: () => {
            setAlertModal({ isOpen: false, config: {} });
            resolve();
          }
        }
      });
    });
  };

  const hideConfirm = () => {
    setConfirmModal({ isOpen: false, config: {} });
  };

  const hideAlert = () => {
    setAlertModal({ isOpen: false, config: {} });
  };

  return (
    <ModalContext.Provider value={{
      showConfirm,
      showAlert,
      hideConfirm,
      hideAlert
    }}>
      {children}
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        {...confirmModal.config}
      />
      
      <AlertModal
        isOpen={alertModal.isOpen}
        {...alertModal.config}
      />
    </ModalContext.Provider>
  );
};