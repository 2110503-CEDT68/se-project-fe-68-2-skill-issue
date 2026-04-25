'use client';
import { useState, useEffect, useCallback } from 'react';
import ModalWrapper from '../ModalWrapper';

interface EditCommentModalProps {
  initialText: string;
  loading: boolean;
  onConfirm: (text: string) => void;
  onClose: () => void;
}

export default function EditCommentModal({ initialText, loading, onConfirm, onClose }: EditCommentModalProps) {
  const [text, setText] = useState(initialText);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const isDirty = text.trim() !== initialText.trim();

  
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; 
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

 
  const handleCloseRequest = useCallback(() => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false);
    onClose();
  };

  const handleCancelDiscard = () => {
    setShowDiscardConfirm(false);
  };

  return (
    <>
      {/* ── Main edit modal ── */}
      <ModalWrapper open onClose={handleCloseRequest}>
        <div className="modal-icon">📝</div>
        <h3>แก้ไขความคิดเห็น</h3>

        <textarea
          className="post-textarea"
          style={{
            marginTop: '15px',
            minHeight: '120px',
            border: `2px solid ${isDirty ? '#f59e0b' : '#1A1714'}`,
            borderRadius: '12px',
            padding: '12px',
            transition: 'border-color 0.2s ease',
          }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={100}
          placeholder="พิมพ์ข้อความใหม่ที่นี่..."
        />

       

        <div className="modal-actions">
          <button className="btn-modal-cancel" onClick={handleCloseRequest}>
            ยกเลิก
          </button>
          <button
            className="btn-modal-confirm"
            onClick={() => onConfirm(text)}
            disabled={loading || !text.trim()}
          >
            {loading ? 'กำลังบันทึก...' : 'อัปเดต'}
          </button>
        </div>
      </ModalWrapper>

      {/* ── Discard confirmation modal ── */}
      {showDiscardConfirm && (
        <ModalWrapper open onClose={handleCancelDiscard}>
          <div className="modal-icon">⚠️</div>
          <h3>ยกเลิกการแก้ไข?</h3>
          <p style={{ color: '#666', marginTop: '8px', fontSize: '14px' }}>
            คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก หากออกตอนนี้ การแก้ไขทั้งหมดจะหายไป
          </p>
          <div className="modal-actions">
            <button className="btn-modal-cancel" onClick={handleCancelDiscard}>
              อยู่ต่อ
            </button>
            <button
              className="btn-modal-confirm"
              style={{ background: '#ef4444' }}
              onClick={handleConfirmDiscard}
            >
              ทิ้งการเปลี่ยนแปลง
            </button>
          </div>
        </ModalWrapper>
      )}
    </>
  );
}