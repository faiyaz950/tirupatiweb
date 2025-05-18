
"use client";

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getAdminById } from '@/lib/firestore';
import type { Admin } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertTriangle, Mail, Phone, Briefcase, MapPin, Building, CalendarDays, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminProfilePage() {
  const params = useParams();
  const adminId = params.adminId as string;

  const { data: admin, isLoading, error } = useQuery<Admin | null>({
    queryKey: ['admin', adminId],
    queryFn: () => getAdminById(adminId),
    enabled: !!adminId,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading admin details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-8">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading Admin</h2>
        <p className="text-muted-foreground mb-4">Could not load admin data: {error.message}</p>
        <Link href="/dashboard/admins" passHref>
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to All Admins</Button>
        </Link>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-8">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Admin Not Found</h2>
        <p className="text-muted-foreground mb-4">The requested admin profile could not be found.</p>
        <Link href="/dashboard/admins" passHref>
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to All Admins</Button>
        </Link>
      </div>
    );
  }
  
  const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | null | Date }) => (
    <div className="flex items-start space-x-3">
      <Icon className="h-5 w-5 text-primary mt-1 shrink-0" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">
            {value instanceof Date ? format(value, "PPPpp") : (value || 'N/A')}
        </p>
      </div>
    </div>
  );


  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <Button variant="outline" asChild className="mb-6">
        <Link href="/dashboard/admins"><ArrowLeft className="mr-2 h-4 w-4" /> Back to All Admins</Link>
      </Button>
      <Card className="shadow-xl">
        <CardHeader className="bg-muted/30 p-6 border-b">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary">
              <AvatarImage src={undefined /* admin.photoURL */} alt={admin.name} />
              <AvatarFallback className="text-3xl">{admin.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl font-bold">{admin.name}</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">{admin.designation} at {admin.selectedCompany || admin.company}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <DetailItem icon={Mail} label="Email" value={admin.email} />
          <DetailItem icon={Phone} label="Mobile" value={admin.mobile} />
          <DetailItem icon={Briefcase} label="Department" value={admin.department} />
          <DetailItem icon={Building} label="Company (Assigned)" value={admin.company} />
          <DetailItem icon={MapPin} label="Address" value={admin.address} />
          <DetailItem icon={Clock} label="Availability" value={admin.availability} />
          <DetailItem 
            icon={CalendarDays} 
            label="Profile Created" 
            value={admin.createdAt ? (typeof admin.createdAt === 'string' ? new Date(admin.createdAt) : admin.createdAt as Date) : undefined} 
          />
          <DetailItem 
            icon={CalendarDays} 
            label="Last Login" 
            value={admin.lastLogin ? (typeof admin.lastLogin === 'string' ? new Date(admin.lastLogin) : admin.lastLogin as Date) : undefined} 
           />
        </CardContent>
        {/* Add Edit/Delete functionality if needed */}
      </Card>
    </div>
  );
}
