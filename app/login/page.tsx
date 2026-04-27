'use client';

import type { Metadata } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Lock, Mail, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Demo Login | Smart Supply Chain',
  description: 'Sign in to the demo control tower and open the protected dashboard workspace.',
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@supplychain.ai');
  const [password, setPassword] = useState('demo-access');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const canSubmit = Boolean(email.trim() && password.trim()) && !loading;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    window.localStorage.setItem('ssc-demo-session', JSON.stringify({
      email,
      signedInAt: new Date().toISOString(),
      remember,
      expiresAt: remember ? null : new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    }));
    router.push('/dashboard');
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <section className="auth-card card-glass">
          <div className="auth-badge">
            <ShieldCheck size={14} />
            Demo access
          </div>
          <h1>Sign in to the control tower</h1>
          <p>
            This demo login stores a lightweight local session and jumps straight into the dashboard.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              <span><Mail size={14} /> Email</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" />
            </label>
            <label>
              <span><Lock size={14} /> Password</span>
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" />
            </label>
            <label className="auth-remember-row">
              <input checked={remember} onChange={(event) => setRemember(event.target.checked)} type="checkbox" />
              <span>Keep me signed in for this demo session</span>
            </label>
            <button className="btn btn-primary auth-submit" type="submit" disabled={!canSubmit}>
              {loading ? 'Signing in...' : 'Enter demo workspace'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="auth-links">
            <Link href="/">Back to landing</Link>
            <Link href="/dashboard">Skip to dashboard</Link>
          </div>
        </section>

        <aside className="auth-aside card-glass">
          <div className="section-title">What this demo unlocks</div>
          <div className="auth-note-list">
            {[
              'Protected dashboard routes for shipments, alerts, and analytics',
              'Persistent demo session stored in the browser',
              'Quick sign out from the sidebar when you are done',
            ].map((note) => (
              <div key={note} className="auth-note-item">
                <CheckCircle2 size={16} />
                <span>{note}</span>
              </div>
            ))}
          </div>
          <div className="auth-preview">
            <div>
              <span>Demo user</span>
              <strong>demo@supplychain.ai</strong>
            </div>
            <div>
              <span>Access level</span>
              <strong>Operations viewer</strong>
            </div>
          </div>
        </aside>
        </div>
      </section>
    </main>
  );
}