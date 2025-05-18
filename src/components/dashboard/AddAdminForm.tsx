
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
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth, db } from "@/lib/firebase"; // db is imported
import { doc, collection } from "firebase/firestore"; // Added doc and collection imports
import { addAdminToFirestore } from "@/lib/firestore";
import { useAuth } from "@/hooks/useAuth";
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
  company: z.string().min(2, {message: "Company name is required"}).max(100), // This is the text field for company
  department: z.string().min(2, {message: "Department is required"}).max(100),
  designation: z.string().min(2, {message: "Designation is required"}).max(100),
  availability: z.string().min(2, {message: "Availability is required"}).max(50),
  selectedCompany: z.string({ required_error: "Please select a company for the admin." }).min(1, {message: "Please select a company for the admin."}), // Ensure non-empty string
  superAdminPassword: z.string().min(6, { message: "Super Admin password is required." }),
});

export function AddAdminForm() {
  const { toast } = useToast();
  const { user: superAdminUser } = useAuth(); // This is the currently logged-in super admin
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuperAdminPassword, setShowSuperAdminPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      selectedCompany: "", // Changed from undefined to ""
      superAdminPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!superAdminUser || !superAdminUser.email) {
      setErrorMessage("Super Admin not authenticated. Please re-login.");
      toast({ title: "Authentication Error", description: "Super Admin not authenticated.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    let newAdminUID: string | undefined;

    try {
      // 1. Re-authenticate Super Admin (important for sensitive operations)
      const credential = EmailAuthProvider.credential(superAdminUser.email, values.superAdminPassword);
      await reauthenticateWithCredential(auth.currentUser!, credential);
      
      // Firebase Auth user creation part (conceptual as client-side admin creation is complex)
      try {
        // const newUserCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        // newAdminUID = newUserCredential.user.uid;
        // await firebaseSignOut(auth); 
        // await signInWithEmailAndPassword(auth, superAdminUser.email, values.superAdminPassword);
        
        // For this exercise, we generate a Firestore document ID. 
        // Actual Auth user creation should be handled via Firebase Functions or a separate user invite flow.
        const adminDocRef = doc(collection(db, "admins"));
        newAdminUID = adminDocRef.id;
        
         toast({
          title: "Admin Profile Data Ready",
          description: "Admin profile data prepared. Firebase Auth user creation should be handled separately or via Firebase Functions for security and proper auth flow.",
          duration: 7000,
        });

      } catch (authError: any) {
        console.error("Error during conceptual admin auth creation step:", authError);
        setErrorMessage(`Auth Setup Error: ${authError.message}. Note: Admin user creation from client by another admin is complex and not fully implemented here.`);
        setIsLoading(false);
        return;
      }

      if (!newAdminUID) {
        // This case should ideally not be reached if the above try/catch returns on error.
        setErrorMessage("Failed to generate admin ID.");
        setIsLoading(false);
        return;
      }

      await addAdminToFirestore(newAdminUID, {
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

      toast({
        title: "Admin Profile Created",
        description: `${values.name} has been added to Firestore. Ensure Firebase Auth user is also created.`,
      });
      form.reset(); // This will now use defaultValues where selectedCompany is ""
    } catch (error: any) {
      console.error("Failed to add admin:", error);
      let message = "Failed to add admin. Please try again.";
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = "Super Admin password verification failed.";
      } else if (error.message) {
        message = error.message;
      }
      setErrorMessage(message);
      toast({
        title: "Operation Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Add New Admin</CardTitle>
        <CardDescription>Fill in the details to create a new admin account.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Admin's full name" {...field} />
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
                    <FormLabel>Email Address</FormLabel>
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showPassword ? "text" : "password"} placeholder="Set a strong password" {...field} />
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
                      <Input type="tel" placeholder="Admin's mobile number" {...field} />
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
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Admin's full address" {...field} />
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
                    <FormLabel>Company Name (Assigned)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Tirupati Group HQ" {...field} />
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
                    <FormLabel>Parent Company</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}> {/* Changed defaultValue to value */}
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
                      <Input placeholder="e.g., Operations" {...field} />
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
                      <Input placeholder="e.g., Site Manager" {...field} />
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
                    <FormLabel>Availability</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Full-Time, Part-Time (Mon-Fri)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <div className="pt-4 border-t">
              <FormLabel className="text-base font-semibold">Super Admin Verification</FormLabel>
              <p className="text-sm text-muted-foreground mb-4">Enter your password to confirm this action.</p>
              <FormField
                  control={form.control}
                  name="superAdminPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Super Admin Password</FormLabel>
                      <FormControl>
                         <div className="relative">
                          <Input type={showSuperAdminPassword ? "text" : "password"} placeholder="Your password" {...field} />
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
              <p className="text-sm font-medium text-destructive">{errorMessage}</p>
            )}

            <div className="text-yellow-600 bg-yellow-50 p-3 rounded-md text-sm">
              <p><strong>Important Note:</strong> This form adds an admin profile to the database. For full access, the corresponding user account must also exist in Firebase Authentication. Creating Firebase Auth users by an admin typically requires Firebase Functions (Admin SDK) for security and proper auth state management. The password set here is for the new admin's account, if it were to be created via Auth.</p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add Admin
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

    