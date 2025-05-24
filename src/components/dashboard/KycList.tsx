
"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getKycById } from '@/lib/firestore'; // Corrected import: getKycRecordById to getKycById
import type { KYC } from '@/types';
import { 
  Loader2, FileText, AlertTriangle, ArrowLeft, Building, User, Briefcase, Cake, Users as UsersIcon, 
  Home, MapPin, Phone, Mail, CreditCard, Banknote, File, UserCheck, Calendar, Book, FileSignature 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const KycCardInfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null | React.ReactNode }) => (
  <div className="flex items-center space-x-2 text-sm">
    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
    <div>
      <span className="text-muted-foreground">{label}: </span> 
      {typeof value === 'string' || typeof value === 'number' ? <span className="font-medium break-all">{value || 'N/A'}</span> : value}
    </div>
  </div>
);

const getStatusBadge = (status?: KYC['status']) => { // Added optional chaining for status
  let IconComponent = FileText;
  let variant: "default" | "destructive" | "secondary" = "secondary";
  let className = "bg-yellow-500 hover:bg-yellow-600 text-white"; // Default for pending or undefined

  if (status === 'verified') {
    IconComponent = UserCheck;
    variant = "default";
    className = "bg-green-500 hover:bg-green-600";
  } else if (status === 'rejected') {
    IconComponent = FileText; // Or XCircle from lucide-react if preferred
    variant = "destructive";
    className = "bg-red-500 hover:bg-red-600";
  }


  const statusText = status && typeof status === 'string' 
  ? status.charAt(0).toUpperCase() + status.slice(1)
  : 'Pending'; // Default text if status is undefined

  return (
    <Badge variant={variant} className={`text-xs px-2 py-1 ${className}`}>
      <IconComponent className="mr-1 h-3.5 w-3.5" />
      {statusText}
    </Badge>
  );
};

interface KycDetailProps {
  params: { id: string };
}

// Note: The filename is KycList.tsx, but this component acts as a detail view for a single KYC.
// This might be a source of confusion. For clarity, it could be renamed to KycDetailCard or similar if it's used as such.
export default function KycDetail({ params }: KycDetailProps) {
  const router = useRouter();
  const { id } = params;

  const { data: kyc, isLoading, error, refetch } = useQuery<KYC | null>({ // Added | null for consistency with getKycById
    queryKey: ['kycRecord', id],
    queryFn: () => getKycById(id), // Corrected function call: getKycRecordById to getKycById
    staleTime: 5 * 60 * 1000,
    enabled: !!id, // Ensure query only runs if id is present
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading KYC details...</p>
      </div>
    );
  }

  if (error || !kyc) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-8">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading KYC Details</h2>
        <p className="text-muted-foreground mb-4">{error?.message || 'KYC Record not found.'}</p>
        <Button onClick={() => refetch()}>Retry</Button>
        <Link href="/dashboard/kyc" passHref>
          <Button variant="outline" className="mt-2"><ArrowLeft className="mr-2 h-4 w-4" /> Back to KYC List</Button>
        </Link>
      </div>
    );
  }
  
  // Ensure personal_info, professional_info, bank_info, and documents exist, providing empty objects as fallbacks.
  const pInfo = kyc.personal_info || {};
  const profInfo = kyc.professional_info || {};
  const bankInfo = kyc.bank_info || {};
  const docs = kyc.document_info || {}; // Assuming documents are in document_info as per type, if it's an array use kyc.documents || []

  return (
    <div className="space-y-8 p-6">
      <Card className="shadow-lg rounded-xl">
        <CardHeader className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold text-primary flex items-center">
                <FileText className="mr-3 h-8 w-8" /> KYC Details
              </CardTitle>
              <CardDescription className="text-lg text-muted-foreground mt-1">
                Detailed view of KYC submission for {pInfo.name || 'N/A'}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Personal Info Section */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <KycCardInfoItem icon={User} label="Prefix" value={pInfo.prefix} />
              <KycCardInfoItem icon={User} label="Name" value={pInfo.name} />
              {/* Assuming father_husband_name might not exist, use father_name from type */}
              <KycCardInfoItem icon={UsersIcon} label="Father/Husband Name" value={pInfo.father_name} /> 
              <KycCardInfoItem icon={Calendar} label="Date of Birth" value={pInfo.dob} />
              <KycCardInfoItem icon={Cake} label="Age" value={pInfo.age} />
              <KycCardInfoItem icon={UsersIcon} label="Gender" value={pInfo.gender} />
              <KycCardInfoItem icon={UsersIcon} label="Marital Status" value={pInfo.marital_status} />
              <KycCardInfoItem icon={Home} label="Address" value={pInfo.address} />
              <KycCardInfoItem icon={MapPin} label="State" value={pInfo.state} />
              <KycCardInfoItem icon={MapPin} label="Pincode" value={pInfo.pincode} />
              <KycCardInfoItem icon={Phone} label="Phone" value={pInfo.mobile} />
              <KycCardInfoItem icon={Phone} label="Alternative Phone" value={pInfo.alt_mobile} />
              <KycCardInfoItem icon={Mail} label="Email" value={pInfo.email} />
            </div>
          </div>

          {/* Professional Info Section */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Professional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <KycCardInfoItem icon={CreditCard} label="Aadhar Number" value={profInfo.aadhar_number} />
              <KycCardInfoItem icon={User} label="Name as per Aadhar" value={profInfo.name_as_per_aadhar} />
              <KycCardInfoItem icon={Phone} label="Mobile Linked to Aadhar" value={profInfo.mobile_linked_to_aadhar} />
              <KycCardInfoItem icon={CreditCard} label="PAN Number" value={profInfo.pan_number} />
              <KycCardInfoItem icon={CreditCard} label="UAN Number" value={profInfo.uan_number} />
              <KycCardInfoItem icon={CreditCard} label="ESIC Number" value={profInfo.esic_number} />
              <KycCardInfoItem icon={Building} label="Company Name" value={profInfo.company_name} />
              <KycCardInfoItem icon={Briefcase} label="Department" value={profInfo.department} />
              <KycCardInfoItem icon={Briefcase} label="Designation" value={profInfo.designation} />
              <KycCardInfoItem icon={Book} label="Education" value={profInfo.education} />
              <KycCardInfoItem icon={Calendar} label="Date of Joining" value={profInfo.joining_date} />
              {/* Remarks from professional_info was not in the recent request, keep if needed, else remove */}
              {/* <KycCardInfoItem icon={FileSignature} label="Remarks" value={profInfo.remarks} /> */}
            </div>
          </div>

          {/* Bank Info Section */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Bank Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <KycCardInfoItem icon={Banknote} label="Account Number" value={bankInfo.account_number} />
              <KycCardInfoItem icon={Building} label="Bank Name" value={bankInfo.bank_name} />
              <KycCardInfoItem icon={Building} label="Branch Name" value={bankInfo.branch_name} />
              <KycCardInfoItem icon={CreditCard} label="IFSC Code" value={bankInfo.ifsc_code} />
            </div>
          </div>

          {/* Documents Section - Assuming document_info holds URLs and not an array of strings */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> {/* Changed to 3 columns for better layout */}
              {docs.aadhar_card_url && (
                <Link href={docs.aadhar_card_url} target="_blank" rel="noopener noreferrer" className="block text-blue-500 hover:underline">
                   <KycCardInfoItem icon={File} label="Aadhar Card" value="View Document" />
                </Link>
              )}
              {docs.pan_card_url && (
                 <Link href={docs.pan_card_url} target="_blank" rel="noopener noreferrer" className="block text-blue-500 hover:underline">
                   <KycCardInfoItem icon={File} label="PAN Card" value="View Document" />
                 </Link>
              )}
               {docs.photo_url && (
                 <Link href={docs.photo_url} target="_blank" rel="noopener noreferrer" className="block text-blue-500 hover:underline">
                   <KycCardInfoItem icon={File} label="Photo" value="View Document" />
                 </Link>
              )}
              {(!docs.aadhar_card_url && !docs.pan_card_url && !docs.photo_url) && (
                <KycCardInfoItem icon={File} label="Documents" value="No documents uploaded" />
              )}
            </div>
          </div>

          {/* Verification Info */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Verification Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <KycCardInfoItem icon={UserCheck} label="Status" value={getStatusBadge(kyc.status)} />
              <KycCardInfoItem icon={User} label="Verified By" value={kyc.verifiedBy || 'N/A'} />
              <KycCardInfoItem icon={Calendar} label="Verified At" value={kyc.verifiedAt ? new Date(kyc.verifiedAt.toString()).toLocaleDateString() : 'N/A'} />
              {/* <KycCardInfoItem icon={Calendar} label="Updated At" value={kyc.updatedAt ? new Date(kyc.updatedAt.toString()).toLocaleDateString() : 'N/A'} /> */}
              {/* <KycCardInfoItem icon={Calendar} label="Created At" value={kyc.created_at ? new Date(kyc.created_at.toString()).toLocaleDateString() : 'N/A'} /> */}
              {/* <KycCardInfoItem icon={User} label="User ID" value={kyc.user_id} /> */}
              <KycCardInfoItem icon={FileSignature} label="Remarks" value={kyc.remarks || 'N/A'} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

