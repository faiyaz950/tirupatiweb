
'use client';
import type { ReactNode } from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AuthGuard } from '@/components/layout/AuthGuard';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AppSidebar>
        <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </AppSidebar>
    </AuthGuard>
  );
}
