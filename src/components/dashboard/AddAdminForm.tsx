
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
  type UserCredential
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { addAdminToFirestore } from "@/lib/firestore";
import { useAuth } from "@/hooks/useAuth";
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from 'next/navigation'; // Added useRouter

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
  const { user: superAdminUser, loading: authLoading } = useAuth(); 
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuperAdminPassword, setShowSuperAdminPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter(); // Initialized router

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
    if (!superAdminUser || !superAdminUser.email) {
      setErrorMessage("Super Admin not authenticated. Please re-login.");
      toast({ title: "Authentication Error", description: "Super Admin not authenticated.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const originalSuperAdminEmail = superAdminUser.email; 

    try {
      // 1. Re-authenticate Super Admin
      const credential = EmailAuthProvider.credential(originalSuperAdminEmail, values.superAdminPassword);
      await reauthenticateWithCredential(auth.currentUser!, credential);
      
      // 2. Create new admin user in Firebase Auth
      let newAdminUserCredential: UserCredential;
      try {
        newAdminUserCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      } catch (authError: any) {
        let specificErrorMessage = authError.message;
        if (authError.code === 'auth/email-already-in-use') {
          specificErrorMessage = "This email address is already in use by another account.";
        } else if (authError.code === 'auth/weak-password') {
          specificErrorMessage = "The password is too weak. Please use a stronger password.";
        }
        
        if (auth.currentUser?.email !== originalSuperAdminEmail) {
          if(auth.currentUser) await firebaseSignOut(auth);
          await signInWithEmailAndPassword(auth, originalSuperAdminEmail, values.superAdminPassword);
        }
        setErrorMessage(`Failed to create admin Auth user: ${specificErrorMessage}`);
        toast({ title: "Auth Creation Failed", description: specificErrorMessage, variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const newAdminAuthUser = newAdminUserCredential.user;
      if (!newAdminAuthUser) {
        if(auth.currentUser) await firebaseSignOut(auth); 
        await signInWithEmailAndPassword(auth, originalSuperAdminEmail, values.superAdminPassword);
        setErrorMessage("Admin Auth user creation returned no user. Please try again.");
        toast({ title: "Auth Creation Error", description: "No user object returned after creation.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      // 3. Save admin details to Firestore
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
      } catch (firestoreError: any) {
        setErrorMessage(`Admin Auth user created (UID: ${newAdminAuthUser.uid}) but profile save to Firestore failed: ${firestoreError.message}. Attempting to delete Auth user.`);
        toast({ title: "Firestore Save Failed", description: `Profile not saved. Attempting Auth rollback. Error: ${firestoreError.message}`, variant: "destructive", duration: 7000 });
        
        try {
          await deleteUser(newAdminAuthUser); 
          toast({ title: "Auth Rollback Successful", description: `Admin Auth user ${values.email} deleted.`});
        } catch (deleteError: any) {
          setErrorMessage(`Firestore save failed AND Auth user rollback failed: ${deleteError.message}. Please manually delete Auth user: ${values.email}.`);
          toast({ title: "Critical Error", description: `Firestore save failed and Auth user rollback failed. Manual cleanup needed for ${values.email}. Error: ${deleteError.message}`, variant: "destructive", duration: 10000 });
        }
        
        if(auth.currentUser) await firebaseSignOut(auth); 
        await signInWithEmailAndPassword(auth, originalSuperAdminEmail, values.superAdminPassword);
        
        setIsLoading(false);
        return;
      }

      // 4. Successfully created Auth user and Firestore profile.
      await firebaseSignOut(auth); 
      await signInWithEmailAndPassword(auth, originalSuperAdminEmail, values.superAdminPassword); 

      toast({
        title: "Admin Account Created",
        description: `${values.name} has been successfully added as an admin.`,
      });
      form.reset();
      router.push('/dashboard'); // Redirect to dashboard

    } catch (error: any) { 
      console.error("Overall error in admin creation process:", error);
      let message = "An unexpected error occurred during the admin creation process.";

      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        message = "Super Admin password verification failed. Please ensure your password is correct.";
      } else if (error.code === 'auth/user-not-found' && error.message.includes("new admin")) { 
        // This might indicate an issue during the complex sign-out/sign-in flow if not handled perfectly
        message = "Error managing admin sessions. Please try again or check Firebase console.";
      } else if (error.message) {
        message = error.message;
      }
      
      setErrorMessage(message);
      toast({
        title: "Operation Failed",
        description: message,
        variant: "destructive",
      });
      
      if (auth.currentUser?.email !== originalSuperAdminEmail) {
        try {
            if(auth.currentUser) await firebaseSignOut(auth); 
            await signInWithEmailAndPassword(auth, originalSuperAdminEmail, values.superAdminPassword);
        } catch (sessionRestoreError: any) {
            const restoreMsg = "Failed to restore Super Admin session after an error. Please re-login manually.";
            console.error(restoreMsg, sessionRestoreError);
            setErrorMessage(prev => `${restoreMsg} Original error: ${prev || message}`);
            toast({ title: "Session Restore Failed", description: restoreMsg, variant: "destructive", duration: 7000});
        }
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

