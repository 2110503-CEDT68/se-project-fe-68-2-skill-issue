'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import getMe from '@/libs/getMe';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('jf_token');
    if (!token) { router.replace('/login'); return; }

    getMe(token)
      .then(({ data }) => {
        if (data.role !== 'admin') {
          router.replace('/dashboard');
        } else {
          setReady(true);
        }
      })
      .catch(() => {
        router.replace('/login');
      });
  }, [router]);

  if (!ready) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: 120 }}>
        <p style={{ color: 'var(--muted)' }}>Checking permissions…</p>
      </div>
    );
  }

  return <>{children}</>;
}
