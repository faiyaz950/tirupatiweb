
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  UserPlus,
  Users,
  FileText,
  UserCircle,
  LogOut,
  Menu,
  Settings, // Kept if you plan to use it
  X as CloseIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import type { ReactNode } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/add-admin", label: "Add Admin", icon: UserPlus },
  { href: "/dashboard/admins", label: "All Admins", icon: Users },
  { href: "/dashboard/kyc", label: "KYC Records", icon: FileText },
  { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
  // { href: "/dashboard/settings", label: "Settings", icon: Settings }, // Example
];

interface NavLinkProps {
  href: string;
  label: string;
  icon: React.ElementType;
  onClick?: () => void; // For closing sheet on mobile
}

const NavLink = ({ href, label, icon: Icon, onClick }: NavLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link href={href} passHref legacyBehavior>
      <a
        onClick={onClick}
        className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                    ${isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
                    }`}
      >
        <Icon className="mr-3 h-5 w-5" />
        {label}
      </a>
    </Link>
  );
};

interface SidebarContentLayoutProps {
  isMobileSheet: boolean;
}

const SidebarContentLayout = ({ isMobileSheet }: SidebarContentLayoutProps) => {
  const { user, superAdminProfile, signOut } = useAuth();

  if (!user) return null;

  return (
    <div className="flex flex-col h-full" data-sidebar="sidebar"> {/* Apply gradient via CSS to this element */}
      <div className="p-4 flex flex-col items-center border-b border-sidebar-border/20">
        <Link href="/dashboard" className="flex items-center gap-2 text-sidebar-foreground mb-2">
          <svg width="40" height="35" viewBox="0 0 80 69" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <polygon points="0,0 39,0 30,54 0,54" fill="#604238" />
            <polygon points="41,0 80,0 80,54 50,54" fill="#bc2c26" />
            <path d="M40,8 C35,25 35,45 40,52 C45,45 45,25 40,8 Z" fill="white"/>
            <rect x="0" y="54" width="80" height="15" fill="#bc2c26" />
            <text x="40" y="61.5" fontFamily="Arial, Helvetica, sans-serif" fontSize="9" fill="white" textAnchor="middle" fontWeight="bold" dominantBaseline="central">TIRUPATI</text>
          </svg>
          <span className="font-semibold text-xl tracking-tight">AdminPanelPro</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <nav className="flex flex-col space-y-1 p-3">
          {navItems.map((item) => (
            isMobileSheet ? (
              <SheetClose asChild key={item.href}>
                 <NavLink {...item} />
              </SheetClose>
            ) : (
              <NavLink key={item.href} {...item} />
            )
          ))}
        </nav>
      </ScrollArea>
      <Separator className="bg-sidebar-border/20" />
      <div className="p-4 border-t border-sidebar-border/20">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/dashboard/profile" passHref>
            {isMobileSheet ? (
              <SheetClose asChild>
                <Avatar className="h-10 w-10 cursor-pointer border-2 border-sidebar-accent">
                  <AvatarImage src={user.photoURL || undefined} alt={superAdminProfile?.name || user.email || "Admin"} />
                  <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                    {superAdminProfile?.name?.[0] || user.email?.[0].toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
              </SheetClose>
            ) : (
              <Avatar className="h-10 w-10 cursor-pointer border-2 border-sidebar-accent">
                <AvatarImage src={user.photoURL || undefined} alt={superAdminProfile?.name || user.email || "Admin"} />
                <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                  {superAdminProfile?.name?.[0] || user.email?.[0].toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
            )}
          </Link>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-sidebar-foreground truncate max-w-[150px]">{superAdminProfile?.name || user.email}</p>
            {isMobileSheet ? (
              <SheetClose asChild>
                <Link href="/dashboard/profile" className="text-xs hover:underline text-sidebar-foreground/70">
                  View Profile
                </Link>
              </SheetClose>
            ) : (
              <Link href="/dashboard/profile" className="text-xs hover:underline text-sidebar-foreground/70">
                View Profile
              </Link>
            )}
          </div>
        </div>
        {isMobileSheet ? (
          <SheetClose asChild>
            <Button
              variant="ghost"
              onClick={signOut}
              className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/80"
              title="Logout"
            >
              <LogOut className="mr-2 h-5 w-5" />
              Logout
            </Button>
          </SheetClose>
        ) : (
          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/80"
            title="Logout"
          >
            <LogOut className="mr-2 h-5 w-5" />
            Logout
          </Button>
        )}
      </div>
    </div>
  );
};

export function AppSidebar({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 fixed inset-y-0 z-30">
         <SidebarContentLayout isMobileSheet={false} />
      </aside>

      {/* Mobile Sidebar Trigger & Sheet */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-sm">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 border-r-0">
            <SidebarContentLayout isMobileSheet={true} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Removed pt-20 that might have been added for a fixed header */}
        {children}
      </div>
    </div>
  );
}
