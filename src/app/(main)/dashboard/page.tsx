'use client';
//ลบ auth guard ออก อย่าลืมเติมใหม่ทีหลัง
import { useState } from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';

import Banner        from '@/components/layout/Banner';
import BookingList   from '@/components/booking/BookingList';
import MyReviewList  from '@/components/review/MyReviewList';

import { RootState } from '@/redux/store';

import '@/styles/dashboard.css';

const MAX_BOOKINGS = 3;

export default function DashboardPage() {
  const bookingCount = useSelector((state: RootState) => state.book.bookItems.length);
  const remaining    = Math.max(0, MAX_BOOKINGS - bookingCount);
  const isFull       = bookingCount >= MAX_BOOKINGS;
  const [tab, setTab] = useState<'bookings' | 'reviews'>('bookings');

  return (
    <div className="container">
      <Banner />

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">My Bookings</div>
          <div className="stat-value">{bookingCount}</div>
          <div className="stat-note">out of 3 allowed</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Slots Remaining</div>
          <div className="stat-value accent">{remaining}</div>
          <div className="stat-note">you can still book</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Event Window</div>
          <div className="stat-value sm">May 10–13</div>
          <div className="stat-note">2022</div>
        </div>
      </div>

      <div className="section-header">
        <div className="tab-toggle">
          <button className={`tab-btn${tab === 'bookings' ? ' active' : ''}`} onClick={() => setTab('bookings')}>
            Booked Sessions
          </button>
          <button className={`tab-btn${tab === 'reviews' ? ' active' : ''}`} onClick={() => setTab('reviews')}>
            My Reviews
          </button>
        </div>
        {tab === 'bookings' && (
          <Link href="/book-company" className="btn-primary">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {isFull ? 'View Companies' : 'Book a Company'}
          </Link>
        )}
      </div>

      {tab === 'bookings' ? <BookingList /> : <MyReviewList />}
    </div>
  );
}