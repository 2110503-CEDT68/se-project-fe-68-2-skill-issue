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
      <div className="modal-icon">💬🗑️</div>
      <h3>Delete Comment?</h3>
      <p style={{ marginTop: '8px', color: '#666' }}>
        คุณแน่ใจหรือไม่ว่าต้องการลบความคิดเห็นนี้? 
        <br />
        <span style={{ fontSize: '0.8rem', color: '#E8530A', fontWeight: 'bold' }}>
          *การดำเนินการนี้ไม่สามารถย้อนกลับได้
        </span>
      </p>
      <div className="modal-actions" style={{ marginTop: '20px' }}>
        <button className="btn-modal-cancel" onClick={onClose}>ยกเลิก</button>
        <button 
          className="btn-modal-confirm" 
          onClick={onConfirm} 
          disabled={loading}
          style={{ background: '#dc2626' }} // สีแดงสำหรับลบ
        >
          {loading ? 'กำลังลบ...' : 'ยืนยันการลบ'}
        </button>
      </div>
    </ModalWrapper>
  );
}