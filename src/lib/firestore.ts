
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Admin, KYC, SuperAdminProfile } from '@/types';

// Generic function to parse Timestamps
function parseTimestamps<T extends DocumentData>(data: T): T {
  const newData: Partial<T> = {};
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      newData[key] = data[key].toDate().toISOString() as any;
    } else if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {
      // Check if it's a nested object that might contain Timestamps (like personal_info, etc.)
      if (key === 'personal_info' || key === 'professional_info' || key === 'bank_info' || key === 'document_info') {
        newData[key] = parseTimestamps(data[key]) as any; // Recursively parse nested objects
      } else {
         newData[key] = data[key]; // For other nested objects, keep as is for now unless they also need parsing
      }
    }
     else {
      newData[key] = data[key];
    }
  }
  return newData as T;
}


// SuperAdmin specific functions
export const getSuperAdminProfile = async (uid: string): Promise<SuperAdminProfile | null> => {
  const docRef = doc(db, 'superadmins', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data() as SuperAdminProfile;
    // Ensure all top-level timestamp fields are parsed
    const parsedData = { ...data };
    if (parsedData.createdAt instanceof Timestamp) {
      parsedData.createdAt = parsedData.createdAt.toDate().toISOString();
    }
    return { ...parsedData, uid: docSnap.id } as SuperAdminProfile;
  }
  return null;
};

export const createOrUpdateSuperAdminProfile = async (uid: string, data: Partial<SuperAdminProfile>): Promise<void> => {
  const superAdminRef = doc(db, 'superadmins', uid);
  const docSnap = await getDoc(superAdminRef);
  if (!docSnap.exists()) {
    await setDoc(superAdminRef, {
      ...data,
      createdAt: serverTimestamp(),
    });
  } else {
    await updateDoc(superAdminRef, {
        ...data,
        updatedAt: serverTimestamp(),
    });
  }
};


// Admin specific functions
export const addAdminToFirestore = async (uid: string, adminData: Omit<Admin, 'id' | 'createdAt' | 'lastLogin'>): Promise<void> => {
  const adminRef = doc(db, 'admins', uid);
  await setDoc(adminRef, {
    ...adminData,
    createdAt: serverTimestamp(),
    lastLogin: null,
  });
};

export const getAdminById = async (adminId: string): Promise<Admin | null> => {
  const docRef = doc(db, 'admins', adminId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    let data = docSnap.data();
    // Manually parse top-level timestamps for Admin
    if (data.createdAt instanceof Timestamp) {
      data.createdAt = data.createdAt.toDate().toISOString();
    }
    if (data.lastLogin instanceof Timestamp) {
      data.lastLogin = data.lastLogin.toDate().toISOString();
    }
    return { id: docSnap.id, ...data } as Admin;
  }
  return null;
};

export const getAllAdmins = async (companyFilter?: string): Promise<Admin[]> => {
  let q = query(collection(db, 'admins'));
  if (companyFilter && companyFilter !== 'All') {
    q = query(collection(db, 'admins'), where('selectedCompany', '==', companyFilter));
  }
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => {
    let data = docSnap.data();
    if (data.createdAt instanceof Timestamp) {
      data.createdAt = data.createdAt.toDate().toISOString();
    }
    if (data.lastLogin instanceof Timestamp) {
      data.lastLogin = data.lastLogin.toDate().toISOString();
    }
    return { id: docSnap.id, ...data } as Admin;
  });
};

export const updateAdminInFirestore = async (adminId: string, data: Partial<Admin>): Promise<void> => {
  const adminRef = doc(db, 'admins', adminId);
  await updateDoc(adminRef, data);
};

// KYC specific functions
export const getAllKycRecords = async (filters: { searchQuery?: string; status?: string } = {}): Promise<KYC[]> => {
  const kycCollectionRef = collection(db, 'kyc');
  let q = query(kycCollectionRef);

  if (filters.status) {
     q = query(kycCollectionRef, where('status', '==', filters.status));
  }
  
  const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
  
  let kycDocs = querySnapshot.docs.map(docSnap => {
    let data = docSnap.data();
    // Manually parse top-level timestamps for KYC list items
    if (data.created_at instanceof Timestamp) { // Corrected from submittedAt
      data.created_at = data.created_at.toDate().toISOString();
    }
    if (data.verifiedAt instanceof Timestamp) {
      data.verifiedAt = data.verifiedAt.toDate().toISOString();
    }
     if (data.updatedAt instanceof Timestamp) {
      data.updatedAt = data.updatedAt.toDate().toISOString();
    }
    // Nested objects like personal_info often don't have timestamps directly, but their parent might
    return { id: docSnap.id, ...data } as KYC;
  });

  if (filters.searchQuery) {
    const searchQueryLower = filters.searchQuery.toLowerCase();
    kycDocs = kycDocs.filter(kyc => {
      const name = kyc.personal_info?.name?.toLowerCase() || '';
      const companyName = kyc.professional_info?.company_name?.toLowerCase() || '';
      return name.includes(searchQueryLower) || companyName.includes(searchQueryLower);
    });
  }
  
  return kycDocs;
};


export const getKycById = async (kycId: string): Promise<KYC | null> => {
  const docRef = doc(db, 'kyc', kycId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    let data = docSnap.data();
    // Manually parse all known top-level and nested timestamp fields for KYC detail
    if (data.created_at instanceof Timestamp) { // Corrected from submittedAt
      data.created_at = data.created_at.toDate().toISOString();
    }
    if (data.verifiedAt instanceof Timestamp) {
      data.verifiedAt = data.verifiedAt.toDate().toISOString();
    }
    if (data.updatedAt instanceof Timestamp) {
      data.updatedAt = data.updatedAt.toDate().toISOString();
    }
    // The string date fields like personal_info.date_of_birth are already strings from DB.
    return { id: docSnap.id, ...data } as KYC;
  }
  return null;
};

export const updateKycRecord = async (kycId: string, data: Partial<KYC>): Promise<void> => {
    const kycRef = doc(db, 'kyc', kycId);
    const updateData:any = { ...data };
    updateData.updatedAt = serverTimestamp(); // Ensure this field is also in your KYC type if you want to track it
    
    if (data.status === 'verified') {
        updateData.verifiedAt = serverTimestamp();
    } else if (data.status === 'rejected' || data.status === 'pending') {
        updateData.verifiedAt = null; // Explicitly set to null if reverting from verified or just not verified
    }
    // Note: 'verified' boolean field might be redundant if 'status' is the source of truth.
    // Keeping it for now based on existing type, but consider aligning.
    updateData.verified = data.status === 'verified';


    await updateDoc(kycRef, updateData);
};
