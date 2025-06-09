
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  EmailAuthProvider, 
  reauthenticateWithCredential,
  type User as FirebaseUser,
  type UserCredential
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { addAdminToFirestore } from "@/lib/firestore";
import { useAuth } from "@/hooks/useAuth";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from 'next/navigation';

const companies = [
  { id: "Tirupati Industrial Services", label: "Tirupati Industrial Services" },
  { id: "Maxline Facilities", label: "Maxline Facilities" },
];

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(100),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  mobile: z.string().min(10, { message: "Mobile number must be at least 10 digits." }).max(15),
  address: z.string().min(5, { message: "Address is required." }).max(500),
  company: z.string().min(2, {message: "Company name is required"}).max(100),
  department: z.string().min(2, {message: "Department is required"}).max(100),
  designation: z.string().min(2, {message: "Designation is required"}).max(100),
  availability: z.string().min(2, {message: "Availability is required"}).max(50),
  selectedCompany: z.string({ required_error: "Please select a company for the admin." }).min(1, {message: "Please select a company for the admin."}),
  superAdminPassword: z.string().min(6, { message: "Super Admin password is required." }),
});

export function AddAdminForm() {
  const { toast } = useToast();
  const { user: superAdminUserHook, loading: authLoading } = useAuth(); 
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuperAdminPassword, setShowSuperAdminPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      mobile: "",
      address: "",
      company: "",
      department: "",
      designation: "",
      availability: "",
      selectedCompany: "", 
      superAdminPassword: "",
    },
  });

  const [originalSuperAdminEmail, setOriginalSuperAdminEmail] = useState<string | null>(null);
  const [originalSuperAdminUID, setOriginalSuperAdminUID] = useState<string | null>(null);

  useEffect(() => {
    if (superAdminUserHook) {
      setOriginalSuperAdminEmail(superAdminUserHook.email);
      setOriginalSuperAdminUID(superAdminUserHook.uid);
      console.log("AddAdminForm: Original SuperAdmin details captured:", superAdminUserHook.email, superAdminUserHook.uid);
    }
  }, [superAdminUserHook]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (authLoading) {
      setErrorMessage("Authentication is still loading. Please wait and try again.");
      toast({ title: "Authentication Busy", description: "Please wait a moment.", variant: "default" });
      return;
    }
    
    if (!originalSuperAdminEmail || !originalSuperAdminUID) {
        setErrorMessage("Super Admin details not available. Please re-login or wait for session to initialize.");
        toast({ title: "Authentication Error", description: "Super Admin session details missing. Please re-login or wait.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    
    // Explicitly check current auth user before starting.
    if (!auth.currentUser || auth.currentUser.uid !== originalSuperAdminUID) {
        setErrorMessage("Super Admin session mismatch or not found. Please re-login.");
        toast({ title: "Session Error", description: "Super Admin session is invalid. Please re-login.", variant: "destructive" });
        if(auth.currentUser) {
          console.warn("AddAdminForm: Current user is not original SuperAdmin before starting. Current:", auth.currentUser.uid, "Expected:", originalSuperAdminUID);
          await firebaseSignOut(auth); // Sign out potentially incorrect user
        }
        router.push('/?error=sessionMismatchOnSubmit');
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    console.log("AddAdminForm: Starting admin creation process for", values.email);
    
    let newAdminAuthUser: FirebaseUser | null = null;

    try {
      // Step 1: Re-authenticate Super Admin
      console.log("AddAdminForm: Step 1 - Re-authenticating Super Admin:", originalSuperAdminEmail);
      const credential = EmailAuthProvider.credential(originalSuperAdminEmail, values.superAdminPassword);
      await reauthenticateWithCredential(auth.currentUser!, credential);
      toast({ title: "Super Admin Re-authenticated", description: "Proceeding with admin creation.", duration: 2000 });
      console.log("AddAdminForm: Step 1 - Super Admin re-authenticated successfully.");

      // Step 2: Create new admin user in Firebase Auth
      console.log("AddAdminForm: Step 2 - Creating new admin Auth user:", values.email);
      const newAdminUserCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      newAdminAuthUser = newAdminUserCredential.user; 

      if (!newAdminAuthUser) {
        console.error("AddAdminForm: Admin Auth user creation succeeded but returned no user object.");
        throw new Error("Admin Auth user creation succeeded but returned no user object. This is unexpected.");
      }
      toast({ title: "Admin Auth Account Created", description: `Auth account for ${values.email} created.`, duration: 2000 });
      console.log("AddAdminForm: Step 2 - New admin Auth user created:", newAdminAuthUser.uid, newAdminAuthUser.email);
      
      // Step 3: Sign out the newly created admin (who is current auth.currentUser).
      console.log("AddAdminForm: Step 3 - Signing out newly created admin:", newAdminAuthUser.email);
      await firebaseSignOut(auth); 
      toast({ title: "Temporary Session Cleared", description: `New admin signed out.`, duration: 2000 });
      console.log("AddAdminForm: Step 3 - New admin signed out. Current auth.currentUser should be null now:", auth.currentUser);


      // Step 4: Sign Super Admin back in using their original email and the provided password.
      console.log("AddAdminForm: Step 4 - Signing Super Admin back in:", originalSuperAdminEmail);
      const superAdminLoginCredential = await signInWithEmailAndPassword(auth, originalSuperAdminEmail, values.superAdminPassword); 
      if (!superAdminLoginCredential.user || superAdminLoginCredential.user.uid !== originalSuperAdminUID) {
          console.error("AddAdminForm: Failed to restore Super Admin session. Expected UID:", originalSuperAdminUID, "Got:", superAdminLoginCredential.user?.uid);
          throw new Error("Failed to restore Super Admin session correctly after new admin creation. Critical error.");
      }
      toast({ title: "Super Admin Session Restored", description: "Ready to save admin profile.", duration: 2000 });
      console.log("AddAdminForm: Step 4 - Super Admin session restored. Current user:", auth.currentUser?.uid, auth.currentUser?.email);


      // Step 5: Save admin details to Firestore, using the new admin's UID.
      // This now happens while the Super Admin is confirmed to be auth.currentUser.
      console.log("AddAdminForm: Step 5 - Preparing to save admin profile to Firestore for UID:", newAdminAuthUser.uid);
      console.log("AddAdminForm: Current auth user before Firestore write:", auth.currentUser?.uid, auth.currentUser?.email, "(should be SuperAdmin)");
      
      try {
        await addAdminToFirestore(newAdminAuthUser.uid, { 
          name: values.name,
          email: values.email, 
          mobile: values.mobile,
          address: values.address,
          company: values.company,
          department: values.department,
          designation: values.designation,
          availability: values.availability,
          selectedCompany: values.selectedCompany,
        });
        toast({ title: "Admin Profile Saved", description: `Profile for ${values.name} saved to database.`, duration: 3000 });
        console.log("AddAdminForm: Step 5 - Admin profile saved to Firestore successfully.");
      } catch (firestoreError: any) {
        console.error("AddAdminForm: Firestore save error:", firestoreError);
        setErrorMessage(`Failed to save admin profile to database: ${firestoreError.message}. Admin Auth account was created but profile save failed. Please check console.`);
        toast({ title: "Firestore Save Failed", description: `Could not save admin profile: ${firestoreError.message}`, variant: "destructive", duration: 7000 });
        // Attempt to rollback Auth user creation if Firestore fails
        if (newAdminAuthUser) {
          console.warn("AddAdminForm: Attempting to delete newly created Auth user due to Firestore save failure:", newAdminAuthUser.email);
          // To delete, we need to sign in AS the new admin user temporarily. This is very tricky.
          // A Firebase Function is much safer for this kind of rollback.
          // For now, log and advise manual deletion.
          toast({ 
            title: "Action Required: Manual Cleanup", 
            description: `Auth user ${newAdminAuthUser.email} created, but profile save failed. Please manually delete this Auth user from Firebase console if it's not needed.`,
            variant: "destructive",
            duration: 15000 
          });
        }
        return; // Stop further execution
      }

      toast({
        title: "Admin Account Created Successfully!",
        description: `${values.name} has been added. Redirecting to dashboard...`,
        duration: 4000
      });
      form.reset(); 
      console.log("AddAdminForm: Process complete. Redirecting to /dashboard.");
      router.push('/dashboard'); 

    } catch (error: any) { 
      console.error("AddAdminForm: Error in admin creation process:", error);
      let displayedMessage = "An unexpected error occurred during admin creation.";

      if (error.code) { 
        switch (error.code) {
          case 'auth/invalid-credential':
          case 'auth/wrong-password': 
             if (newAdminAuthUser && (!auth.currentUser || auth.currentUser.uid !== originalSuperAdminUID)) { 
                displayedMessage = "Failed to restore Super Admin session after admin creation. Session invalid. Please re-login as Super Admin.";
             } else if (!newAdminAuthUser) { 
                displayedMessage = "Super Admin password verification failed for re-authentication. Please ensure your password is correct.";
             } else { 
                displayedMessage = "Super Admin password verification failed during session restoration. Please check your password.";
             }
            break;
          case 'auth/email-already-in-use':
            displayedMessage = `The email address '${values.email}' is already in use for another account.`;
            break;
          case 'auth/weak-password':
            displayedMessage = "The password provided for the new admin is too weak.";
            break;
          case 'auth/user-not-found':
             displayedMessage = `Super Admin account (${originalSuperAdminEmail}) not found during session restoration. Please contact support.`;
             break;
          case 'auth/too-many-requests':
             displayedMessage = `Too many attempts. Firebase Auth error: ${error.message}`;
             break;
          default:
            displayedMessage = `Firebase Error: ${error.message} (Code: ${error.code})`;
        }
      } else if (error.message) {
        displayedMessage = error.message;
      }
      
      setErrorMessage(displayedMessage);
      toast({ title: "Operation Failed", description: displayedMessage, variant: "destructive", duration: 7000 });
      
      // Attempt to restore Super Admin session in catch block if it's not already restored or failed
      // This is a last-ditch effort to ensure SA is logged in.
      try {
        if (!auth.currentUser || auth.currentUser.uid !== originalSuperAdminUID) {
          console.warn("AddAdminForm: Catch block - Super Admin session not active. Attempting to restore.");
          if(auth.currentUser) { // If someone (e.g. new admin) is logged in, sign them out
            console.log("AddAdminForm: Catch block - signing out current user:", auth.currentUser.uid);
            await firebaseSignOut(auth);
          }
          console.log("AddAdminForm: Catch block - signing in Super Admin:", originalSuperAdminEmail);
          await signInWithEmailAndPassword(auth, originalSuperAdminEmail!, values.superAdminPassword);
          if (auth.currentUser && auth.currentUser.uid === originalSuperAdminUID) {
            console.log("AddAdminForm: Catch block - Super Admin session successfully restored.");
            toast({title: "Session Note", description: "Super Admin session restored after error handling.", duration: 3000});
          } else {
            throw new Error("Super Admin session could not be restored in catch block.");
          }
        }
      } catch (sessionRestoreError: any) {
        const restoreMsg = "CRITICAL: Failed to restore Super Admin session after an error. Please re-login manually.";
        console.error("AddAdminForm: " + restoreMsg, sessionRestoreError);
        setErrorMessage(prev => `${prev ? prev + '. ' : ''}${restoreMsg}`);
        toast({ title: "Critical Session Error", description: restoreMsg, variant: "destructive", duration: 10000});
        if (router && pathname !== '/') router.push('/?error=superAdminSessionRestoreFailedInCatch');
      }
    } finally {
      setIsLoading(false);
      console.log("AddAdminForm: Admin creation process finished (finally block).");
    }
  }
  const pathname = useRouter(); // To avoid error with router.push in catch if router is null.

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-2xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-primary">Create New Administrator</CardTitle>
        <CardDescription className="text-lg text-muted-foreground">Complete the form to add an admin. This will create their login and profile.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter admin's full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin's Email Address (for login)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="admin@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Set Admin's Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showPassword ? "text" : "password"} placeholder="Create a strong password" {...field} />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="Enter mobile number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Residential Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter admin's full address" {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name (Assigned Branch/Site)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Tirupati Group - Pune Site" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="selectedCompany"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Company Entity</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent company" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map(company => (
                          <SelectItem key={company.id} value={company.id}>{company.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Operations, HR" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designation</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Site Manager, HR Executive" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
                control={form.control}
                name="availability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Availability</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Full-Time, Part-Time (Mon-Fri, 9 AM - 5 PM)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <div className="pt-6 border-t">
              <FormLabel className="text-xl font-semibold text-primary">Super Admin Verification</FormLabel>
              <p className="text-sm text-muted-foreground mb-4 mt-1">To confirm this action, please enter your Super Admin password.</p>
              <FormField
                  control={form.control}
                  name="superAdminPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Super Admin Password</FormLabel>
                      <FormControl>
                         <div className="relative">
                          <Input type={showSuperAdminPassword ? "text" : "password"} placeholder="Enter your password" {...field} />
                          <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowSuperAdminPassword(!showSuperAdminPassword)}>
                            {showSuperAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            
            {errorMessage && (
              <p className="text-sm font-medium text-destructive p-3 bg-destructive/10 rounded-md">{errorMessage}</p>
            )}

            <Button type="submit" className="w-full text-lg py-6" disabled={isLoading || authLoading}>
              {(isLoading || authLoading) ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              Create Admin Account
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

