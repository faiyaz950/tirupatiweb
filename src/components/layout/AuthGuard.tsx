
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading, isSuperAdmin } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // If auth state is still loading, we wait.
    if (loading) {
      return;
    }

    // If auth state has loaded, check permissions.
    if (!user || !isSuperAdmin) {
      router.push('/?error=unauthorized');
    } else {
      // User is authenticated and authorized, stop checking.
      setIsChecking(false);
    }
  }, [user, loading, isSuperAdmin, router]);

  // While auth is loading from Firebase or we are checking permissions
  if (loading || isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Verifying session...</p>
      </div>
    );
  }

  // If checks are complete and user is valid, render the children.
  return <>{children}</>;
}
