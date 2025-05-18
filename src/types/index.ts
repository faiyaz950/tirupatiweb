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
  dob?: string; // Date of Birth
  gender?: string;
  father_name?: string;
  mother_name?: string;
  mobile?: string;
  alt_mobile?: string;
  email?: string;
  marital_status?: string;
  permanent_address?: string;
  current_address?: string;
  // ... any other personal fields
}

export interface KycProfessionalInfo {
  company_name?: string;
  designation?: string;
  department?: string;
  employee_id?: string;
  joining_date?: string; // Date as string or Date object
  pan_number?: string;
  education?: string;
  esic_number?: string;
  mobile_linked_to_aadhar?: string;
  name_as_per_aadhar?: string;
  date_of_exit?: string; // Date as string or Date object
  uan_number?: string;
  aadhar_number?: string;
  // ... any other professional fields
}

export interface KycBankInfo {
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  branch_name?: string;
  // ... any other bank fields
}

export interface KycDocumentInfo {
  aadhar_card_url?: string;
  pan_card_url?: string;
  photo_url?: string;
  // ... other document urls
}


export interface KYC {
  id: string;
  userId: string; // ID of the user/employee this KYC belongs to
  personal_info: KycPersonalInfo;
  professional_info: KycProfessionalInfo;
  bank_info: KycBankInfo;
  document_info: KycDocumentInfo;
  status: 'pending' | 'verified' | 'rejected';
  verified: boolean; // From Flutter code structure
  remarks?: string;
  submittedAt: Timestamp | Date | string;
  verifiedAt?: Timestamp | Date | string | null;
  verifiedBy?: string; // Admin ID who verified
  // Add other KYC-specific fields
}

export interface SuperAdminProfile {
  uid: string;
  name: string;
  email: string;
  mobile?: string;
  address?: string;
  createdAt: Timestamp | Date | string;
}
