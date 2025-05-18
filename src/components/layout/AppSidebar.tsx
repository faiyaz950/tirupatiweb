
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarProvider,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Home, UserPlus, Users, FileText, UserCircle, LogOut, ShieldAlert, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { ReactNode } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/add-admin", label: "Add Admin", icon: UserPlus },
  { href: "/dashboard/admins", label: "All Admins", icon: Users },
  { href: "/dashboard/kyc", label: "KYC Records", icon: FileText },
  { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
];

export function AppSidebar({ children }: { children: ReactNode }) {
  const { user, superAdminProfile, signOut, loading } = useAuth();
  const pathname = usePathname();

  if (loading && !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        {/* You can put a more sophisticated loader here */}
      </div>
    );
  }
  
  if (!user) {
     // This case should ideally be handled by AuthProvider redirecting to /login
    return null;
  }


  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <ShieldAlert className="text-primary size-8 shrink-0" />
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="font-semibold text-lg text-sidebar-foreground">AdminPanelPro</span>
              <span className="text-xs text-sidebar-foreground/70">Super Admin</span>
            </div>
          </div>
        </SidebarHeader>
        <Separator className="bg-sidebar-border" />
        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                    tooltip={item.label}
                    className="justify-start"
                  >
                    <item.icon className="shrink-0" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <Separator className="bg-sidebar-border" />
        <SidebarFooter className="p-4 mt-auto">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <Avatar className="size-9">
              <AvatarImage src={user.photoURL || undefined} alt={superAdminProfile?.name || user.email || "Admin"} />
              <AvatarFallback>{superAdminProfile?.name?.[0] || user.email?.[0].toUpperCase() || "A"}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-medium text-sidebar-foreground truncate max-w-[150px]">{superAdminProfile?.name || user.email}</span>
              <Link href="/dashboard/profile" className="text-xs text-sidebar-foreground/70 hover:underline">
                View Profile
              </Link>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full mt-4 justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:aspect-square group-data-[collapsible=icon]:p-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={signOut}
            title="Logout"
          >
            <LogOut className="shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden ml-2">Logout</span>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <div className="flex flex-col w-full">
        <AppHeader />
        <SidebarInset className="flex-1 overflow-auto">
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}


function AppHeader() {
  const { isMobile } = useSidebar(); // from ui/sidebar
  const { user, superAdminProfile } = useAuth();

  if (!isMobile) return null; // SidebarTrigger is only for mobile view to open the sheet

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
      <div className="flex items-center gap-2">
        <SidebarTrigger /> {/* This button toggles the mobile sidebar sheet */}
        <span className="font-semibold text-lg">AdminPanelPro</span>
      </div>
      <Link href="/dashboard/profile">
        <Avatar className="size-8">
          <AvatarImage src={user?.photoURL || undefined} alt={superAdminProfile?.name || user?.email || "Admin"} />
          <AvatarFallback>{superAdminProfile?.name?.[0] || user?.email?.[0].toUpperCase() || "A"}</AvatarFallback>
        </Avatar>
      </Link>
    </header>
  );
}

