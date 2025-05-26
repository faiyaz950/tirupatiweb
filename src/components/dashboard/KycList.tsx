
"use client";

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getAllKycRecords } from '@/lib/firestore';
import type { KYC } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
    Loader2, FileText, AlertTriangle, Search, Eye, Users, UserCheck, Briefcase, Cake, Users as UsersIcon, Filter, Server, HelpCircle, XCircle, CheckCircle as VerifiedIcon // Renamed to avoid conflict
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { KycExportButton } from './KycExportButton'; 

const KycCardInfoItem = ({ icon: Icon, label, value }: { icon?: React.ElementType; label: string; value?: string | null | React.ReactNode }) => (
  <div className="flex items-start space-x-2 text-sm">
    {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
    <div>
      <span className="text-muted-foreground">{label}: </span> 
      {typeof value === 'string' || typeof value === 'number' ? <span className="font-medium break-all">{value || 'N/A'}</span> : value}
    </div>
  </div>
);

const getStatusBadge = (status?: KYC['status']) => {
  let IconComponent: React.ElementType = HelpCircle; // Default for pending
  let badgeVariant: "default" | "destructive" | "secondary" = "secondary";
  let badgeClassName = "bg-yellow-500 hover:bg-yellow-600 text-white"; 

  if (status === 'verified') {
    IconComponent = VerifiedIcon;
    badgeVariant = "default";
    badgeClassName = "bg-green-500 hover:bg-green-600";
  } else if (status === 'rejected') {
    IconComponent = XCircle; 
    badgeVariant = "destructive";
    badgeClassName = "bg-red-500 hover:bg-red-600";
  }

  const statusText = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending';

  return (
    <Badge variant={badgeVariant} className={`text-xs px-2 py-1 ${badgeClassName}`}>
      <IconComponent className="mr-1 h-3.5 w-3.5" />
      {statusText}
    </Badge>
  );
};

export function KycList() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: kycRecords, isLoading, error, refetch } = useQuery<KYC[]>({
    queryKey: ['kycRecords', statusFilter, searchTerm],
    queryFn: () => getAllKycRecords({ 
      status: statusFilter === 'all' ? undefined : statusFilter,
      searchQuery: searchTerm 
    }),
  });

  const filteredKycRecords = kycRecords; 

  if (isLoading) {
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
                Review and manage all KYC submissions.
              </CardDescription>
            </div>
            <KycExportButton kycData={kycRecords || []} isLoading={isLoading} />
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by name or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 text-base py-3 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[240px] text-base py-3 rounded-lg">
                <Filter className="mr-2 h-5 w-5 text-muted-foreground" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-base">All Statuses</SelectItem>
                <SelectItem value="pending" className="text-base">Pending</SelectItem>
                <SelectItem value="verified" className="text-base">Verified</SelectItem>
                <SelectItem value="rejected" className="text-base">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {filteredKycRecords && filteredKycRecords.length === 0 ? (
         <Card className="shadow-lg rounded-xl">
          <CardContent className="text-center py-12">
            <Server className="mx-auto h-16 w-16 text-muted-foreground/70 mb-6" />
            <p className="text-xl font-semibold text-muted-foreground mb-2">No KYC Records Found</p>
            <p className="text-md text-muted-foreground">
              {searchTerm || statusFilter !== 'all' ? "Try adjusting your search or filter." : "No KYC submissions yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKycRecords?.map((kyc) => {
            const applicantPhotoUrl = kyc.documents && kyc.documents.length > 2 ? kyc.documents[2] : undefined;
            return (
            <Card key={kyc.id} className="rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out flex flex-col overflow-hidden hover:-translate-y-1">
              <CardHeader className="p-5 bg-muted/30">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary">
                    <AvatarImage src={applicantPhotoUrl || undefined} alt={kyc.personal_info?.name || 'User'} />
                    <AvatarFallback className="text-2xl">
                      {kyc.personal_info?.name ? kyc.personal_info.name.charAt(0).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl font-bold">{kyc.personal_info?.name || 'N/A'}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground min-h-[1.25rem]">
                      {kyc.status === 'verified' && kyc.verified_by ? (
                        <span className="flex items-center"><UserCheck className="mr-1 h-4 w-4 text-green-600" /> Verified By: {kyc.verified_by}</span>
                      ) : kyc.user_id || ''}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-3 flex-grow">
                <KycCardInfoItem icon={Briefcase} label="Company" value={kyc.professional_info?.company_name} />
                <KycCardInfoItem icon={Briefcase} label="Designation" value={kyc.professional_info?.designation} />
                <KycCardInfoItem icon={Cake} label="Age" value={kyc.personal_info?.age} />
                <KycCardInfoItem icon={UsersIcon} label="Gender" value={kyc.personal_info?.gender} />
                <KycCardInfoItem label="Status" value={getStatusBadge(kyc.status)} />
              </CardContent>
              <CardFooter className="p-5 border-t bg-muted/20">
                <Link href={`/dashboard/kyc/${kyc.id}`} passHref className="w-full">
                  <Button variant="outline" className="w-full">
                    <Eye className="mr-2 h-4 w-4" /> View Details
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          )})}
        </div>
      )}
    </div>
  );
}
