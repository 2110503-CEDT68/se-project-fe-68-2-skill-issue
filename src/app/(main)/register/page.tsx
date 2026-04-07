'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import userRegister from '@/libs/userRegister';
import AuthLeftPanel from '@/components/AuthLeftPanel';
import EyeIcon from '@/components/EyeIcon';
import '@/styles/login.css';
import getMe from '@/libs/getMe';

function getStrength(pw: string): number {
  if (pw.length < 6) return 0;
  let score = 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 1 = weak, 2 = medium, 3 = strong
}

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const strength = getStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !phone || !password || !confirm) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!/^0\d{9}$/.test(phone)) {
      setError('Phone number must be 10 digits and start with 0 (e.g. 0812345678).');
      return;
    }

    try {
      const data = await userRegister(name, email, phone, password);
      localStorage.setItem('jf_token', data.token);
      const me = await getMe(data.token);
      localStorage.setItem('jf_user', JSON.stringify(me.data));
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="auth-layout">
      <AuthLeftPanel />

      {/* ── Right Panel ── */}
      <div className="panel-right">
        <div className="form-card">
          {success ? (
            <div className="success-state">
              <div className="success-icon">✅</div>
              <h3>You&apos;re registered!</h3>
              <p>Account created successfully.<br />Redirecting to dashboard...</p>
              <Link href="/login" className="btn-auth" style={{ textDecoration: 'none', marginTop: 8 }}>
                Go to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="form-header">
                <h2>Create account</h2>
                <p>Already registered? <Link href="/login">Sign in here</Link></p>
              </div>

              {error && <div className="error-box">{error}</div>}

              <form onSubmit={handleSubmit} noValidate>
                <div className="field-group">
                  <div className="field">
                    <label htmlFor="name">
                      Full Name <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      placeholder="John Doe"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="field-row">
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
                      <label htmlFor="phone">
                        Phone <span className="req">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        placeholder="0XXXXXXXXX"
                        autoComplete="tel"
                        value={phone}
                        maxLength={10}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '');
                          setPhone(digits);
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="divider"><span>Security</span></div>

                <div className="field-group">
                  <div className="field">
                    <label htmlFor="password">
                      Password <span className="req">*</span>
                    </label>
                    <div className="input-wrap">
                      <input
                        type={showPw ? 'text' : 'password'}
                        id="password"
                        placeholder="At least 6 characters"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button type="button" className="toggle-pw" onClick={() => setShowPw(!showPw)}>
                        <EyeIcon show={showPw} />
                      </button>
                    </div>
                    <div className="pw-strength">
                      <div className={`pw-bar ${strength >= 1 ? (strength === 1 ? 'weak' : strength === 2 ? 'medium' : 'strong') : ''}`} />
                      <div className={`pw-bar ${strength >= 2 ? (strength === 2 ? 'medium' : 'strong') : ''}`} />
                      <div className={`pw-bar ${strength >= 3 ? 'strong' : ''}`} />
                    </div>
                    <span className="field-hint">Minimum 6 characters</span>
                  </div>

                  <div className="field">
                    <label htmlFor="confirm">
                      Confirm Password <span className="req">*</span>
                    </label>
                    <div className="input-wrap">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        id="confirm"
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                      />
                      <button type="button" className="toggle-pw" onClick={() => setShowConfirm(!showConfirm)}>
                        <EyeIcon show={showConfirm} />
                      </button>
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn-auth">
                  Register Now
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </form>

              <div className="bottom-link">
                Already have an account? <Link href="/login">Sign in</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}