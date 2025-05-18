
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
  Settings, // Keep settings if you plan to use it
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import type { ReactNode } from 'react';

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
        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${isActive
                      ? "bg-primary/10 text-primary"
                      : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
                    }
                    lg:text-primary-foreground/80 lg:hover:text-primary-foreground lg:hover:bg-white/10
                    ${isActive && "lg:bg-white/20 lg:text-primary-foreground"}`}
      >
        <Icon className="mr-2 h-5 w-5" />
        {label}
      </a>
    </Link>
  );
};

export function DashboardHeader() {
  const { user, superAdminProfile, signOut, loading } = useAuth();

  if (loading && !user) {
    return null; // Or a loading state for the header
  }

  if (!user) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 shadow-md bg-gradient-to-r from-primary via-red-500 to-accent">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and App Name */}
          <Link href="/dashboard" className="flex items-center gap-2 text-primary-foreground">
            <svg width="36" height="31" viewBox="0 0 80 69" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <polygon points="0,0 39,0 30,54 0,54" fill="#604238" />
              <polygon points="41,0 80,0 80,54 50,54" fill="#bc2c26" />
              <path d="M40,8 C35,25 35,45 40,52 C45,45 45,25 40,8 Z" fill="white"/>
              <rect x="0" y="54" width="80" height="15" fill="#bc2c26" />
              <text x="40" y="61.5" fontFamily="Arial, Helvetica, sans-serif" fontSize="9" fill="white" textAnchor="middle" fontWeight="bold" dominantBaseline="central">TIRUPATI</text>
            </svg>
            <span className="font-semibold text-xl tracking-tight">AdminPanelPro</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>

          {/* Right side: Avatar, Logout, and Mobile Menu Trigger */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-3">
              <Link href="/dashboard/profile" passHref>
                <Avatar className="h-9 w-9 cursor-pointer border-2 border-transparent hover:border-white/50 transition-colors">
                  <AvatarImage src={user.photoURL || undefined} alt={superAdminProfile?.name || user.email || "Admin"} />
                  <AvatarFallback>{superAdminProfile?.name?.[0] || user.email?.[0].toUpperCase() || "A"}</AvatarFallback>
                </Avatar>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Mobile Menu */}
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] bg-gradient-to-br from-primary via-red-600 to-accent p-0 text-primary-foreground">
                  <div className="p-4">
                    <Link href="/dashboard" className="flex items-center gap-2 mb-4">
                       <svg width="32" height="27" viewBox="0 0 80 69" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                          <polygon points="0,0 39,0 30,54 0,54" fill="#604238" />
                          <polygon points="41,0 80,0 80,54 50,54" fill="#bc2c26" />
                          <path d="M40,8 C35,25 35,45 40,52 C45,45 45,25 40,8 Z" fill="white"/>
                          <rect x="0" y="54" width="80" height="15" fill="#bc2c26" />
                          <text x="40" y="61.5" fontFamily="Arial, Helvetica, sans-serif" fontSize="9" fill="white" textAnchor="middle" fontWeight="bold" dominantBaseline="central">TIRUPATI</text>
                        </svg>
                      <span className="font-semibold text-lg">AdminPanelPro</span>
                    </Link>
                    <Separator className="bg-white/20 my-3" />
                    <nav className="flex flex-col space-y-1">
                      {navItems.map((item) => (
                         <SheetClose asChild key={item.href}>
                            <NavLink {...item} />
                         </SheetClose>
                      ))}
                    </nav>
                  </div>
                  <Separator className="bg-white/20 my-3" />
                  <div className="p-4 mt-auto">
                    <div className="flex items-center gap-3 mb-3">
                       <Link href="/dashboard/profile" passHref>
                        <SheetClose asChild>
                            <Avatar className="h-9 w-9 cursor-pointer">
                            <AvatarImage src={user.photoURL || undefined} alt={superAdminProfile?.name || user.email || "Admin"} />
                            <AvatarFallback>{superAdminProfile?.name?.[0] || user.email?.[0].toUpperCase() || "A"}</AvatarFallback>
                            </Avatar>
                        </SheetClose>
                       </Link>
                      <div>
                        <p className="text-sm font-medium truncate max-w-[150px]">{superAdminProfile?.name || user.email}</p>
                        <SheetClose asChild>
                          <Link href="/dashboard/profile" className="text-xs hover:underline text-primary-foreground/70">
                            View Profile
                          </Link>
                        </SheetClose>
                      </div>
                    </div>
                    <SheetClose asChild>
                        <Button
                            variant="ghost"
                            onClick={signOut}
                            className="w-full justify-start text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
                            title="Logout"
                        >
                            <LogOut className="mr-2 h-5 w-5" />
                            Logout
                        </Button>
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
