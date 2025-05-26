
import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string | null;
  name?: string;
  photoURL?: string | null;
  isSuperAdmin?: boolean;
  // Add other relevant user fields
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  company: string; // Original company name text field
  department: string;
  designation: string;
  availability: string;
  selectedCompany: 'Tirupati Industrial Services' | 'Maxline Facilities' | string; // Dropdown selection
  createdAt: Timestamp | Date | string;
  lastLogin?: Timestamp | Date | string | null;
  // Add other admin-specific fields
}

export interface KycPersonalInfo {
  name?: string; // NAME
  prefix?: string; // PREFIX
  date_of_birth?: string; // DATE OF BIRTH (Corrected from dob)
  age?: string; // AGE
  gender?: string; // GENDER
  father_husband_name?: string; // FATHER HUSBAND NAME (Corrected from father_name)
  phone?: string; // PHONE (Corrected from mobile)
  alternative_phone?: string; // ALTERNATIVE PHONE (Corrected from alt_mobile)
  email?: string; // EMAIL
  marital_status?: string; // MARITAL STATUS
  address?: string; // ADDRESS
  pincode?: string; // PINCODE
  state?: string; // STATE
}

export interface KycProfessionalInfo {
  company_name?: string; // COMPANY NAME
  designation?: string; // DESIGNATION
  department?: string; // DEPARTMENT
  date_of_joining?: string; // DATE OF JOINING (Corrected from joining_date)
  pan_number?: string; // PAN NUMBER
  education?: string; // EDUCATION
  esic_number?: string; // ESIC NUMBER
  mobile_linked_to_aadhar?: string; // MOBILE LINKED TO AADHAR
  name_as_per_aadhar?: string; // NAME AS PER AADHAR
  uan_number?: string; // UAN NUMBER
  aadhar_number?: string; // AADHAR NUMBER
  date_of_exit?: string; // Added as it's in DB example, though might be empty
}

export interface KycBankInfo {
  bank_name?: string; // BANK NAME
  account_number?: string; // ACCOUNT NUMBER
  ifsc_code?: string; // IFSC CODE
  branch_name?: string; // BRANCH NAME
}

export interface KycDocumentInfo {
  aadhar_card_url?: string;
  pan_card_url?: string;
  photo_url?: string;
  // ... other document urls
}


export interface KYC {
  id: string;
  user_id: string; // ID of the user/employee this KYC belongs to (Matches DB: user_id)
  personal_info: KycPersonalInfo;
  professional_info: KycProfessionalInfo;
  bank_info: KycBankInfo;
  document_info: KycDocumentInfo;
  status: 'pending' | 'verified' | 'rejected';
  verified: boolean; // From Flutter code structure
  remarks?: string;
  created_at: Timestamp | Date | string; // Changed from submittedAt to match DB
  verifiedAt?: Timestamp | Date | string | null;
  verified_by?: string; // Admin ID who verified (Matches DB: verified_by)
  updatedAt?: Timestamp | Date | string; // Added as it's in DB example
}

export interface SuperAdminProfile {
  uid: string;
  name: string;
  email: string;
  mobile?: string;
  address?: string;
  createdAt: Timestamp | Date | string;
}
