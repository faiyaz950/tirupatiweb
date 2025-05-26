
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
      const dataToExport = kycData.map(kyc => {
        const pInfo = kyc.personal_info || {};
        const profInfo = kyc.professional_info || {};
        const bankInfo = kyc.bank_info || {};
        // const docInfo = kyc.document_info || {}; // Not needed if not exporting URLs

        return {
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
          // "Date of Exit": profInfo.date_of_exit || 'N/A', // Removed
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
          // Document Info - URLs removed
          // "Aadhar Card URL": docInfo.aadhar_card_url || 'N/A',
          // "PAN Card URL": docInfo.pan_card_url || 'N/A',
          // "Photo URL": docInfo.photo_url || 'N/A',
          // KYC Status & Timestamps
          "KYC Status": kyc.status || 'N/A',
          "Remarks": kyc.remarks || 'N/A',
          "Created At": formatTimestampForExcel(kyc.created_at),
          "Verified At": formatTimestampForExcel(kyc.verifiedAt),
          "Verified By": kyc.verified_by || 'N/A',
          "Updated At": formatTimestampForExcel(kyc.updatedAt),
        };
      });

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
