'use client';

export default function Toast({ toast }: { toast: { msg: string; type: string } | null }) {
  if (!toast) return null;
  return <div className={`toast ${toast.type}`}>{toast.msg}</div>;
}
