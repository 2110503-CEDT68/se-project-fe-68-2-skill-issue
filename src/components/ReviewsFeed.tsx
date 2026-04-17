'use client';

import { useState } from 'react';
import { ReviewItem } from '../../interface';
import ReviewCard from './ReviewCard';
import { getEffectiveDate } from '@/utils/dateFormat';

const PAGE_SIZE = 5;

interface ReviewsFeedProps {
  reviews: ReviewItem[];
  currentUserId: string;
  currentUserRole: string;
  // ปรับให้รับ parameter review เพื่อให้รู้ว่ากำลังจัดการใบไหน
  onEditReview: (review: ReviewItem) => void; 
  onDeleteReview: (review: ReviewItem) => void;
}

export default function ReviewsFeed({
  reviews,
  currentUserId,
  currentUserRole,
  onEditReview,
  onDeleteReview,
}: ReviewsFeedProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (reviews.length === 0) {
    return (
      <div className="no-reviews-placeholder">
        No Reviews Yet ...
        <h3>Be the first one to leave a review!!!!!</h3>
      </div>
    );
  }

  // 1. แยก Review ของเราออกมาเพื่อ Pin ไว้บนสุด
  const myReview = reviews.find((r) => {
    const uid = typeof r.user === 'object' ? r.user._id : r.user;
    return uid === currentUserId;
  });

  // 2. กรองคนอื่นและเรียงลำดับตามวันที่ใหม่ล่าสุด
  const otherReviews = reviews
    .filter((r) => {
      const uid = typeof r.user === 'object' ? r.user._id : r.user;
      return uid !== currentUserId;
    })
    .sort((a, b) => {
      const tA = new Date(getEffectiveDate(a)).getTime();
      const tB = new Date(getEffectiveDate(b)).getTime();
      return tB - tA;
    });

  // 3. รวมร่าง: เอาของเราขึ้นก่อน ตามด้วยคนอื่น
  const sortedReviews = myReview ? [myReview, ...otherReviews] : otherReviews;
  const visibleReviews = sortedReviews.slice(0, visibleCount);

  return (
    <>
      <div className="reviews-feed">
        {visibleReviews.map((review, idx) => {
          // คำนวณสิทธิ์ตรงนี้เพื่อส่งเข้า ReviewCard (หรือให้ ReviewCard ไปคำนวณเองก็ได้)
          const isOwner = (typeof review.user === 'object' ? review.user._id : review.user) === currentUserId;
          const isAdmin = currentUserRole === 'admin';

          return (
            <ReviewCard
              key={review._id}
              review={review}
              index={idx}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              // ส่ง function พร้อมแนบ review object กลับไป
              onEdit={() => onEditReview(review)} 
              // สิทธิ์การลบ: เป็นเจ้าของ OR เป็นแอดมิน
              onDelete={(isOwner || isAdmin) ? () => onDeleteReview(review) : undefined}
            />
          );
        })}
      </div>

      {visibleCount < sortedReviews.length && (
        <button
          className="load-more-btn"
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
        >
          Load More Comments...
        </button>
      )}
    </>
  );
}