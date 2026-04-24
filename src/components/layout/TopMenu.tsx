'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TopMenuProps } from '../../interface';
import TopMenuItem from './TopMenuItem';
import '@/styles/topMenu.css';

export default function TopMenu({ userName, isFull, backToDashboard }: TopMenuProps) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('jf_user');
      if (raw) {
        const user = JSON.parse(raw);
        setIsAdmin(user.role === 'admin');
      }
    } catch { /* ignore */ }
  }, []);

  function handleLogout() {
    // ล้าง cookie jf_token
    document.cookie = 'jf_token=; path=/; max-age=0; SameSite=Lax';
    localStorage.removeItem('jf_token');
    localStorage.removeItem('jf_user');
    router.push('/login');
  }

  return (
    <nav className="navbar">
      <Link href="/dashboard" className="nav-brand">
        <span className="brand-dot" />
        <span className="brand-name">Online Jobfair</span>
      </Link>
      <div className="nav-right">
        {userName && (
          <span className="nav-user">
            Hello, <strong>{userName}</strong>
          </span>
        )}
        {isAdmin && <TopMenuItem title="Booking Monitor" pageRef="/admin/dashboard" />}
        {isAdmin && <TopMenuItem title="Review Monitor" pageRef="/admin/reviews" />}
        <TopMenuItem title="Blog" pageRef="/blog" />
        {backToDashboard ? (
          !isAdmin ? (<TopMenuItem title="My Bookings" pageRef="/dashboard" />):
          (<TopMenuItem title={isFull ? 'View Companies' : 'Book Company'} pageRef="/book-company"
          />)
        ) : (
          <TopMenuItem
            title={isFull ? 'View Companies' : 'Book Company'}
            pageRef="/book-company"
          />
        )}
        <button className="btn-nav" onClick={handleLogout}>Sign out</button>
      </div>
    </nav>
  );
}