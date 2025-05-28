
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminById, deleteAdminById } from '@/lib/firestore'; // Added deleteAdminById
import type { Admin } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertTriangle, Mail, Phone, Briefcase, MapPin, Building, CalendarDays, Clock, Trash2 } from 'lucide-react'; // Added Trash2
import { format, parseISO } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Added AlertDialog imports
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AdminProfilePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const adminId = params.adminId as string;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: admin, isLoading, error, refetch } = useQuery<Admin | null>({
    queryKey: ['admin', adminId],
    queryFn: () => getAdminById(adminId),
    enabled: !!adminId,
  });

  const deleteAdminMutation = useMutation({
    mutationFn: () => deleteAdminById(adminId),
    onSuccess: () => {
      toast({
        title: "Admin Deleted",
        description: `${admin?.name || 'Admin'} has been successfully deleted.`,
      });
      queryClient.invalidateQueries({ queryKey: ['admins'] }); // Invalidate admin list
      router.push('/dashboard/admins');
    },
    onError: (err: Error) => {
      toast({
        title: "Deletion Failed",
        description: `Could not delete admin: ${err.message}`,
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
    },
  });

  const handleDeleteAdmin = () => {
    deleteAdminMutation.mutate();
  };

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
  
  const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | null | Date }) => {
    let displayValue: string | React.ReactNode = 'N/A';
    if (value instanceof Date) {
        displayValue = format(value, "PPPpp");
    } else if (typeof value === 'string' && value.includes('T') && value.includes('Z')) { // Basic check for ISO string
        try {
            displayValue = format(parseISO(value), "PPPpp");
        } catch (e) {
            displayValue = value; // Fallback to original string if parsing fails
        }
    } else if (value) {
        displayValue = String(value);
    }
    return (
        <div className="flex items-start space-x-3">
          <Icon className="h-5 w-5 text-primary mt-1 shrink-0" />
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-medium break-words">
                {displayValue}
            </p>
          </div>
        </div>
    );
};


  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <div className="mb-6 flex justify-between items-center">
        <Button variant="outline" asChild>
          <Link href="/dashboard/admins"><ArrowLeft className="mr-2 h-4 w-4" /> Back to All Admins</Link>
        </Button>
      </div>
      
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
            value={admin.createdAt ? (typeof admin.createdAt === 'string' ? admin.createdAt : (admin.createdAt as Date)) : undefined} 
          />
          <DetailItem 
            icon={CalendarDays} 
            label="Last Login" 
            value={admin.lastLogin ? (typeof admin.lastLogin === 'string' ? admin.lastLogin : (admin.lastLogin as Date)) : undefined} 
           />
        </CardContent>
        <CardFooter className="p-6 border-t flex justify-end">
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Admin
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the admin profile
                        for <span className="font-semibold">{admin.name}</span>. Their KYC data will NOT be affected.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleteAdminMutation.isPending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDeleteAdmin}
                        disabled={deleteAdminMutation.isPending}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        {deleteAdminMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Confirm Delete
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}
