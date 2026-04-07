import { useState, useCallback } from 'react';

export function useToast() {
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error' | '' = '') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  return { toast, showToast };
}
