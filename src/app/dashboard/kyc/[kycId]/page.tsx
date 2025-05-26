
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
    CheckCircle, XCircle, HelpCircle, BookUser, Hash, SmartphoneNfc, 
    ScanFace, CalendarDays, Cake, MapPin, CreditCard, Mail, Phone, Home, UserSquare, Landmark, Edit3, CalendarCheck2, UserCircle as UserCircleIcon, Users as UsersIcon
} from 'lucide-react'; 
import { format, parseISO, isValid } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import * as XLSX from 'xlsx';
import type { Timestamp } from 'firebase/firestore';

const SectionTitle = ({ title, icon: Icon }: { title: string; icon: React.ElementType }) => (
  <div className="flex items-center space-x-2 mb-3 mt-4">
    <Icon className="h-5 w-5 text-primary" />
    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
  </div>
);

const InfoItem = ({ label, value, capitalize = false, icon: Icon, isDate = false }: { label: string; value?: string | null | boolean | Date; capitalize?: boolean; icon?: React.ElementType, isDate?: boolean }) => {
  let displayValue: string | React.ReactNode = 'N/A';

  if (value instanceof Date) {
    displayValue = format(value, "PPP");
  } else if (isDate && typeof value === 'string' && value.trim() !== '') {
    let formattedDate = '';
    try {
      // Try parsing with `new Date()` first, as it's more lenient with formats like "16 May 2011"
      const dateObj = new Date(value);
      if (isValid(dateObj)) { // Check if the date is valid
        formattedDate = format(dateObj, "PPP");
      } else {
        // If `new Date()` fails, try `parseISO` for strict ISO formats
        const isoDateObj = parseISO(value); 
        if (isValid(isoDateObj)) {
          formattedDate = format(isoDateObj, "PPP");
        }
      }
    } catch (error) {
      // Errors during parsing or formatting
    }
    displayValue = formattedDate || value; 
  } else if (typeof value === 'boolean') {
    displayValue = value ? 'Yes' : 'No';
  } else if (value || value === 0) { 
    displayValue = capitalize ? (String(value).charAt(0).toUpperCase() + String(value).slice(1)) : String(value);
  }

  if (displayValue === "") {
    displayValue = 'N/A';
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
  const placeholderSrc = 'https://placehold.co/300x200.png'; 
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
          alt={`${label}${!url ? ' - Image Unavailable' : ''}`}
          width={300}
          height={200}
          className="object-cover w-full h-auto aspect-[3/2]" 
          data-ai-hint="document identification"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== placeholderSrc) {
              target.src = placeholderSrc;
              target.alt = `${label} - Image Unavailable`;
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

const formatTimestampForExcel = (timestampInput: Timestamp | Date | string | null | undefined): string => {
  if (!timestampInput) return 'N/A';
  try {
    let date: Date;
    if (typeof timestampInput === 'string') {
      const parsedDate = parseISO(timestampInput); 
      if (isValid(parsedDate)) {
        date = parsedDate;
      } else {
        const generalParsedDate = new Date(timestampInput); 
        if (isValid(generalParsedDate)) {
          date = generalParsedDate;
        } else {
          return timestampInput; 
        }
      }
    } else if ((timestampInput as Timestamp)?.toDate) { 
      date = (timestampInput as Timestamp).toDate();
    } else { 
      date = timestampInput as Date;
    }
    return format(date, "yyyy-MM-dd HH:mm:ss");
  } catch (error) {
    return String(timestampInput); 
  }
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
    mutationFn: (newStatus: KYC['status']) => updateKycRecord(kycId, { status: newStatus, verified: newStatus === 'verified' }),
    onSuccess: (_, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['kyc', kycId] });
      queryClient.invalidateQueries({ queryKey: ['kycRecords'] });
      toast({ title: "KYC Status Updated", description: `KYC marked as ${newStatus}.` });
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
      const pInfo = kyc.personal_info || {};
      const profInfo = kyc.professional_info || {};
      const bankInfo = kyc.bank_info || {};

      const dataToExport = [{
        "ID": kyc.id || 'N/A',
        "User ID": kyc.user_id || 'N/A',
        // Personal Info
        "Name": pInfo.name || 'N/A',
        "Prefix": pInfo.prefix || 'N/A',
        "Gender": pInfo.gender || 'N/A',
        "Date of Birth": pInfo.date_of_birth || 'N/A',
        "Age": pInfo.age || 'N/A',
        "Marital Status": pInfo.marital_status || 'N/A',
        "Father/Husband Name": pInfo.father_husband_name || 'N/A',
        "Phone": pInfo.phone || 'N/A',
        "Alternative Phone": pInfo.alternative_phone || 'N/A',
        "Email": pInfo.email || 'N/A',
        "Address": pInfo.address || 'N/A',
        "Pincode": pInfo.pincode || 'N/A',
        "State": pInfo.state || 'N/A',
        // Professional Info
        "Company Name": profInfo.company_name || 'N/A',
        "Department": profInfo.department || 'N/A',
        "Designation": profInfo.designation || 'N/A',
        "Education": profInfo.education || 'N/A',
        "Date of Joining": profInfo.date_of_joining || 'N/A',
        "Aadhar Number": profInfo.aadhar_number || 'N/A',
        "Name as per Aadhar": profInfo.name_as_per_aadhar || 'N/A',
        "PAN Number": profInfo.pan_number || 'N/A',
        "UAN Number": profInfo.uan_number || 'N/A',
        "ESIC Number": profInfo.esic_number || 'N/A',
        "Mobile Linked to Aadhar": profInfo.mobile_linked_to_aadhar || 'N/A',
        // Bank Info
        "Account Number": bankInfo.account_number || 'N/A',
        "Bank Name": bankInfo.bank_name || 'N/A',
        "Branch Name": bankInfo.branch_name || 'N/A',
        "IFSC Code": bankInfo.ifsc_code || 'N/A',
        // KYC Status & Timestamps
        "KYC Status": kyc.status || 'N/A',
        "Remarks": kyc.remarks || 'N/A',
        "Created At": formatTimestampForExcel(kyc.created_at),
        "Verified At": formatTimestampForExcel(kyc.verifiedAt),
        "Verified By": kyc.verified_by || 'N/A',
        "Updated At": formatTimestampForExcel(kyc.updatedAt),
      }];

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "KYC Detail");
      XLSX.writeFile(workbook, `KYC_Detail_${pInfo.name || kyc.id}.xlsx`);
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
          <Badge variant="destructive" className="text-sm px-3 py-1 mt-2 sm:mt-0">
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
            <InfoItem label="Prefix" value={pInfo.prefix} icon={UserCircleIcon}/>
            <InfoItem label="Gender" value={pInfo.gender} icon={UsersIcon}/>
            <InfoItem label="Date of Birth" value={pInfo.date_of_birth} icon={CalendarDays} isDate={true}/>
            <InfoItem label="Age" value={pInfo.age} icon={Cake}/>
            <InfoItem label="Marital Status" value={pInfo.marital_status} icon={UserSquare}/>
            <InfoItem label="Father/Husband Name" value={pInfo.father_husband_name} icon={UserSquare}/>
            <InfoItem label="Phone" value={pInfo.phone} icon={Phone}/>
            <InfoItem label="Alternative Phone" value={pInfo.alternative_phone} icon={SmartphoneNfc}/>
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
            <InfoItem label="Date of Joining" value={profInfo.date_of_joining} icon={CalendarDays} isDate={true} />
            {/* Date of Exit removed from display */}
            <InfoItem label="Aadhar Number" value={profInfo.aadhar_number} icon={CreditCard} />
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
            <InfoItem label="Current Status" value={kyc.status} capitalize icon={getStatusIcon()} />
            {kyc.verifiedAt && <InfoItem label="Verified At" value={kyc.verifiedAt as Date} icon={CalendarCheck2} isDate={true} />}
            {kyc.verified_by && <InfoItem label="Verified By" value={kyc.verified_by} icon={UserSquare} />}
            <InfoItem label="Remarks" value={kyc.remarks} icon={Edit3} />
            {kyc.created_at && <InfoItem label="Created At" value={kyc.created_at as Date} icon={CalendarDays} isDate={true} />}
            {kyc.updatedAt && <InfoItem label="Last Updated At" value={kyc.updatedAt as Date} icon={CalendarDays} isDate={true} />}
          </div>
        </CardContent>
        <CardFooter className="p-6 border-t flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            {kyc.status !== 'verified' ? (
                <Button 
                    onClick={() => mutation.mutate('verified')} 
                    disabled={mutation.isPending && mutation.variables === 'verified'}
                    className="bg-green-600 hover:bg-green-700"
                >
                    {mutation.isPending && mutation.variables === 'verified' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4"/>}
                    Mark as Verified
                </Button>
            ) : null}
            {kyc.status !== 'rejected' ? ( 
                 <Button 
                    variant="destructive" 
                    onClick={() => mutation.mutate('rejected')} 
                    disabled={mutation.isPending && mutation.variables === 'rejected'}
                >
                    {mutation.isPending && mutation.variables === 'rejected' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <XCircle className="mr-2 h-4 w-4"/>}
                    Mark as Rejected
                </Button>
            ): null}
             {kyc.status === 'verified' || kyc.status === 'rejected' ? ( 
                <Button 
                    variant="outline" 
                    onClick={() => mutation.mutate('pending')} 
                    disabled={mutation.isPending && mutation.variables === 'pending'}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                    {mutation.isPending && mutation.variables === 'pending' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <HelpCircle className="mr-2 h-4 w-4"/>}
                    Mark as Pending
                </Button>
            ) : null}
        </CardFooter>
      </Card>
    </div>
  );
}


    