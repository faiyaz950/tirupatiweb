
"use client";

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllAdmins } from '@/lib/firestore';
import type { Admin } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, Users, AlertTriangle, Search, Building, PlusCircle, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// import { formatDistanceToNow } from 'date-fns'; // No longer needed

const companyOptions = [
  { value: 'All', label: 'All Companies' },
  { value: 'Tirupati Industrial Services', label: 'Tirupati Industrial Services' },
  { value: 'Maxline Facilities', label: 'Maxline Facilities' },
];

export function AdminList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('All');

  const { data: admins, isLoading, error, refetch } = useQuery<Admin[]>({
    queryKey: ['admins', selectedCompany], 
    queryFn: () => getAllAdmins(selectedCompany === 'All' ? undefined : selectedCompany),
  });

  const filteredAdmins = useMemo(() => {
    if (!admins) return [];
    return admins.filter(admin =>
      (admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       admin.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [admins, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading admins...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-8">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading Admins</h2>
        <p className="text-muted-foreground mb-4">Could not load admin data: {error.message}</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }
  
  // const formatLastLogin = (lastLogin: Admin['lastLogin']) => { // No longer needed
  //   if (!lastLogin) return 'Never';
  //   try {
  //     const date = typeof lastLogin === 'string' ? new Date(lastLogin) : (lastLogin as any).toDate ? (lastLogin as any).toDate() : lastLogin;
  //     return formatDistanceToNow(date, { addSuffix: true });
  //   } catch (e) {
  //     return 'Invalid Date';
  //   }
  // };


  return (
    <Card className="shadow-xl rounded-2xl hover:shadow-2xl transition-shadow duration-300">
      <CardHeader className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-3xl font-bold text-primary flex items-center">
              <Users className="mr-3 h-8 w-8" /> Administrator Accounts
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground mt-1">
              Oversee and manage all admin user profiles.
            </CardDescription>
          </div>
          <Link href="/dashboard/add-admin" passHref>
            <Button className="text-base py-3 px-6">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Admin
            </Button>
          </Link>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 text-base py-3"
            />
          </div>
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-full sm:w-[280px] text-base py-3">
              <Building className="mr-2 h-5 w-5 text-muted-foreground" />
              <SelectValue placeholder="Filter by company entity" />
            </SelectTrigger>
            <SelectContent>
              {companyOptions.map(option => (
                <SelectItem key={option.value} value={option.value} className="text-base">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {filteredAdmins.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-16 w-16 text-muted-foreground/70 mb-6" />
            <p className="text-xl font-semibold text-muted-foreground mb-2">No Admin Accounts Found</p>
            <p className="text-md text-muted-foreground">
              {searchTerm || selectedCompany !== 'All' ? "Try adjusting your search or filter." : "Create an admin account to get started."}
            </p>
          </div>
        ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-base font-semibold">Name</TableHead>
                <TableHead className="text-base font-semibold">Email</TableHead>
                <TableHead className="text-base font-semibold">Company</TableHead>
                <TableHead className="text-base font-semibold">Designation</TableHead>
                <TableHead className="text-base font-semibold">Availability</TableHead>
                {/* Last Login column removed */}
                <TableHead className="text-right text-base font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdmins.map((admin) => (
                <TableRow key={admin.id} className="hover:bg-muted/30 transition-colors duration-150">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-primary/50">
                        <AvatarImage src={undefined /* admin.photoURL */} alt={admin.name} />
                        <AvatarFallback className="text-base">{admin.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-base">{admin.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-base text-muted-foreground">{admin.email}</TableCell>
                  <TableCell className="text-base">{admin.selectedCompany || admin.company}</TableCell>
                  <TableCell className="text-base">{admin.designation}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={admin.availability && admin.availability.toLowerCase().includes('available') ? 'default' : 'secondary'}
                      className={`text-sm px-3 py-1 ${admin.availability && admin.availability.toLowerCase().includes('available') ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-400 hover:bg-orange-500 text-white'}`}
                    >
                      {admin.availability || 'N/A'}
                    </Badge>
                  </TableCell>
                  {/* Cell for Last Login removed */}
                  <TableCell className="text-right">
                    <Link href={`/dashboard/admins/${admin.id}`} passHref>
                      <Button variant="outline" size="sm" className="text-base">
                        <Eye className="mr-2 h-4 w-4" /> View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        )}
      </CardContent>
    </Card>
  );
}
