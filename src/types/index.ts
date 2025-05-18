
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
  dob?: string; // DATE OF BIRTH
  age?: string; // AGE
  gender?: string; // GENDER
  father_name?: string; // FATHER HUSBAND NAME (assuming father_name)
  mobile?: string; // PHONE
  alt_mobile?: string; // ALTERNATIVE PHONE
  email?: string; // EMAIL
  marital_status?: string; // MARITAL STATUS
  address?: string; // ADDRESS
  pincode?: string; // PINCODE
  state?: string; // STATE
  // mother_name removed
  // permanent_address removed
  // current_address removed
}

export interface KycProfessionalInfo {
  company_name?: string; // COMPANY NAME
  designation?: string; // DESIGNATION
  department?: string; // DEPARTMENT
  joining_date?: string; // GvDATE OF JOINING (Date as string or Date object)
  pan_number?: string; // PAN NUMBER
  education?: string; // EDUCATION
  esic_number?: string; // ESIC NUMBER
  mobile_linked_to_aadhar?: string; // MOBILE LINKED TO AADHAR
  name_as_per_aadhar?: string; // NAME AS PER AADHAR
  uan_number?: string; // UAN NUMBER
  aadhar_number?: string; // AADHAR NUMBER
  // employee_id removed
  // date_of_exit removed
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

