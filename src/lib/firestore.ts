
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
      newData[key] = parseTimestamps(data[key]) as any; // Recursively parse nested objects
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
    return { ...parseTimestamps(data), uid: docSnap.id } as SuperAdminProfile;
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
    return { id: docSnap.id, ...parseTimestamps(docSnap.data()) } as Admin;
  }
  return null;
};

export const getAllAdmins = async (companyFilter?: string): Promise<Admin[]> => {
  let q = query(collection(db, 'admins'));
  if (companyFilter && companyFilter !== 'All') {
    q = query(collection(db, 'admins'), where('selectedCompany', '==', companyFilter));
  }
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...parseTimestamps(doc.data()) } as Admin));
};

export const updateAdminInFirestore = async (adminId: string, data: Partial<Admin>): Promise<void> => {
  const adminRef = doc(db, 'admins', adminId);
  await updateDoc(adminRef, data);
};

// KYC specific functions
export const getAllKycRecords = async (filters: { searchQuery?: string; status?: string } = {}): Promise<KYC[]> => {
  const kycCollectionRef = collection(db, 'kyc');
  // Firestore client-side filtering for search is complex. 
  // Basic status filtering can be done with `where` clause.
  // For search, it's often better to fetch all and filter client-side for small datasets,
  // or use a search service like Algolia/Elasticsearch for larger datasets.
  
  let q = query(kycCollectionRef);

  if (filters.status) {
    const verifiedStatus = filters.status === 'verified';
    q = query(kycCollectionRef, where('verified', '==', verifiedStatus));
  }
  
  const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
  
  let kycDocs = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...parseTimestamps(doc.data()),
  })) as KYC[];

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
    return { id: docSnap.id, ...parseTimestamps(docSnap.data()) } as KYC;
  }
  return null;
};

export const updateKycRecord = async (kycId: string, data: Partial<KYC>): Promise<void> => {
    const kycRef = doc(db, 'kyc', kycId);
    await updateDoc(kycRef, {
        ...data,
        updatedAt: serverTimestamp()
    });
};
