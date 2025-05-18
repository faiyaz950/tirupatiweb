
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getKycById, updateKycRecord } from '@/lib/firestore';
import type { KYC, KycPersonalInfo, KycProfessionalInfo, KycBankInfo, KycDocumentInfo } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertTriangle, User, Briefcase, Banknote, FileArchive, CheckCircle, XCircle, Edit3 } from 'lucide-react';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

const SectionTitle = ({ title, icon: Icon }: { title: string; icon: React.ElementType }) => (
  <div className="flex items-center space-x-2 mb-3 mt-4">
    <Icon className="h-5 w-5 text-primary" />
    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
  </div>
);

const InfoItem = ({ label, value }: { label: string; value?: string | null | boolean | Date }) => (
  <div className="grid grid-cols-3 gap-2 py-1.5">
    <span className="text-sm text-muted-foreground col-span-1">{label}:</span>
    <span className="font-medium col-span-2 break-words">
      {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : 
       value instanceof Date ? format(value, "PPP") : 
       (value || 'N/A')}
    </span>
  </div>
);

const ImageViewer = ({ url, label }: {url?: string | null, label: string}) => {
    if (!url) return <InfoItem label={label} value="Not Provided" />;
    return (
        <div className="py-1.5">
            <p className="text-sm text-muted-foreground mb-1">{label}:</p>
            <a href={url} target="_blank" rel="noopener noreferrer" className="block w-full max-w-xs relative group">
                <Image 
                    src={url} 
                    alt={label} 
                    width={300} 
                    height={200} 
                    className="rounded-md object-cover border shadow-sm group-hover:opacity-80 transition-opacity"
                    data-ai-hint="document identification"
                    onError={(e) => (e.currentTarget.src = 'https://placehold.co/300x200.png?text=Preview+Error')}
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm rounded-md">View Full Image</span>
            </a>
        </div>
    );
};


export default function KycDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const kycId = params.kycId as string;

  const { data: kyc, isLoading, error } = useQuery<KYC | null>({
    queryKey: ['kyc', kycId],
    queryFn: () => getKycById(kycId),
    enabled: !!kycId,
  });

  const mutation = useMutation({
    mutationFn: (newStatus: boolean) => updateKycRecord(kycId, { verified: newStatus, status: newStatus ? 'verified' : 'rejected' }),
    onSuccess: (_, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['kyc', kycId] });
      queryClient.invalidateQueries({ queryKey: ['kycRecords'] }); // To update the list page
      toast({ title: "KYC Status Updated", description: `KYC marked as ${newStatus ? 'Verified' : 'Rejected'}.` });
    },
    onError: (err: Error) => {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    }
  });


  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Loading KYC details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-8">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading KYC</h2>
        <p className="text-muted-foreground mb-4">Could not load KYC data: {error.message}</p>
        <Link href="/dashboard/kyc" passHref><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to KYC List</Button></Link>
      </div>
    );
  }

  if (!kyc) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-8">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">KYC Record Not Found</h2>
        <p className="text-muted-foreground mb-4">The requested KYC record could not be found.</p>
        <Link href="/dashboard/kyc" passHref><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to KYC List</Button></Link>
      </div>
    );
  }

  const pInfo = kyc.personal_info || {} as KycPersonalInfo;
  const profInfo = kyc.professional_info || {} as KycProfessionalInfo;
  const bankInfo = kyc.bank_info || {} as KycBankInfo;
  const docInfo = kyc.document_info || {} as KycDocumentInfo;

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <Button variant="outline" asChild className="mb-6">
        <Link href="/dashboard/kyc"><ArrowLeft className="mr-2 h-4 w-4" /> Back to KYC List</Link>
      </Button>
      <Card className="shadow-xl">
        <CardHeader className="bg-muted/30 p-6 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-bold">{pInfo.name || 'N/A'}</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">KYC Details (ID: {kyc.id})</CardDescription>
            </div>
            <Badge variant={kyc.verified ? "default" : "destructive"} className={`text-sm px-3 py-1 mt-2 sm:mt-0 ${kyc.verified ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}`}>
              {kyc.verified ? <CheckCircle className="mr-1.5 h-4 w-4" /> : <XCircle className="mr-1.5 h-4 w-4" />}
              {kyc.verified ? 'Verified' : 'Not Verified'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <SectionTitle title="Personal Information" icon={User} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <InfoItem label="Full Name" value={pInfo.name} />
            <InfoItem label="Date of Birth" value={pInfo.dob} />
            <InfoItem label="Gender" value={pInfo.gender} />
            <InfoItem label="Father's Name" value={pInfo.father_name} />
            <InfoItem label="Mother's Name" value={pInfo.mother_name} />
            <InfoItem label="Mobile Number" value={pInfo.mobile} />
            <InfoItem label="Alternate Mobile" value={pInfo.alt_mobile} />
            <InfoItem label="Email" value={pInfo.email} />
            <InfoItem label="Marital Status" value={pInfo.marital_status} />
            <InfoItem label="Permanent Address" value={pInfo.permanent_address} />
            <InfoItem label="Current Address" value={pInfo.current_address} />
          </div>

          <Separator className="my-6" />
          <SectionTitle title="Professional Information" icon={Briefcase} />
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <InfoItem label="Company Name" value={profInfo.company_name} />
            <InfoItem label="Designation" value={profInfo.designation} />
            <InfoItem label="Department" value={profInfo.department} />
            <InfoItem label="Employee ID" value={profInfo.employee_id} />
            <InfoItem label="Joining Date" value={profInfo.joining_date} />
          </div>

          <Separator className="my-6" />
          <SectionTitle title="Bank Information" icon={Banknote} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <InfoItem label="Bank Name" value={bankInfo.bank_name} />
            <InfoItem label="Account Number" value={bankInfo.account_number} />
            <InfoItem label="IFSC Code" value={bankInfo.ifsc_code} />
            <InfoItem label="Branch Name" value={bankInfo.branch_name} />
          </div>

          <Separator className="my-6" />
          <SectionTitle title="Documents" icon={FileArchive} />
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            <ImageViewer url={docInfo.aadhar_card_url} label="Aadhar Card" />
            <ImageViewer url={docInfo.pan_card_url} label="PAN Card" />
            <ImageViewer url={docInfo.photo_url} label="Applicant Photo" />
          </div>

          <Separator className="my-6" />
          <SectionTitle title="KYC Status" icon={kyc.verified ? CheckCircle : XCircle} />
          <InfoItem label="Current Status" value={kyc.verified ? 'Verified' : 'Not Verified'} />
          <InfoItem label="Remarks" value={kyc.remarks} />
          <InfoItem label="Submitted At" value={kyc.submittedAt ? (typeof kyc.submittedAt === 'string' ? new Date(kyc.submittedAt) : kyc.submittedAt as Date) : undefined} />
          {kyc.verifiedAt && <InfoItem label="Verified At" value={typeof kyc.verifiedAt === 'string' ? new Date(kyc.verifiedAt) : kyc.verifiedAt as Date} />}
          {kyc.verifiedBy && <InfoItem label="Verified By" value={kyc.verifiedBy} />}
        </CardContent>
        <CardFooter className="p-6 border-t flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            {/* Placeholder for edit button if needed */}
            {/* <Button variant="outline" disabled={mutation.isPending}><Edit3 className="mr-2 h-4 w-4"/> Edit KYC</Button> */}
            {!kyc.verified ? (
                <Button 
                    onClick={() => mutation.mutate(true)} 
                    disabled={mutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                >
                    {mutation.isPending && mutation.variables === true ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4"/>}
                    Mark as Verified
                </Button>
            ) : (
                 <Button 
                    variant="destructive" 
                    onClick={() => mutation.mutate(false)} 
                    disabled={mutation.isPending}
                >
                    {mutation.isPending && mutation.variables === false ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <XCircle className="mr-2 h-4 w-4"/>}
                    Mark as Not Verified
                </Button>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}
