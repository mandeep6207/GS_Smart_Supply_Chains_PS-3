'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface NavItem {
  href: string;
  icon: string;
  label: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { href: '/dashboard', icon: '⬡', label: 'Dashboard' },
  { href: '/shipments', icon: '📦', label: 'Shipments' },
  { href: '/alerts', icon: '🔔', label: 'Alerts' },
  { href: '/analytics', icon: '📊', label: 'Analytics' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [alertCount, setAlertCount] = useState(0);
  const [currentTime, setCurrentTime] = useState('');
  const [demoUser, setDemoUser] = useState('Demo operator');
  const [healthStatus, setHealthStatus] = useState('healthy');

  useEffect(() => {
    // Fetch alert count
    fetch('/api/alerts')
      .then((r) => r.json())
      .then((d) => setAlertCount(d.summary?.critical ?? 0))
      .catch(() => {});

    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setHealthStatus(d.status ?? 'healthy'))
      .catch(() => setHealthStatus('unknown'));

    const rawSession = window.localStorage.getItem('ssc-demo-session');
    if (rawSession) {
      try {
        const session = JSON.parse(rawSession) as { email?: string };
        setDemoUser(session.email ?? 'Demo operator');
      } catch {
        setDemoUser('Demo operator');
      }
    }

    // Live clock
    const tick = () => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  function handleSignOut() {
    window.localStorage.removeItem('ssc-demo-session');
    router.replace('/login');
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🏗️</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            SupplyChain
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 500 }}>
            Control Tower
          </div>
        </div>
      </div>

      {/* Live Status */}
      <div style={{
        margin: '10px 12px',
        padding: '10px 12px',
        background: 'rgba(16,185,129,0.08)',
        borderRadius: 8,
        border: '1px solid rgba(16,185,129,0.15)',
      }}>
        <div className="live-indicator" style={{ marginBottom: 4 }}>
          <span className="live-dot" />
          <span>LIVE</span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
          {currentTime || '00:00:00'}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>

        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const badge = item.href === '/alerts' ? alertCount : undefined;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
              id={`nav-${item.label.toLowerCase()}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {badge ? (
                <span className="nav-badge">{badge}</span>
              ) : null}
            </Link>
          );
        })}

        <div className="nav-section-label" style={{ marginTop: 16 }}>System</div>
        <div className="nav-item" style={{ cursor: 'default' }}>
          <span className="nav-icon">🤖</span>
          <span>AI Engine</span>
          <span style={{
            marginLeft: 'auto',
            fontSize: 10,
            color: 'var(--risk-low)',
            fontWeight: 600,
            background: 'rgba(16,185,129,0.1)',
            padding: '2px 6px',
            borderRadius: 4,
          }}>ACTIVE</span>
        </div>
        <div className="nav-item" style={{ cursor: 'default' }}>
          <span className="nav-icon">🛰️</span>
          <span>Data Feed</span>
          <span style={{
            marginLeft: 'auto',
            fontSize: 10,
            color: 'var(--accent-blue)',
            fontWeight: 600,
            background: 'rgba(79,142,247,0.1)',
            padding: '2px 6px',
            borderRadius: 4,
          }}>LIVE</span>
        </div>
      </nav>

      {/* Footer */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border-primary)',
        fontSize: 11,
        color: 'var(--text-muted)',
      }}>
        <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>
          SupplyChain AI v1.2
        </div>
        <div>Google Solution Challenge 2026</div>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="live-dot" />
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
            System {healthStatus}
          </span>
        </div>
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-primary)' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Signed in as
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8, wordBreak: 'break-word' }}>
            {demoUser}
          </div>
          <button className="btn btn-ghost" onClick={handleSignOut} style={{ width: '100%', fontSize: 11 }}>
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
