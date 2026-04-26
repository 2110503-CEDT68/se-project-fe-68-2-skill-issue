'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TopMenuProps } from '../../../interface';
import TopMenuItem from '@/components/layout/TopMenuItem';
import '@/styles/topMenu.css';

export default function TopMenu({ userName, isFull, backToDashboard }: TopMenuProps) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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
    setSigningOut(true);
    setTimeout(() => {
      document.cookie = 'jf_token=; path=/; max-age=0; SameSite=Lax';
      localStorage.removeItem('jf_token');
      localStorage.removeItem('jf_user');
      router.push('/login');
    }, 900);
  }

  return (
    <>
    {signingOut && (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(30,10,4,0.85)', backdropFilter: 'blur(4px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 16, animation: 'fadeInOverlay 0.2s ease',
      }}>
        <div style={{
          width: 48, height: 48,
          border: '4px solid rgba(255,255,255,0.2)',
          borderTop: '4px solid #E8A020',
          borderRadius: '50%',
          animation: 'nav-spin 0.7s linear infinite',
        }} />
        <p style={{ color: '#fff', fontWeight: 600, fontSize: '1rem', letterSpacing: '0.05em' }}>Signing out…</p>
        <style>{`
          @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
          @keyframes nav-spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    )}
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
        {isAdmin ? (<TopMenuItem title="Blog Monitor" pageRef="/admin/blog" />) : (<TopMenuItem title="Blog" pageRef="/blog" />)}
        {backToDashboard ? (
          !isAdmin ? (<TopMenuItem title="My Bookings" pageRef="/dashboard" />) :
          (<TopMenuItem title={isFull ? 'View Companies' : 'Book Company'} pageRef="/book-company" />)
        ) : (
          <TopMenuItem
            title={isFull ? 'View Companies' : 'Book Company'}
            pageRef="/book-company"
          />
        )}
        <button className="btn-nav" onClick={handleLogout}>Sign out</button>
      </div>
    </nav>
    </>
  );
}