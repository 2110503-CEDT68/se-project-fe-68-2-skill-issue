import { useState, useCallback } from 'react';
import getReviews   from '@/libs/getReviews';
import createReview from '@/libs/createReview';
import editReview   from '@/libs/editReview';
import deleteReview  from '@/libs/deleteReview';
import { ReviewItem } from '../../interface';

export function useReviews(showToast: (msg: string, type: "success" | "error" | "info" | "") => void) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);

  // State สำหรับจัดการ Modal และสถานะการส่งข้อมูล
  const [editTarget, setEditTarget] = useState<ReviewItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReviewItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** 1. ดึงข้อมูลรีวิว (Fetch) */
  const fetchReviews = useCallback(async (targetId: string) => {
  setLoading(true);
  try {
    const res = await getReviews(targetId);
    setReviews(res.data || []);
    return res.data;
  } catch (err) {
    showToast('Failed to load reviews', 'error');
    return [];
  } finally {
    setLoading(false);
  }
}, [showToast]);

  /** 2. สร้างรีวิวใหม่ (Post) */
 const handleCreate = async (companyId: string, rating: number, comment: string) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('jf_token') || '';
      if (!token) throw new Error('Please login to post a review');

      const newReview = await createReview(token, companyId, rating, comment);
      
      // อัปเดต State โดยการเพิ่มรีวิวใหม่ไว้ด้านหน้าสุด
      setReviews((prev) => [newReview, ...prev]);
      
      showToast('✅ Review posted successfully!', 'success');
      return true;
    } catch (err: unknown) {
      showToast(`❌ ${err instanceof Error ? err.message : 'Post failed'}`, 'error');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  /** 3. แก้ไขรีวิว (Update) - ใช้ร่วมกับ editReview ที่คุณให้มา */
  const handleUpdate = async (rating: number, comment: string) => {
    if (!editTarget) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('jf_token') || '';
      if (!token) throw new Error('Authentication token not found');

      const res = await editReview(token, editTarget._id, rating, comment);
      
      // ตรวจสอบว่า API คืนค่าเป็น object ตัวเดียวหรือ array 
      // หากเป็นโครงสร้าง ReviewJson ทั่วไปมักอยู่ที่ res.data
      const updatedReview = Array.isArray(res.data) ? res.data[0] : res.data;

      setReviews((prev) =>
        prev.map((r) => (r._id === editTarget._id ? updatedReview : r))
      );
      
      showToast('✅ Review updated!', 'success');
      setEditTarget(null); // ปิด Modal แก้ไข
      return true;
    } catch (err: unknown) {
      showToast(`❌ ${err instanceof Error ? err.message : 'Update failed'}`, 'error');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  /** 4. ลบรีวิว (Delete) */
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('jf_token') || '';
      await deleteReview(token, deleteTarget._id);
      
      // กรองตัวที่ถูกลบออกจาก State
      setReviews((prev) => prev.filter((r) => r._id !== deleteTarget._id));
      
      showToast('✅ Review deleted', 'success');
      setDeleteTarget(null); // ปิด Modal ยืนยันการลบ
      return true;
    } catch (err: unknown) {
      showToast(`❌ ${err instanceof Error ? err.message : 'Delete failed'}`, 'error');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    // ข้อมูลและสถานะ
    reviews,
    setReviews,
    loading,
    isSubmitting,
    
    // ฟังก์ชันหลัก
    fetchReviews,
    handleCreate,
    handleUpdate,
    handleConfirmDelete,

    // สถานะสำหรับ Modal (UI Control)
    editTarget,
    setEditTarget,
    deleteTarget,
    setDeleteTarget,
  };
}