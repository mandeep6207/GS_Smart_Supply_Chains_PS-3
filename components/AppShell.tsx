'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

const PUBLIC_ROUTES = new Set(['/', '/login']);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const isPublicRoute = pathname ? PUBLIC_ROUTES.has(pathname) : false;

  useEffect(() => {
    if (isPublicRoute) {
      setIsAuthenticated(true);
      return;
    }

    const session = window.localStorage.getItem('ssc-demo-session');
    if (!session) {
      setIsAuthenticated(false);
      router.replace('/login');
      return;
    }

    setIsAuthenticated(true);
  }, [isPublicRoute, router, pathname]);

  if (isPublicRoute) {
    return <main className="public-main">{children}</main>;
  }

  if (isAuthenticated !== true) {
    return <main className="public-main" />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}