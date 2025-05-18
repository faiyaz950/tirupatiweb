
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
      selectedCompany: "", 
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
      
      try {
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
      form.reset();
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
    <Card className="w-full max-w-2xl mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-2xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-primary">Create New Administrator</CardTitle>
        <CardDescription className="text-lg text-muted-foreground">Complete the form below to add a new admin user.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6"> {/* Added pt-6 for better spacing after header */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8"> {/* Increased space-y for more breathing room */}
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
                    <FormLabel>Set Password</FormLabel>
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

            <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}> {/* Larger button */}
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              Create Admin Account
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
