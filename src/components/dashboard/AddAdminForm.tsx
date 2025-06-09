
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
  type User as FirebaseUser, // Renamed to avoid conflict with Admin type if any
  type UserCredential
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { addAdminToFirestore } from "@/lib/firestore";
import { useAuth } from "@/hooks/useAuth";
import React, { useState } from "react";
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (authLoading) {
      setErrorMessage("Authentication is still loading. Please wait and try again.");
      toast({ title: "Authentication Busy", description: "Please wait a moment.", variant: "default" });
      return;
    }
    if (!superAdminUserHook || !superAdminUserHook.email || !superAdminUserHook.uid) {
      setErrorMessage("Super Admin not authenticated or vital details missing. Please re-login.");
      toast({ title: "Authentication Error", description: "Super Admin session invalid.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const saEmail = superAdminUserHook.email;
    const saUID = superAdminUserHook.uid;
    
    let createdNewAdminAuthUser: FirebaseUser | null = null;

    try {
      // Step 1: Re-authenticate Super Admin to verify their identity and refresh session.
      // This ensures the current user is indeed the Super Admin before sensitive operations.
      if (auth.currentUser?.uid !== saUID) {
        // This indicates a session mismatch. The user from useAuth() is not the current Firebase auth.currentUser.
        // This could happen if auth state changed unexpectedly elsewhere.
        setErrorMessage("Critical session mismatch. Expected Super Admin is not the currently authenticated user. Please re-login.");
        toast({ title: "Session Error", description: "Super Admin session mismatch. Please re-login.", variant: "destructive" });
        setIsLoading(false);
        // Optionally, attempt to sign out current user and redirect to login
        if(auth.currentUser) await firebaseSignOut(auth);
        router.push('/?error=sessionMismatch');
        return;
      }
      const credential = EmailAuthProvider.credential(saEmail, values.superAdminPassword);
      await reauthenticateWithCredential(auth.currentUser!, credential);
      // Super Admin is now re-authenticated. auth.currentUser is still Super Admin.

      // Step 2: Create new admin user in Firebase Auth.
      // This will temporarily make the new admin the auth.currentUser.
      const newAdminUserCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      createdNewAdminAuthUser = newAdminUserCredential.user; // auth.currentUser is NOW the new admin

      if (!createdNewAdminAuthUser) {
        // This should ideally not happen if createUserWithEmailAndPassword resolves without error.
        throw new Error("Admin Auth user creation succeeded but returned no user object. This is unexpected.");
      }

      // Step 3: Save admin details to Firestore, using the new admin's UID.
      // This happens while the new admin is technically the auth.currentUser.
      await addAdminToFirestore(createdNewAdminAuthUser.uid, { 
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

      // Step 4: Restore Super Admin's session.
      // Sign out the newly created admin (who is current auth.currentUser).
      await firebaseSignOut(auth); // auth.currentUser is now null.
      // Sign Super Admin back in using their original email and the provided password.
      await signInWithEmailAndPassword(auth, saEmail, values.superAdminPassword); 
      // auth.currentUser should now be the Super Admin again.

      toast({
        title: "Admin Account Created",
        description: `${values.name} has been successfully added as an admin.`,
      });
      form.reset(); // Clear the form
      router.push('/dashboard'); // Redirect to dashboard

    } catch (error: any) { 
      console.error("Error in admin creation process:", error);
      let displayedMessage = "An unexpected error occurred during admin creation.";

      if (error.code) { // Firebase error
        switch (error.code) {
          case 'auth/invalid-credential': // Can occur during re-auth or final super admin sign-in
          case 'auth/wrong-password':
            displayedMessage = "Super Admin password verification failed. Please ensure your password is correct.";
            break;
          case 'auth/email-already-in-use':
            displayedMessage = `The email address '${values.email}' is already in use for another account.`;
            break;
          case 'auth/weak-password':
            displayedMessage = "The password provided for the new admin is too weak.";
            break;
          case 'auth/user-not-found':
             displayedMessage = `Super Admin account (${saEmail}) not found during session restoration. Please contact support.`;
             break;
          default:
            displayedMessage = `Firebase Error: ${error.message} (Code: ${error.code})`;
        }
      } else if (error.message) {
        displayedMessage = error.message;
      }
      
      setErrorMessage(displayedMessage);
      toast({ title: "Operation Failed", description: displayedMessage, variant: "destructive", duration: 7000 });
      
      // **Rollback Attempt**
      // If a new admin Auth user was created but a subsequent step failed (e.g., Firestore save, Super Admin re-login).
      if (createdNewAdminAuthUser) {
        toast({ title: "Attempting Rollback", description: "Trying to clean up newly created admin's Auth account.", variant: "default", duration: 5000});
        try {
          // To delete the new admin (createdNewAdminAuthUser), the Super Admin must be signed in.
          // Or, the new admin must delete themselves if they are the current user.
          
          // Check current auth state.
          const currentAuthUser = auth.currentUser;

          if (currentAuthUser && currentAuthUser.uid === createdNewAdminAuthUser.uid) {
            // The new admin is still the current user; they can delete themselves.
            await deleteUser(createdNewAdminAuthUser);
            toast({ title: "Auth Rollback Successful", description: `Admin Auth user ${values.email} deleted.`});
            createdNewAdminAuthUser = null; // Indicate rollback happened
          } else {
            // Super Admin needs to be signed in to delete another user, which isn't directly possible with client SDK.
            // Or, if Super Admin is already signed in (e.g. error happened AFTER super admin sign-in attempt)
            // This client-side rollback is limited. The most reliable way is Firebase Functions.
            // For now, we log that manual cleanup might be needed if the new admin wasn't current user.
            console.warn(`Rollback limitation: New admin Auth user (${values.email}) was created, but they were not the current user during error. Manual cleanup might be needed.`);
            toast({ title: "Rollback Incomplete", description: `Auth user ${values.email} might need manual deletion if not current.`, variant: "destructive", duration: 10000 });
          }
        } catch (deleteError: any) {
          setErrorMessage(prev => `${prev}. Auth Rollback Failed: ${deleteError.message}. Please manually delete Auth user: ${values.email}.`);
          toast({ title: "Critical: Auth Rollback Failed", description: `Could not delete new admin Auth user ${values.email}. Error: ${deleteError.message}`, variant: "destructive", duration: 10000 });
        }
      }
      
      // **Final Session Restoration Attempt for Super Admin**
      // Regardless of rollback success/failure, try to ensure Super Admin is logged in.
      try {
        if (auth.currentUser?.uid !== saUID) {
          if(auth.currentUser) await firebaseSignOut(auth); // Sign out any unexpected user
          await signInWithEmailAndPassword(auth, saEmail, values.superAdminPassword);
          // console.log("Super Admin session restored in catch block.");
        }
      } catch (sessionRestoreError: any) {
        const restoreMsg = "CRITICAL: Failed to restore Super Admin session after an error. Please re-login manually.";
        console.error(restoreMsg, sessionRestoreError);
        setErrorMessage(prev => `${prev}. ${restoreMsg}`);
        toast({ title: "Critical Session Error", description: restoreMsg, variant: "destructive", duration: 10000});
        // Consider redirecting to login page if SA session cannot be restored
        router.push('/?error=superAdminSessionRestoreFailed');
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
