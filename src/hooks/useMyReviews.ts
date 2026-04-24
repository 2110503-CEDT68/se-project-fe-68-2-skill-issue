import { useState, useEffect, useCallback } from 'react';
import { ReviewItem } from '../../interface';
import getCompanies from '@/libs/getCompanies';
import { useReviews } from './useReviews';

export type MyReviewDisplay = { companyId: string; companyName: string; review: ReviewItem };

export function useMyReviews(showToast: (msg: string, type: 'success' | 'error') => void) {
  const [displayReviews, setDisplayReviews] = useState<MyReviewDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({ id: '', name: '' });

  const reviewOperations = useReviews(showToast);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('jf_user');
      if (raw) {
        const u = JSON.parse(raw);
        setUserInfo({ id: u._id || '', name: u.name || '' });
      }
    } catch { /* ignore */ }
  }, []);

  const loadAll = useCallback(async () => {
    if (!userInfo.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('jf_token') || '';
      const companiesRes = await getCompanies(token);
      const companies = companiesRes.data || [];
      const results: MyReviewDisplay[] = [];

      await Promise.all(
        companies.map(async (company) => {
          try {
            const reviewsData = await reviewOperations.fetchReviews(company._id);
            const mine = reviewsData?.find((r: ReviewItem) => {
              const uid = typeof r.user === 'object' ? r.user._id : r.user;
              return uid === userInfo.id;
            });
            if (mine) results.push({ companyId: company._id, companyName: company.name, review: mine });
          } catch { /* skip */ }
        })
      );

      setDisplayReviews(results);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [userInfo.id, reviewOperations.fetchReviews]);

  useEffect(() => { loadAll(); }, [loadAll]);

  function updateReview(id: string, updated: Partial<ReviewItem>) {
    setDisplayReviews((prev) =>
      prev.map((r) => r.review._id === id ? { ...r, review: { ...r.review, ...updated } } : r)
    );
  }

  function removeReview(id: string) {
    setDisplayReviews((prev) => prev.filter((r) => r.review._id !== id));
  }

  return {
    displayReviews,
    loading,
    userInfo,
    updateReview,
    removeReview,
    ...reviewOperations,
  };
}
