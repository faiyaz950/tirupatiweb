
"use client";

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllAdmins } from '@/lib/firestore';
import type { Admin } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, Users, AlertTriangle, Search, Building, PlusCircle, Eye, Mail, Briefcase, CheckCircle, ExternalLink, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

const companyOptions = [
  { value: 'All', label: 'All Companies' },
  { value: 'Tirupati Industrial Services', label: 'Tirupati Industrial Services' },
  { value: 'Maxline Facilities', label: 'Maxline Facilities' },
];

const AdminInfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) => (
  <div className="flex items-start space-x-2 text-sm">
    <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
    <div>
      <span className="text-muted-foreground">{label}: </span> 
      <span className="font-medium break-all">{value || 'N/A'}</span>
    </div>
  </div>
);

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
       admin.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedCompany === 'All' || admin.selectedCompany === selectedCompany)
    );
  }, [admins, searchTerm, selectedCompany]);

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

  return (
    <div className="space-y-8">
      <Card className="shadow-lg rounded-xl">
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
                className="pl-12 text-base py-3 rounded-lg"
              />
            </div>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="w-full sm:w-[280px] text-base py-3 rounded-lg">
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
      </Card>

      {filteredAdmins.length === 0 ? (
        <Card className="shadow-lg rounded-xl">
          <CardContent className="text-center py-12">
            <Users className="mx-auto h-16 w-16 text-muted-foreground/70 mb-6" />
            <p className="text-xl font-semibold text-muted-foreground mb-2">No Admin Accounts Found</p>
            <p className="text-md text-muted-foreground">
              {searchTerm || selectedCompany !== 'All' ? "Try adjusting your search or filter." : "Create an admin account to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAdmins.map((admin) => (
            <Card key={admin.id} className="rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out flex flex-col overflow-hidden hover:-translate-y-1">
              <CardHeader className="p-5 bg-muted/30">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary">
                    <AvatarImage src={undefined /* admin.photoURL */} alt={admin.name} />
                    <AvatarFallback className="text-2xl">{admin.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl font-bold">{admin.name}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">{admin.designation}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-3 flex-grow">
                <AdminInfoItem icon={Mail} label="Email" value={admin.email} />
                <AdminInfoItem icon={Building} label="Company" value={admin.selectedCompany || admin.company} />
                <AdminInfoItem icon={Briefcase} label="Department" value={admin.department} />
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <span className="text-muted-foreground">Availability: </span> 
                    <Badge
                        variant={admin.availability && admin.availability.toLowerCase().includes('available') ? 'default' : 'secondary'}
                        className={`text-xs px-2 py-0.5 ${admin.availability && admin.availability.toLowerCase().includes('available') ? 'bg-green-100 text-green-700 border-green-300' : 'bg-orange-100 text-orange-700 border-orange-300'}`}
                      >
                         {admin.availability && admin.availability.toLowerCase().includes('available') ? <CheckCircle className="mr-1 h-3 w-3" /> : null}
                        {admin.availability || 'N/A'}
                      </Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-5 border-t bg-muted/20">
                <Link href={`/dashboard/admins/${admin.id}`} passHref className="w-full">
                  <Button variant="outline" className="w-full">
                    <Eye className="mr-2 h-4 w-4" /> View Profile
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

    