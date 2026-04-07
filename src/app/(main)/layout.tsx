'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';

import TopMenu from '@/components/TopMenu';
import { RootState } from '@/redux/store';
import { UserItem } from '../../../interface';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser]    = useState<UserItem | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname           = usePathname();
  const router             = useRouter();
  const bookingCount       = useSelector((state: RootState) => state.book.bookItems.length);
  const isFull             = !isAdmin && bookingCount >= 3;
  const backToDashboard    = pathname === '/book-company';

  useEffect(() => {
    try {
      const raw = localStorage.getItem('jf_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed);
        setIsAdmin(parsed.role === 'admin');
        if (parsed.role === 'admin' && pathname === '/dashboard') {
          router.replace('/admin/dashboard');
        }
      }
    } catch { /* ignore */ }
  }, [pathname, router]);

  const isAuthPage = pathname === '/login' || pathname === '/register';

  return (
    <>
      {!isAuthPage && (
        <TopMenu
          userName={user?.name || user?.email}
          isFull={isFull}
          backToDashboard={backToDashboard}
        />
      )}
      {children}
    </>
  );
}