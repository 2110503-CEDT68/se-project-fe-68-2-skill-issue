'use client';
import ModalWrapper from '../ModalWrapper';

interface DeleteCommentModalProps {
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function DeleteCommentModal({ loading, onConfirm, onClose }: DeleteCommentModalProps) {
  return (
    <ModalWrapper open onClose={onClose}>
      <div className="modal-icon">🗑️</div>
      <h3>Delete Comment?</h3>
      <p style={{ marginTop: '8px', color: '#666' }}>
        Are you sure you want to delete this comment? 
        <br />
        <span style={{ fontSize: '0.8rem', color: '#E8530A', fontWeight: 'bold' }}>
          *This action cannot be undone
        </span>
      </p>
      <div className="modal-actions" style={{ marginTop: '20px' }}>
        <button className="btn-modal-cancel" onClick={onClose}>Cancel</button>
        <button 
          className="btn-modal-confirm" 
          onClick={onConfirm} 
          disabled={loading}
          style={{ background: '#dc2626' }} 
        >
          {loading ? 'Deleting...' : 'Confirm Deletion'}
        </button>
      </div>
    </ModalWrapper>
  );
}