'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import userLogin from '@/libs/userLogin';
import AuthLeftPanel from '@/components/auth/AuthLeftPanel';
import EyeIcon from '@/components/ui/EyeIcon';
import '@/styles/login.css';
import getMe from '@/libs/getMe';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const data = await userLogin(email, password);
      document.cookie = `jf_token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      localStorage.setItem('jf_token', data.token);
      const me = await getMe(data.token);
      localStorage.setItem('jf_user', JSON.stringify(me.data));
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <AuthLeftPanel />

      {/* ── Right Panel ── */}
      <div className="panel-right">
        <div className="form-card">
          <div className="form-header">
            <h2>Welcome back</h2>
            <p>New here? <Link href="/register">Create an account</Link></p>
          </div>

          {error && <div className="error-box">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="field-group">
              <div className="field">
                <label htmlFor="email">
                  Email <span className="req">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="you@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="password">
                  Password <span className="req">*</span>
                </label>
                <div className="input-wrap">
                  <input
                    type={showPw ? 'text' : 'password'}
                    id="password"
                    placeholder="Your password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="toggle-pw"
                    onClick={() => setShowPw(!showPw)}
                  >
                    <EyeIcon show={showPw} />
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" className="btn-auth" disabled={loading || success}>
              {success ? (
                <>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Welcome back!
                </>
              ) : loading ? (
                <>
                  <span className="btn-spinner" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="bottom-link">
            Don&apos;t have an account? <Link href="/register">Register now</Link>
          </div>
        </div>
      </div>
    </div>
  );
}