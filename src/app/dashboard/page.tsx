
"use client";

import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserPlus, Users, FileText, UserCircle, LogOut, Loader2, AlertTriangle, Building, FileSpreadsheet } from "lucide-react";
import { getSuperAdminProfile, createOrUpdateSuperAdminProfile } from "@/lib/firestore";
import type { SuperAdminProfile } from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  cta: string;
}

function DashboardActionCard({ title, description, icon: Icon, href, cta }: DashboardCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader className="flex flex-row items-center space-x-4 pb-2">
        <div className="p-3 rounded-full bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
      <CardContent className="pt-0">
         <Link href={href} passHref>
          <Button className="w-full">{cta}</Button>
        </Link>
      </CardContent>
    </Card>
  );
}


export default function SuperAdminDashboardPage() {
  const { user, signOut, superAdminProfile: authSuperAdminProfile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: superAdminData, isLoading: isLoadingProfile, error: profileError } = useQuery<SuperAdminProfile | null>({
    queryKey: ['superAdminProfile', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      let profile = await getSuperAdminProfile(user.uid);
      if (!profile && user.email) { // Create profile if not exists, as per Flutter logic
        await createOrUpdateSuperAdminProfile(user.uid, { 
            name: 'Super Admin', // Default name
            email: user.email,
            uid: user.uid,
        });
        // Refetch after creation
        profile = await getSuperAdminProfile(user.uid);
      }
      return profile;
    },
    enabled: !!user?.uid,
    initialData: authSuperAdminProfile, // Use profile from AuthContext as initial data
  });

  const mutation = useMutation({
    mutationFn: () => createOrUpdateSuperAdminProfile(user!.uid, { 
      name: 'Super Admin', 
      email: user!.email!,
      uid: user!.uid,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superAdminProfile', user?.uid] });
      toast({ title: "Profile Initialized", description: "Super Admin profile created." });
    },
    onError: (error) => {
      toast({ title: "Profile Error", description: `Failed to initialize profile: ${error.message}`, variant: "destructive" });
    }
  });

  useEffect(() => {
    if (user && !superAdminData && !isLoadingProfile && !profileError && !mutation.isPending) {
      // If user is loaded, no profile data, not loading, no error, and not already mutating -> try to create.
      // This logic is similar to the Flutter app's _createSuperAdminProfile if it doesn't exist.
       mutation.mutate();
    }
  }, [user, superAdminData, isLoadingProfile, profileError, mutation]);


  if (isLoadingProfile || mutation.isPending) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading dashboard...</p>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading Profile</h2>
        <p className="text-muted-foreground mb-4">Could not load Super Admin profile: {profileError.message}</p>
        <Button onClick={() => queryClient.refetchQueries({ queryKey: ['superAdminProfile', user?.uid] })}>Retry</Button>
      </div>
    );
  }
  
  const displayName = superAdminData?.name || user?.email || "Super Admin";

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
          Welcome, {displayName}!
        </h1>
        <p className="text-lg text-muted-foreground">Manage your platform efficiently.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardActionCard
          title="Add New Admin"
          description="Create and assign new administrators."
          icon={UserPlus}
          href="/dashboard/add-admin"
          cta="Add Admin"
        />
        <DashboardActionCard
          title="View All Admins"
          description="Oversee and manage all admin accounts."
          icon={Users}
          href="/dashboard/admins"
          cta="Manage Admins"
        />
        <DashboardActionCard
          title="KYC Records"
          description="Access and review all KYC submissions."
          icon={FileText}
          href="/dashboard/kyc"
          cta="View KYC"
        />
        <DashboardActionCard
          title="Your Profile"
          description="Update your Super Admin account details."
          icon={UserCircle}
          href="/dashboard/profile"
          cta="Go to Profile"
        />
         <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 md:col-span-2 lg:col-span-1 flex flex-col">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <div className="p-3 rounded-full bg-destructive/10 text-destructive">
              <LogOut className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Log Out</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-muted-foreground">Securely sign out of your account.</p>
          </CardContent>
          <CardContent className="pt-0">
            <Button variant="destructive" className="w-full" onClick={signOut}>
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
