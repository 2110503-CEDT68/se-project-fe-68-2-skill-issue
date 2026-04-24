'use client';
import { useState } from 'react';
import ModalWrapper from '../ModalWrapper';

interface EditCommentModalProps {
  initialText: string;
  loading: boolean;
  onConfirm: (text: string) => void;
  onClose: () => void;
}

export default function EditCommentModal({ initialText, loading, onConfirm, onClose }: EditCommentModalProps) {
  const [text, setText] = useState(initialText);

  return (
    <ModalWrapper open onClose={onClose}>
      <div className="modal-icon">📝</div>
      <h3>แก้ไขความคิดเห็น</h3>
      <textarea
        className="post-textarea"
        style={{ 
          marginTop: '15px', 
          minHeight: '120px', 
          border: '2px solid #1A1714',
          borderRadius: '12px',
          padding: '12px'
        }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="พิมพ์ข้อความใหม่ที่นี่..."
      />
      <div className="modal-actions">
        <button className="btn-modal-cancel" onClick={onClose}>ยกเลิก</button>
        <button 
          className="btn-modal-confirm" 
          onClick={() => onConfirm(text)} 
          disabled={loading || !text.trim()}
        >
          {loading ? 'กำลังบันทึก...' : 'อัปเดต'}
        </button>
      </div>
    </ModalWrapper>
  );
}