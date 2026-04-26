'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';

import TopMenu from '@/components/layout/TopMenu';
import { RootState } from '@/redux/store';
import { UserItem } from '../../../interface';

const PROTECTED_PATHS = ['/dashboard', '/book-company', '/admin', '/blog/create', '/company'];

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

        // login แล้ว ไม่ควรเข้าหน้า login/register
        if (pathname === '/login' || pathname === '/register') {
          router.replace('/dashboard');
          return;
        }

        if (parsed.role === 'admin' && pathname === '/dashboard') {
          router.replace('/admin/dashboard');
        }
      } else {
        // ยังไม่ login — redirect ไป /login ถ้าเป็น protected page
        if (PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
          router.replace('/login');
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