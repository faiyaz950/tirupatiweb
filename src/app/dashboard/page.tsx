
"use client";

import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserPlus, Users, FileText, UserCircle, LogOut, Loader2, AlertTriangle, Gauge, Settings, Download, Smartphone } from "lucide-react";
import { getSuperAdminProfile, createOrUpdateSuperAdminProfile } from "@/lib/firestore";
import type { SuperAdminProfile } from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { WaveHeader } from "@/components/ui/wave-header";

interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href?: string; 
  cta: string;
  onClick?: () => void; 
}

function DashboardActionCard({ title, description, icon: Icon, href, cta, onClick }: DashboardCardProps) {
  const content = (
    <Card className="rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out hover:-translate-y-1.5 flex flex-col">
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
         <Button className="w-full" onClick={onClick} variant={title === "Log Out" ? "default" : "default"}>
            {cta}
          </Button>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href} passHref className="h-full flex flex-col">{content}</Link>;
  }
  return content;
}


export default function SuperAdminDashboardPage() {
  const { user, signOut, superAdminProfile: authSuperAdminProfile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // **IMPORTANT: Replace this placeholder with your actual DIRECT APK download URL from your chosen hosting service**
  const apkDownloadLink = "PASTE_YOUR_DIRECT_APK_DOWNLOAD_LINK_HERE";

  const { data: superAdminData, isLoading: isLoadingProfile, error: profileError } = useQuery<SuperAdminProfile | null>({
    queryKey: ['superAdminProfile', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      let profile = await getSuperAdminProfile(user.uid);
      if (!profile && user.email) {
        await createOrUpdateSuperAdminProfile(user.uid, {
            name: 'Super Admin',
            email: user.email,
            uid: user.uid,
        });
        profile = await getSuperAdminProfile(user.uid);
      }
      return profile;
    },
    enabled: !!user?.uid,
    initialData: authSuperAdminProfile,
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
        <p className="text-muted-foreground mb-4">Could not load Super Admin profile: ${profileError.message}</p>
        <Button onClick={() => queryClient.refetchQueries({ queryKey: ['superAdminProfile', user?.uid] })}>Retry</Button>
      </div>
    );
  }

  const displayName = superAdminData?.name || user?.email || "Super Admin";

  return (
    <div className="flex flex-col">
      <WaveHeader
        title={
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white">
            Welcome, {displayName}!
          </h1>
        }
        subtitle={
          <p className="mt-3 sm:mt-4 text-xl sm:text-2xl text-primary-foreground/90">
            Manage your platform efficiently.
          </p>
        }
        icon={<Gauge size={48} className="text-white" />}
        className="mb-0"
        contentClassName="py-10 sm:py-14 md:py-20"
      />

      <main className="container mx-auto p-4 sm:p-6 md:p-8 mt-[-4rem] sm:mt-[-5rem] md:mt-[-6rem] relative z-10">
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
          <DashboardActionCard
            title="Log Out"
            description="Securely sign out of your account."
            icon={LogOut}
            cta="Sign Out"
            onClick={signOut}
          />
        </div>

        {/* Download App Card Section */}
        <div className="mt-12">
          <Card className="rounded-2xl shadow-xl overflow-hidden bg-gradient-to-br from-primary/80 to-accent/80 text-primary-foreground hover:shadow-2xl transition-all duration-300 ease-in-out hover:-translate-y-1.5">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <Smartphone size={32} />
                <CardTitle className="text-2xl font-bold">Get Our Android App</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-primary-foreground/90 mb-4">
                Download the official Android application to manage tasks on the go.
              </CardDescription>
              <a
                href={apkDownloadLink}
                download="TirupatiGroupApp.apk" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full sm:w-auto text-primary bg-primary-foreground hover:bg-primary-foreground/90 ${apkDownloadLink === "PASTE_YOUR_DIRECT_APK_DOWNLOAD_LINK_HERE" ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={(e) => {
                  if (apkDownloadLink === "PASTE_YOUR_DIRECT_APK_DOWNLOAD_LINK_HERE") {
                    e.preventDefault();
                    toast({
                      title: "Download Link Not Ready",
                      description: "The direct download link for the APK needs to be configured first by the admin.",
                      variant: "destructive"
                    });
                  }
                }}
              >
                <Download className="mr-2 h-5 w-5" />
                Download APK
              </a>
              {apkDownloadLink === "PASTE_YOUR_DIRECT_APK_DOWNLOAD_LINK_HERE" && (
                <p className="text-xs text-primary-foreground/70 mt-2">
                  (Admin: Please replace the placeholder link above with your actual direct APK download URL.)
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
