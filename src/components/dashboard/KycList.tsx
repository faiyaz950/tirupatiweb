
"use client";

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllKycRecords } from '@/lib/firestore';
import type { KYC } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, FileText, AlertTriangle, Search, Filter, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KycExportButton } from './KycExportButton';
// import { formatDistanceToNow } from 'date-fns'; // No longer needed here


const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'verified', label: 'Verified' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
];

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
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading KYC records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading KYC Records</h2>
        <p className="text-muted-foreground mb-4">Could not load KYC data: {error.message}</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }
  
  // const formatSubmittedAt = (submittedAt: KYC['submittedAt']) => { // No longer needed here
  //   if (!submittedAt) return 'N/A';
  //   try {
  //     const date = typeof submittedAt === 'string' ? new Date(submittedAt) : (submittedAt as any).toDate ? (submittedAt as any).toDate() : submittedAt;
  //     return formatDistanceToNow(date, { addSuffix: true });
  //   } catch (e) {
  //     return 'Invalid Date';
  //   }
  // };


  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2"><FileText /> KYC Records</CardTitle>
            <CardDescription>View, search, and manage KYC submissions.</CardDescription>
          </div>
          <KycExportButton kycData={kycRecords} isLoading={isLoading} />
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by name or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
        {!isLoading && kycRecords.length === 0 ? (
          <div className="text-center py-10">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No KYC records found matching your criteria.</p>
            {(searchTerm || filterStatus !== 'all') && <p className="text-sm text-muted-foreground">Try adjusting your search or filter.</p>}
          </div>
        ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Company</TableHead>
                {/* <TableHead>Submitted</TableHead> Removed this column */}
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kycRecords.map((kyc) => (
                <TableRow key={kyc.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{kyc.personal_info?.name?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{kyc.personal_info?.name || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>{kyc.professional_info?.company_name || 'N/A'}</TableCell>
                  {/* <TableCell>{formatSubmittedAt(kyc.submittedAt)}</TableCell> Removed this cell */}
                  <TableCell>
                    <Badge 
                      variant={kyc.status === 'verified' ? "default" : kyc.status === 'rejected' ? "destructive" : "secondary"} 
                      className={
                        kyc.status === 'verified' ? "bg-green-500 hover:bg-green-600" : 
                        kyc.status === 'rejected' ? "bg-red-500 hover:bg-red-600" :
                        "bg-yellow-500 hover:bg-yellow-600 text-white" // For pending
                      }
                    >
                      {kyc.status === 'verified' && <CheckCircle className="mr-1 h-3.5 w-3.5" />}
                      {kyc.status === 'rejected' && <XCircle className="mr-1 h-3.5 w-3.5" />}
                      {kyc.status === 'pending' && <HelpCircle className="mr-1 h-3.5 w-3.5" />}
                      {kyc.status && typeof kyc.status === 'string' 
                        ? kyc.status.charAt(0).toUpperCase() + kyc.status.slice(1)
                        : 'N/A'
                      }
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/kyc/${kyc.id}`} passHref>
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

    