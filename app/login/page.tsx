'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@supplychain.ai');
  const [password, setPassword] = useState('demo-access');
  const [loading, setLoading] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    window.localStorage.setItem('ssc-demo-session', JSON.stringify({ email, signedInAt: new Date().toISOString() }));
    router.push('/dashboard');
  }

  return (
    <main className="auth-page">
      <section className="auth-card card-glass">
        <div className="auth-badge">
          <ShieldCheck size={14} />
          Demo access
        </div>
        <h1>Sign in to the control tower</h1>
        <p>
          This is a demo login that routes straight into the dashboard and stores a lightweight session locally.
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
          <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Enter demo workspace'}
          </button>
        </form>

        <div className="auth-links">
          <Link href="/">Back to landing</Link>
          <Link href="/dashboard">Skip to dashboard</Link>
        </div>
      </section>
    </main>
  );
}