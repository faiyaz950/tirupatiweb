
"use client";
import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AppSidebar } from '@/components/layout/AppSidebar'; // Use AppSidebar

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading, isSuperAdmin } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading Admin Panel...</p>
      </div>
    );
  }

  if (!user || !isSuperAdmin) {
    if (typeof window !== 'undefined') {
      router.push('/?error=unauthorized');
    }
    return (
       <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <AppSidebar>
      <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8"> {/* Removed pt-20 */}
        {children}
      </main>
    </AppSidebar>
  );
}
