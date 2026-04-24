'use client';

import React from 'react';

interface UnsavedChangeModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export default function UnsavedChangeModal({
  isOpen,
  title,
  description,
  confirmText = 'Leave',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  icon
}: UnsavedChangeModalProps) {
  return (
    
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`}>
      <div className="modal">
        
        {icon && <div className="modal-icon">{icon}</div>}
        
        <h3>{title}</h3>
        <p>{description}</p>
        
        <div className="modal-actions">
          <button 
            className="btn-modal-cancel" 
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button 
            className="btn-modal-confirm" 
            onClick={onConfirm}
            disabled={isLoading}
          >
            
            {isLoading && <span className="btn-spinner"></span>}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}