
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
  deleteUser,
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
    }
  }, [superAdminUserHook]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (authLoading) {
      setErrorMessage("Authentication is still loading. Please wait and try again.");
      toast({ title: "Authentication Busy", description: "Please wait a moment.", variant: "default" });
      return;
    }
    
    if (!originalSuperAdminEmail || !originalSuperAdminUID) {
        setErrorMessage("Super Admin details not available. Please re-login.");
        toast({ title: "Authentication Error", description: "Super Admin session details missing. Please re-login.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    
    if (!auth.currentUser || auth.currentUser.uid !== originalSuperAdminUID) {
        setErrorMessage("Super Admin session mismatch or not found. Please re-login.");
        toast({ title: "Session Error", description: "Super Admin session is invalid. Please re-login.", variant: "destructive" });
        if(auth.currentUser) await firebaseSignOut(auth);
        router.push('/?error=sessionMismatchOnSubmit');
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    
    let newAdminAuthUser: FirebaseUser | null = null;

    try {
      // Step 1: Re-authenticate Super Admin
      const credential = EmailAuthProvider.credential(originalSuperAdminEmail, values.superAdminPassword);
      await reauthenticateWithCredential(auth.currentUser!, credential);
      toast({ title: "Super Admin Re-authenticated", description: "Proceeding with admin creation.", duration: 2000 });

      // Step 2: Create new admin user in Firebase Auth
      // This will temporarily make the new admin the auth.currentUser.
      const newAdminUserCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      newAdminAuthUser = newAdminUserCredential.user; 

      if (!newAdminAuthUser) {
        throw new Error("Admin Auth user creation succeeded but returned no user object. This is unexpected.");
      }
      toast({ title: "Admin Auth Account Created", description: `Auth account for ${values.email} created.`, duration: 2000 });
      
      // Step 3: Sign out the newly created admin (who is current auth.currentUser).
      await firebaseSignOut(auth); 
      toast({ title: "Temporary Session Cleared", description: `New admin signed out.`, duration: 2000 });


      // Step 4: Sign Super Admin back in using their original email and the provided password.
      // This ensures the SuperAdmin is the active user for the Firestore write.
      await signInWithEmailAndPassword(auth, originalSuperAdminEmail, values.superAdminPassword); 
      if (!auth.currentUser || auth.currentUser.uid !== originalSuperAdminUID) {
          throw new Error("Failed to restore Super Admin session before Firestore write. Critical error.");
      }
      toast({ title: "Super Admin Session Restored", description: "Ready to save admin profile.", duration: 2000 });


      // Step 5: Save admin details to Firestore, using the new admin's UID.
      // This now happens while the Super Admin is confirmed to be auth.currentUser.
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
      toast({ title: "Admin Profile Saved", description: `Profile for ${values.name} saved to database.`, duration: 2000 });


      toast({
        title: "Admin Account Created Successfully!",
        description: `${values.name} has been added. Redirecting to dashboard...`,
      });
      form.reset(); 
      router.push('/dashboard'); 

    } catch (error: any) { 
      console.error("Error in admin creation process:", error);
      let displayedMessage = "An unexpected error occurred during admin creation.";

      if (error.code) { 
        switch (error.code) {
          case 'auth/invalid-credential': 
             if (newAdminAuthUser && (!auth.currentUser || auth.currentUser.uid !== originalSuperAdminUID)) { 
                displayedMessage = "Failed to restore Super Admin session after admin creation. New admin might be active or session invalid. Please check and re-login as Super Admin.";
             } else if (!newAdminAuthUser) { // Error during initial SA re-authentication
                displayedMessage = "Super Admin password verification failed. Please ensure your password is correct.";
             } else { // Error during SA re-login (step 4)
                displayedMessage = "Super Admin password verification failed during session restoration. Please check your password.";
             }
            break;
          case 'auth/wrong-password': // More specific for re-auth
            displayedMessage = "Super Admin password verification failed. Please ensure your password is correct.";
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
          default:
            displayedMessage = `Firebase Error: ${error.message} (Code: ${error.code})`;
        }
      } else if (error.message) {
        displayedMessage = error.message;
      }
      
      setErrorMessage(displayedMessage);
      toast({ title: "Operation Failed", description: displayedMessage, variant: "destructive", duration: 7000 });
      
      if (newAdminAuthUser) {
        toast({ title: "Attempting Rollback", description: "Trying to clean up newly created admin's Auth account.", variant: "default", duration: 5000});
        try {
          // To delete the new admin, Super Admin must be the current user.
          // Ensure Super Admin is logged in before attempting delete.
          if (!auth.currentUser || auth.currentUser.uid !== originalSuperAdminUID) {
            // If current user is not SA, attempt to sign SA back in
            if(auth.currentUser) await firebaseSignOut(auth); // sign out whatever user is there
            await signInWithEmailAndPassword(auth, originalSuperAdminEmail, values.superAdminPassword);
          }
          
          // Now, SA should be current user. Proceed with deleting the new admin's Auth record.
          // NOTE: This requires a recent sign-in of the user to be deleted. This is complex.
          // For true robustness, a Firebase Function is better for deleting other users.
          // Client-side `deleteUser` works on `auth.currentUser`. So we'd have to sign IN as the new admin, then delete.
          // This is too complex and error-prone for client-side rollback for another user.
          // Best effort: Log the issue for manual cleanup if Firestore save failed after Auth creation.
          console.warn(`Rollback for Auth user ${newAdminAuthUser.email} (UID: ${newAdminAuthUser.uid}) needs to be done manually if Firestore save failed. Super Admin must delete this user from Firebase Console.`);
          toast({ title: "Rollback Action Required", description: `Auth user ${newAdminAuthUser.email} was created but profile save may have failed. Please verify or manually delete Auth user from Firebase Console if necessary.`, variant: "destructive", duration: 15000 });
          
        } catch (rollbackError: any) {
          setErrorMessage(prev => `${prev ? prev + '. ' : ''}Auth Rollback Attempt Failed: ${rollbackError.message}. Please manually check/delete Auth user: ${values.email}.`);
          toast({ title: "Critical: Auth Rollback Attempt Failed", description: `Could not automatically handle rollback for admin Auth user ${values.email}. Error: ${rollbackError.message}`, variant: "destructive", duration: 10000 });
        }
      }
      
      // Final Super Admin Session Restoration Attempt in catch block (if not already restored or failed)
      try {
        if (!auth.currentUser || auth.currentUser.uid !== originalSuperAdminUID) {
          if(auth.currentUser) await firebaseSignOut(auth); 
          await signInWithEmailAndPassword(auth, originalSuperAdminEmail, values.superAdminPassword);
        }
      } catch (sessionRestoreError: any) {
        const restoreMsg = "CRITICAL: Failed to restore Super Admin session after an error. Please re-login manually.";
        console.error(restoreMsg, sessionRestoreError);
        setErrorMessage(prev => `${prev ? prev + '. ' : ''}${restoreMsg}`);
        toast({ title: "Critical Session Error", description: restoreMsg, variant: "destructive", duration: 10000});
        if (router) router.push('/?error=superAdminSessionRestoreFailedInCatch');
      }
    } finally {
      setIsLoading(false);
    }
  }

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
