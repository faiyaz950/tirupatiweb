
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getKycById, updateKycRecord } from '@/lib/firestore';
import type { KYC, KycPersonalInfo, KycProfessionalInfo, KycBankInfo, KycDocumentInfo } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
    ArrowLeft, Loader2, AlertTriangle, User, Briefcase, Banknote, FileArchive, 
    CheckCircle, XCircle, HelpCircle, Fingerprint, BookUser, Hash, SmartphoneNfc, 
    ScanFace, CalendarDays, Cake, MapPin, CreditCard, Mail, Phone, Home, UserSquare, Landmark, Edit3, CalendarCheck2
} from 'lucide-react'; // Added Home, UserSquare, Landmark, Edit3, CalendarCheck2
import { format, parseISO } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import * as XLSX from 'xlsx'; // For Excel export

const SectionTitle = ({ title, icon: Icon }: { title: string; icon: React.ElementType }) => (
  <div className="flex items-center space-x-2 mb-3 mt-4">
    <Icon className="h-5 w-5 text-primary" />
    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
  </div>
);

const InfoItem = ({ label, value, capitalize = false, icon: Icon, isDate = false }: { label: string; value?: string | null | boolean | Date; capitalize?: boolean; icon?: React.ElementType, isDate?: boolean }) => {
  let displayValue: string | React.ReactNode = 'N/A';
  if (typeof value === 'boolean') {
    displayValue = value ? 'Yes' : 'No';
  } else if (value instanceof Date) {
    displayValue = format(value, "PPP"); // Format: Jun 6, 2024
  } else if (isDate && typeof value === 'string') {
    try {
      // Attempt to parse ISO strings like "1994-05-16T00:00:00.000Z" or "1994-05-16"
      const date = parseISO(value); 
      displayValue = format(date, "PPP");
    } catch (e) {
      // If parsing fails, try to format as if it's already a simple date string or just show original
      try {
        displayValue = format(new Date(value), "PPP");
      } catch (formatErr) {
        displayValue = value; // Fallback to original string if all parsing/formatting fails
      }
    }
  }
  else if (value) {
    displayValue = capitalize ? (String(value).charAt(0).toUpperCase() + String(value).slice(1)) : String(value);
  }

  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 items-start">
      <span className="text-sm text-muted-foreground col-span-1 flex items-center">
        {Icon && <Icon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />}
        {label}:
      </span>
      <span className="font-medium col-span-2 break-words">
        {displayValue}
      </span>
    </div>
  );
};

const ImageViewer = ({ url, label }: { url?: string | null; label: string }) => {
  const placeholderSrc = 'https://placehold.co/300x200.png'; // No text query param as per guidelines
  const displaySrc = url || placeholderSrc;

  return (
    <div className="py-1.5">
      <p className="text-sm text-muted-foreground mb-1">{label}:</p>
      <a
        href={url || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className={`block w-full max-w-xs relative group rounded-md overflow-hidden border shadow-sm ${!url ? 'cursor-default' : 'hover:opacity-90 transition-opacity'}`}
        onClick={(e) => { if (!url) e.preventDefault(); }}
      >
        <Image
          src={displaySrc}
          alt={`${label}${!url ? ' - Not Provided' : ''}`}
          width={300}
          height={200}
          className="object-cover w-full h-auto aspect-[3/2]" // aspect-[3/2] maintains 300x200 ratio
          data-ai-hint="document identification"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== placeholderSrc) {
              target.src = placeholderSrc;
              target.alt = `${label} - Image load failed`;
            }
          }}
        />
        {url && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium">
            View Full Image
          </span>
        )}
        {!url && (
           <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-xs p-2 text-center font-medium">
             {label} Not Provided
           </span>
        )}
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

  const { data: kyc, isLoading, error, refetch: refetchKyc } = useQuery<KYC | null>({
    queryKey: ['kyc', kycId],
    queryFn: () => getKycById(kycId),
    enabled: !!kycId,
  });

  const mutation = useMutation({
    mutationFn: (newStatus: boolean) => updateKycRecord(kycId, { verified: newStatus, status: newStatus ? 'verified' : 'rejected' }),
    onSuccess: (_, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['kyc', kycId] });
      queryClient.invalidateQueries({ queryKey: ['kycRecords'] });
      toast({ title: "KYC Status Updated", description: `KYC marked as ${newStatus ? 'Verified' : 'Rejected'}.` });
    },
    onError: (err: Error) => {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    }
  });

  const handleExportSingleKyc = () => {
    if (!kyc) {
      toast({ title: "No Data", description: "KYC data not available for export.", variant: "default" });
      return;
    }
    try {
      const dataToExport = [{
        "ID": kyc.id,
        "User ID": kyc.userId,
        "Name": kyc.personal_info?.name || 'N/A',
        "Prefix": kyc.personal_info?.prefix || 'N/A',
        "Gender": kyc.personal_info?.gender || 'N/A',
        "Date of Birth": kyc.personal_info?.dob ? (typeof kyc.personal_info.dob === 'string' ? kyc.personal_info.dob.split('T')[0] : format(kyc.personal_info.dob as Date, "yyyy-MM-dd")) : 'N/A',
        "Age": kyc.personal_info?.age || 'N/A',
        "Marital Status": kyc.personal_info?.marital_status || 'N/A',
        "Father/Husband Name": kyc.personal_info?.father_name || 'N/A',
        "Phone": kyc.personal_info?.mobile || 'N/A',
        "Alternative Phone": kyc.personal_info?.alt_mobile || 'N/A',
        "Email": kyc.personal_info?.email || 'N/A',
        "Address": kyc.personal_info?.address || 'N/A',
        "Pincode": kyc.personal_info?.pincode || 'N/A',
        "State": kyc.personal_info?.state || 'N/A',
        "Company Name": kyc.professional_info?.company_name || 'N/A',
        "Department": kyc.professional_info?.department || 'N/A',
        "Designation": kyc.professional_info?.designation || 'N/A',
        "Education": kyc.professional_info?.education || 'N/A',
        "Date of Joining": kyc.professional_info?.joining_date ? (typeof kyc.professional_info.joining_date === 'string' ? kyc.professional_info.joining_date.split('T')[0] : format(kyc.professional_info.joining_date as Date, "yyyy-MM-dd")) : 'N/A',
        "Aadhar Number": kyc.professional_info?.aadhar_number || 'N/A',
        "Name as per Aadhar": kyc.professional_info?.name_as_per_aadhar || 'N/A',
        "PAN Number": kyc.professional_info?.pan_number || 'N/A',
        "UAN Number": kyc.professional_info?.uan_number || 'N/A',
        "ESIC Number": kyc.professional_info?.esic_number || 'N/A',
        "Mobile Linked to Aadhar": kyc.professional_info?.mobile_linked_to_aadhar || 'N/A',
        "Account Number": kyc.bank_info?.account_number || 'N/A',
        "Bank Name": kyc.bank_info?.bank_name || 'N/A',
        "Branch Name": kyc.bank_info?.branch_name || 'N/A',
        "IFSC Code": kyc.bank_info?.ifsc_code || 'N/A',
        "Aadhar Card URL": kyc.document_info?.aadhar_card_url || 'N/A',
        "PAN Card URL": kyc.document_info?.pan_card_url || 'N/A',
        "Photo URL": kyc.document_info?.photo_url || 'N/A',
        "KYC Status": kyc.status,
        "Remarks": kyc.remarks || 'N/A',
        "Submitted At": kyc.submittedAt ? (typeof kyc.submittedAt === 'string' ? kyc.submittedAt : format(kyc.submittedAt as Date, "yyyy-MM-dd HH:mm:ss")) : 'N/A',
        "Verified At": kyc.verifiedAt ? (typeof kyc.verifiedAt === 'string' ? kyc.verifiedAt : format(kyc.verifiedAt as Date, "yyyy-MM-dd HH:mm:ss")) : 'N/A',
        "Verified By": kyc.verifiedBy || 'N/A',
      }];

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "KYC Detail");
      XLSX.writeFile(workbook, `KYC_Detail_${kyc.personal_info?.name || kyc.id}.xlsx`);
      toast({ title: "Export Successful", description: "KYC detail exported." });
    } catch (e) {
      toast({ title: "Export Failed", description: "Could not export KYC detail.", variant: "destructive" });
      console.error("Export error:", e);
    }
  };


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
        <Button variant="outline" onClick={() => refetchKyc()}><ArrowLeft className="mr-2 h-4 w-4" /> Retry or Go Back</Button>
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

  const getStatusBadge = () => {
    switch (kyc.status) {
      case 'verified':
        return (
          <Badge variant="default" className="text-sm px-3 py-1 mt-2 sm:mt-0 bg-green-500 hover:bg-green-600">
            <CheckCircle className="mr-1.5 h-4 w-4" /> Verified
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="text-sm px-3 py-1 mt-2 sm:mt-0 bg-red-500 hover:bg-red-600">
            <XCircle className="mr-1.5 h-4 w-4" /> Rejected
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge variant="secondary" className="text-sm px-3 py-1 mt-2 sm:mt-0 bg-yellow-500 hover:bg-yellow-600 text-white">
            <HelpCircle className="mr-1.5 h-4 w-4" /> Pending
          </Badge>
        );
    }
  };
  
  const getStatusIcon = () => {
    switch (kyc.status) {
      case 'verified': return CalendarCheck2;
      case 'rejected': return XCircle;
      case 'pending':
      default: return HelpCircle;
    }
  };


  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
        <div className="mb-6 flex justify-between items-center">
            <Button variant="outline" asChild>
                <Link href="/dashboard/kyc"><ArrowLeft className="mr-2 h-4 w-4" /> Back to KYC List</Link>
            </Button>
            <Button variant="outline" onClick={handleExportSingleKyc}>
                <FileArchive className="mr-2 h-4 w-4" /> Export this KYC to Excel
            </Button>
        </div>
      <Card className="shadow-xl">
        <CardHeader className="bg-muted/30 p-6 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-bold">{pInfo.name || 'N/A'}</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">KYC Record ID: {kyc.id}</CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <SectionTitle title="Personal Information" icon={User} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <InfoItem label="Name" value={pInfo.name} icon={User}/>
            <InfoItem label="Prefix" value={pInfo.prefix} icon={User}/>
            <InfoItem label="Gender" value={pInfo.gender} icon={User}/>
            <InfoItem label="Date of Birth" value={pInfo.dob} icon={CalendarDays} isDate={true}/>
            <InfoItem label="Age" value={pInfo.age} icon={Cake}/>
            <InfoItem label="Marital Status" value={pInfo.marital_status} icon={UserSquare}/>
            <InfoItem label="Father/Husband Name" value={pInfo.father_name} icon={UserSquare}/>
            <InfoItem label="Phone" value={pInfo.mobile} icon={Phone}/>
            <InfoItem label="Alternative Phone" value={pInfo.alt_mobile} icon={Phone}/>
            <InfoItem label="Email" value={pInfo.email} icon={Mail}/>
            <InfoItem label="Address" value={pInfo.address} icon={MapPin}/>
            <InfoItem label="Pincode" value={pInfo.pincode} icon={Hash}/>
            <InfoItem label="State" value={pInfo.state} icon={Home}/>
          </div>

          <Separator className="my-6" />
          <SectionTitle title="Professional Information" icon={Briefcase} />
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <InfoItem label="Company Name" value={profInfo.company_name} icon={Landmark} />
            <InfoItem label="Department" value={profInfo.department} icon={Briefcase} />
            <InfoItem label="Designation" value={profInfo.designation} icon={UserSquare} />
            <InfoItem label="Education" value={profInfo.education} icon={BookUser} />
            <InfoItem label="Date of Joining" value={profInfo.joining_date} icon={CalendarDays} isDate={true} />
            <InfoItem label="Aadhar Number" value={profInfo.aadhar_number} icon={Fingerprint} />
            <InfoItem label="Name as per Aadhar" value={profInfo.name_as_per_aadhar} icon={ScanFace} />
            <InfoItem label="PAN Number" value={profInfo.pan_number} icon={CreditCard} />
            <InfoItem label="UAN Number" value={profInfo.uan_number} icon={Hash} />
            <InfoItem label="ESIC Number" value={profInfo.esic_number} icon={Hash} />
            <InfoItem label="Mobile Linked to Aadhar" value={profInfo.mobile_linked_to_aadhar} icon={SmartphoneNfc} />
          </div>

          <Separator className="my-6" />
          <SectionTitle title="Bank Information" icon={Banknote} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <InfoItem label="Account Number" value={bankInfo.account_number} icon={CreditCard} />
            <InfoItem label="Bank Name" value={bankInfo.bank_name} icon={Landmark} />
            <InfoItem label="Branch Name" value={bankInfo.branch_name} icon={Home} />
            <InfoItem label="IFSC Code" value={bankInfo.ifsc_code} icon={Hash} />
          </div>

          <Separator className="my-6" />
          <SectionTitle title="Documents" icon={FileArchive} />
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            <ImageViewer url={docInfo.aadhar_card_url} label="Aadhar Card" />
            <ImageViewer url={docInfo.pan_card_url} label="PAN Card" />
            <ImageViewer url={docInfo.photo_url} label="Applicant Photo" />
          </div>

          <Separator className="my-6" />
          <SectionTitle title="KYC Information & Status" icon={getStatusIcon()} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <InfoItem label="User ID" value={kyc.userId} icon={UserCircle} />
            <InfoItem label="Current Status" value={kyc.status} capitalize icon={getStatusIcon()} />
            <InfoItem label="Submitted At" value={kyc.submittedAt ? (typeof kyc.submittedAt === 'string' ? parseISO(kyc.submittedAt) : kyc.submittedAt as Date) : undefined} icon={CalendarDays} isDate={true}/>
            {kyc.verifiedAt && <InfoItem label="Verified At" value={typeof kyc.verifiedAt === 'string' ? parseISO(kyc.verifiedAt) : kyc.verifiedAt as Date} icon={CalendarCheck2} isDate={true} />}
            {kyc.verifiedBy && <InfoItem label="Verified By" value={kyc.verifiedBy} icon={UserSquare} />}
            <InfoItem label="Remarks" value={kyc.remarks} icon={Edit3} />
          </div>
        </CardContent>
        <CardFooter className="p-6 border-t flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            {kyc.status !== 'verified' ? (
                <Button 
                    onClick={() => mutation.mutate(true)} 
                    disabled={mutation.isPending && mutation.variables === true}
                    className="bg-green-600 hover:bg-green-700"
                >
                    {mutation.isPending && mutation.variables === true ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4"/>}
                    Mark as Verified
                </Button>
            ) : null}
            {kyc.status !== 'rejected' ? ( 
                 <Button 
                    variant="destructive" 
                    onClick={() => mutation.mutate(false)} 
                    disabled={mutation.isPending && mutation.variables === false}
                >
                    {mutation.isPending && mutation.variables === false ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <XCircle className="mr-2 h-4 w-4"/>}
                    Mark as Rejected
                </Button>
            ): null}
        </CardFooter>
      </Card>
    </div>
  );
}
