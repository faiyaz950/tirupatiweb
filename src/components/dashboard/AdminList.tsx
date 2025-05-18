
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
import { Loader2, Users, AlertTriangle, Search, Building, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

const companyOptions = [
  { value: 'All', label: 'All Companies' },
  { value: 'Tirupati Industrial Services', label: 'Tirupati Industrial Services' },
  { value: 'Maxline Facilities', label: 'Maxline Facilities' },
];

export function AdminList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('All');

  const { data: admins, isLoading, error } = useQuery<Admin[]>({
    queryKey: ['admins', selectedCompany], // Refetch when selectedCompany changes
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
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading admins...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading Admins</h2>
        <p className="text-muted-foreground mb-4">Could not load admin data: {error.message}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }
  
  const formatLastLogin = (lastLogin: Admin['lastLogin']) => {
    if (!lastLogin) return 'Never';
    try {
      const date = typeof lastLogin === 'string' ? new Date(lastLogin) : (lastLogin as any).toDate ? (lastLogin as any).toDate() : lastLogin;
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return 'Invalid Date';
    }
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2"><Users /> All Admins</CardTitle>
            <CardDescription>View, search, and manage admin accounts.</CardDescription>
          </div>
          <Link href="/dashboard/add-admin" passHref>
            <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Admin</Button>
          </Link>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <Building className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Filter by company" />
            </SelectTrigger>
            <SelectContent>
              {companyOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredAdmins.length === 0 ? (
          <div className="text-center py-10">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No admins found matching your criteria.</p>
            {searchTerm && <p className="text-sm text-muted-foreground">Try adjusting your search or filter.</p>}
          </div>
        ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdmins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={undefined /* admin.photoURL */} alt={admin.name} />
                        <AvatarFallback>{admin.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{admin.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>{admin.selectedCompany || admin.company}</TableCell>
                  <TableCell>{admin.designation}</TableCell>
                  <TableCell>
                    <Badge variant={admin.availability === 'Available' ? 'default' : 'secondary' /* Consider proper status logic */}>
                      {admin.availability}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatLastLogin(admin.lastLogin)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/admins/${admin.id}`} passHref>
                      <Button variant="outline" size="sm">View Details</Button>
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
