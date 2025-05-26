
"use client";

import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import * as XLSX from 'xlsx';
import type { KYC } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format, parseISO, isValid } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';

interface KycExportButtonProps {
  kycData: KYC[];
  isLoading: boolean;
}

const formatTimestampForExcel = (timestampInput: Timestamp | Date | string | null | undefined): string => {
  if (!timestampInput) return 'N/A';
  try {
    let date: Date;
    if (typeof timestampInput === 'string') {
      const parsedDate = parseISO(timestampInput); // Handles ISO strings
      if (isValid(parsedDate)) {
        date = parsedDate;
      } else {
        const generalParsedDate = new Date(timestampInput); // Handles more general date strings
        if (isValid(generalParsedDate)) {
          date = generalParsedDate;
        } else {
          return timestampInput; // Return original string if unparseable
        }
      }
    } else if ((timestampInput as Timestamp)?.toDate) { // Firebase Timestamp
      date = (timestampInput as Timestamp).toDate();
    } else { // JS Date object
      date = timestampInput as Date;
    }
    return format(date, "yyyy-MM-dd HH:mm:ss");
  } catch (error) {
    // console.warn("Error formatting date for Excel:", timestampInput, error);
    return String(timestampInput); // Fallback to string representation
  }
};


export function KycExportButton({ kycData, isLoading: isFetchingData }: KycExportButtonProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    if (!kycData || kycData.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There is no KYC data available to export.",
        variant: "default",
      });
      return;
    }

    setIsExporting(true);

    try {
      const dataToExport = kycData.map(kyc => ({
        "ID": kyc.id || 'N/A',
        "User ID": kyc.user_id || 'N/A',
        // Personal Info
        "Name": kyc.personal_info?.name || 'N/A',
        "Prefix": kyc.personal_info?.prefix || 'N/A',
        "Gender": kyc.personal_info?.gender || 'N/A',
        "Date of Birth": kyc.personal_info?.date_of_birth || 'N/A', // Already string
        "Age": kyc.personal_info?.age || 'N/A',
        "Marital Status": kyc.personal_info?.marital_status || 'N/A',
        "Father/Husband Name": kyc.personal_info?.father_husband_name || 'N/A',
        "Phone": kyc.personal_info?.phone || 'N/A',
        "Alternative Phone": kyc.personal_info?.alternative_phone || 'N/A',
        "Email": kyc.personal_info?.email || 'N/A',
        "Address": kyc.personal_info?.address || 'N/A',
        "Pincode": kyc.personal_info?.pincode || 'N/A',
        "State": kyc.personal_info?.state || 'N/A',
        // Professional Info
        "Company Name": kyc.professional_info?.company_name || 'N/A',
        "Department": kyc.professional_info?.department || 'N/A',
        "Designation": kyc.professional_info?.designation || 'N/A',
        "Education": kyc.professional_info?.education || 'N/A',
        "Date of Joining": kyc.professional_info?.date_of_joining || 'N/A', // Already string
        "Date of Exit": kyc.professional_info?.date_of_exit || 'N/A', // Already string
        "Aadhar Number": kyc.professional_info?.aadhar_number || 'N/A',
        "Name as per Aadhar": kyc.professional_info?.name_as_per_aadhar || 'N/A',
        "PAN Number": kyc.professional_info?.pan_number || 'N/A',
        "UAN Number": kyc.professional_info?.uan_number || 'N/A',
        "ESIC Number": kyc.professional_info?.esic_number || 'N/A',
        "Mobile Linked to Aadhar": kyc.professional_info?.mobile_linked_to_aadhar || 'N/A',
        // Bank Info
        "Account Number": kyc.bank_info?.account_number || 'N/A',
        "Bank Name": kyc.bank_info?.bank_name || 'N/A',
        "Branch Name": kyc.bank_info?.branch_name || 'N/A',
        "IFSC Code": kyc.bank_info?.ifsc_code || 'N/A',
        // Document Info
        "Aadhar Card URL": kyc.document_info?.aadhar_card_url || 'N/A',
        "PAN Card URL": kyc.document_info?.pan_card_url || 'N/A',
        "Photo URL": kyc.document_info?.photo_url || 'N/A',
        // KYC Status & Timestamps
        "KYC Status": kyc.status || 'N/A',
        "Remarks": kyc.remarks || 'N/A',
        "Created At": formatTimestampForExcel(kyc.created_at),
        "Verified At": formatTimestampForExcel(kyc.verifiedAt),
        "Verified By": kyc.verified_by || 'N/A',
        "Updated At": formatTimestampForExcel(kyc.updatedAt),
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "KYC Data");
      XLSX.writeFile(workbook, "KYC_Data_Export.xlsx");

      toast({
        title: "Export Successful",
        description: "KYC data has been exported to Excel.",
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting data.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={isFetchingData || isExporting || !kycData || kycData.length === 0}>
      {isExporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileSpreadsheet className="mr-2 h-4 w-4" />
      )}
      Export All KYC to Excel
    </Button>
  );
}
