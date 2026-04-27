'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  // Show spinner immediately on any internal link click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;
      if (anchor.target === '_blank') return;
      setVisible(true);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Hide spinner once navigation completes (pathname changed)
  useEffect(() => {
    setVisible(false);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(255,255,255,0.6)',
      backdropFilter: 'blur(2px)',
      pointerEvents: 'none',
    }}>
      <div style={{
        width: 48,
        height: 48,
        border: '4px solid #e5e5e5',
        borderTop: '4px solid #E8A020',
        borderRadius: '50%',
        animation: 'nav-spin 0.7s linear infinite',
      }} />
      <style>{`
        @keyframes nav-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
