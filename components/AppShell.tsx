'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

const PUBLIC_ROUTES = new Set(['/', '/login']);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = pathname ? PUBLIC_ROUTES.has(pathname) : false;

  if (isPublicRoute) {
    return <main className="public-main">{children}</main>;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}