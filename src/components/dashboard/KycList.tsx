
"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllKycRecords } from '@/lib/firestore';
import type { KYC } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
    Loader2, FileText, AlertTriangle, Search, Filter, 
    CheckCircle, XCircle, HelpCircle, Eye, Building, User 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { KycExportButton } from './KycExportButton';

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'verified', label: 'Verified' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
];

const KycCardInfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) => (
  <div className="flex items-center space-x-2 text-sm">
    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
    <div>
      <span className="text-muted-foreground">{label}: </span> 
      <span className="font-medium break-all">{value || 'N/A'}</span>
    </div>
  </div>
);

export function KycList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: kycRecords = [], isLoading, error, refetch } = useQuery<KYC[]>({
    queryKey: ['kycRecords', { searchQuery: searchTerm, status: filterStatus }],
    queryFn: () => getAllKycRecords({ searchQuery: searchTerm, status: filterStatus === 'all' ? undefined : filterStatus }),
    staleTime: 5 * 60 * 1000, 
  });

  if (isLoading && !kycRecords?.length) { 
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading KYC records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-8">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading KYC Records</h2>
        <p className="text-muted-foreground mb-4">Could not load KYC data: {error.message}</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  const getStatusBadge = (status: KYC['status']) => {
    let IconComponent = HelpCircle;
    let variant: "default" | "destructive" | "secondary" = "secondary";
    let className = "bg-yellow-500 hover:bg-yellow-600 text-white";

    if (status === 'verified') {
      IconComponent = CheckCircle;
      variant = "default";
      className = "bg-green-500 hover:bg-green-600";
    } else if (status === 'rejected') {
      IconComponent = XCircle;
      variant = "destructive";
      className = "bg-red-500 hover:bg-red-600";
    }

    return (
      <Badge variant={variant} className={`text-xs px-2 py-1 ${className}`}>
        <IconComponent className="mr-1 h-3.5 w-3.5" />
        {status && typeof status === 'string' 
          ? status.charAt(0).toUpperCase() + status.slice(1)
          : 'N/A'
        }
      </Badge>
    );
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg rounded-xl">
        <CardHeader className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-3xl font-bold text-primary flex items-center">
                <FileText className="mr-3 h-8 w-8" /> KYC Records
              </CardTitle>
              <CardDescription className="text-lg text-muted-foreground mt-1">
                View, search, and manage KYC submissions.
              </CardDescription>
            </div>
            <KycExportButton kycData={kycRecords} isLoading={isLoading} />
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by name, user ID, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 text-base py-3 rounded-lg"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[240px] text-base py-3 rounded-lg">
                <Filter className="mr-2 h-5 w-5 text-muted-foreground" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value} className="text-base">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {isLoading && kycRecords.length === 0 && <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
      
      {!isLoading && kycRecords.length === 0 ? (
        <Card className="shadow-lg rounded-xl">
          <CardContent className="text-center py-12">
            <FileText className="mx-auto h-16 w-16 text-muted-foreground/70 mb-6" />
            <p className="text-xl font-semibold text-muted-foreground mb-2">No KYC Records Found</p>
            <p className="text-md text-muted-foreground">
              {searchTerm || filterStatus !== 'all' ? "Try adjusting your search or filter." : "There are no KYC submissions yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kycRecords.map((kyc) => (
            <Card key={kyc.id} className="rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out flex flex-col overflow-hidden hover:-translate-y-1">
              <CardHeader className="p-5 bg-muted/30">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary">
                    <AvatarFallback className="text-2xl">{kyc.personal_info?.name?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl font-bold truncate" title={kyc.personal_info?.name || 'N/A'}>{kyc.personal_info?.name || 'N/A'}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">User ID: {kyc.userId || 'N/A'}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-3 flex-grow">
                <KycCardInfoItem icon={Building} label="Company" value={kyc.professional_info?.company_name} />
                <div className="flex items-center space-x-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" /> {/* Using User as a generic status icon placeholder before badge */}
                  <div>
                     <span className="text-muted-foreground">Status: </span>
                     {getStatusBadge(kyc.status)}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-5 border-t bg-muted/20">
                <Link href={`/dashboard/kyc/${kyc.id}`} passHref className="w-full">
                  <Button variant="outline" className="w-full">
                    <Eye className="mr-2 h-4 w-4" /> View Details
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
