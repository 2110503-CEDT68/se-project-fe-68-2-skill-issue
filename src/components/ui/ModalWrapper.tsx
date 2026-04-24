'use client';

import '@/styles/modal.css';

interface ModalWrapperProps {
  open: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}

export default function ModalWrapper({ open, onClose, className, children }: ModalWrapperProps) {
  return (
    <div
      className={`modal-overlay${open ? ' open' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`modal${className ? ` ${className}` : ''}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
