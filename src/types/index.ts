
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
  name?: string;
  prefix?: string;
  date_of_birth?: string; // DB: date_of_birth (e.g., "15 May 2002")
  age?: string;
  gender?: string;
  father_husband_name?: string; // DB: father_husband_name
  phone?: string; // DB: phone
  alternative_phone?: string; // DB: alternative_phone
  email?: string;
  marital_status?: string;
  address?: string;
  pincode?: string;
  state?: string;
}

export interface KycProfessionalInfo {
  company_name?: string;
  designation?: string;
  department?: string;
  date_of_joining?: string; // DB: date_of_joining (e.g., "16 May 2011")
  pan_number?: string;
  education?: string;
  esic_number?: string;
  mobile_linked_to_aadhar?: string;
  name_as_per_aadhar?: string;
  uan_number?: string;
  aadhar_number?: string;
  date_of_exit?: string; // DB: date_of_exit (e.g., "")
}

export interface KycBankInfo {
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  branch_name?: string;
}

export interface KycDocumentInfo {
  aadhar_card_url?: string;
  pan_card_url?: string;
  photo_url?: string;
  // ... other document urls
}


export interface KYC {
  id: string;
  user_id: string; // DB: user_id
  personal_info: KycPersonalInfo;
  professional_info: KycProfessionalInfo;
  bank_info: KycBankInfo;
  document_info: KycDocumentInfo;
  status: 'pending' | 'verified' | 'rejected';
  verified: boolean;
  remarks?: string;
  created_at: Timestamp | Date | string; // DB: created_at
  verifiedAt?: Timestamp | Date | string | null;
  verified_by?: string; // DB: verified_by
  updatedAt?: Timestamp | Date | string; // DB: updatedAt
}

export interface SuperAdminProfile {
  uid: string;
  name: string;
  email: string;
  mobile?: string;
  address?: string;
  createdAt: Timestamp | Date | string;
}
