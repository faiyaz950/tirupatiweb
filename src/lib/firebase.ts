import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, Firestore } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// IMPORTANT: Replace these with your actual Firebase project configuration
// For security, use environment variables in a real application.
// Create a .env.local file in your project root and add your Firebase config:
// NEXT_PUBLIC_FIREBASE_API_KEY="your_api_key"
// NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_auth_domain"
// NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
// NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_storage_bucket"
// NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_messaging_sender_id"
// NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"
// NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your_measurement_id"
// NEXT_PUBLIC_SUPER_ADMIN_EMAIL="tispl.operations@gmail.com"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDhGX85bx0OeFAAcIn64RRaVoP8xMPWZgo",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "tirupati-group-20da9.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "tirupati-group-20da9",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "tirupati-group-20da9.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "493901911966",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:493901911966:web:b119554b3f65e99538e88f",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-DJWRQ7KYTW",
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

auth = getAuth(app);
db = getFirestore(app);

// const storage = getStorage(app); // Uncomment if you need Firebase Storage

// Emulator settings - useful for local development
// Make sure these ports match your firebase.json emulator configuration
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Check if emulators are already running - this is a simple check, might need refinement
  // For robust check, you might ping the emulator ports or use a flag set by your dev script
  // connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  // connectFirestoreEmulator(db, "localhost", 8080);
  // connectStorageEmulator(storage, "localhost", 9199); // Uncomment if using storage emulator
}

export const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'tispl.operations@gmail.com';

export { app, auth, db };
