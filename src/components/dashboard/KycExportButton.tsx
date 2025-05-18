
"use client";

import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import * as XLSX from 'xlsx';
import type { KYC } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface KycExportButtonProps {
  kycData: KYC[];
  isLoading: boolean;
}

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
      // Prepare data for Excel sheet
      const dataToExport = kycData.map(kyc => ({
        ID: kyc.id,
        UserID: kyc.userId,
        Name: kyc.personal_info?.name || 'N/A',
        DOB: kyc.personal_info?.dob || 'N/A',
        Gender: kyc.personal_info?.gender || 'N/A',
        "Father's Name": kyc.personal_info?.father_name || 'N/A',
        "Mother's Name": kyc.personal_info?.mother_name || 'N/A',
        Mobile: kyc.personal_info?.mobile || 'N/A',
        "Alt Mobile": kyc.personal_info?.alt_mobile || 'N/A',
        Email: kyc.personal_info?.email || 'N/A',
        "Marital Status": kyc.personal_info?.marital_status || 'N/A',
        "Permanent Address": kyc.personal_info?.permanent_address || 'N/A',
        "Current Address": kyc.personal_info?.current_address || 'N/A',
        "Company Name": kyc.professional_info?.company_name || 'N/A',
        Designation: kyc.professional_info?.designation || 'N/A',
        Department: kyc.professional_info?.department || 'N/A',
        "Employee ID": kyc.professional_info?.employee_id || 'N/A',
        "Joining Date": kyc.professional_info?.joining_date || 'N/A',
        "Bank Name": kyc.bank_info?.bank_name || 'N/A',
        "Account Number": kyc.bank_info?.account_number || 'N/A',
        "IFSC Code": kyc.bank_info?.ifsc_code || 'N/A',
        "Branch Name": kyc.bank_info?.branch_name || 'N/A',
        "Aadhar Card URL": kyc.document_info?.aadhar_card_url || 'N/A',
        "PAN Card URL": kyc.document_info?.pan_card_url || 'N/A',
        "Photo URL": kyc.document_info?.photo_url || 'N/A',
        Status: kyc.status,
        Verified: kyc.verified ? 'Yes' : 'No',
        Remarks: kyc.remarks || 'N/A',
        SubmittedAt: kyc.submittedAt ? new Date(kyc.submittedAt.toString()).toLocaleString() : 'N/A',
        VerifiedAt: kyc.verifiedAt ? new Date(kyc.verifiedAt.toString()).toLocaleString() : 'N/A',
        VerifiedBy: kyc.verifiedBy || 'N/A',
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "KYC Data");

      // Generate buffer
      // XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }); // For server-side

      // Trigger download
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
      Export to Excel
    </Button>
  );
}
