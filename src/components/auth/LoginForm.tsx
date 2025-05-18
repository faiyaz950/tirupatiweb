
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
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, SUPER_ADMIN_EMAIL } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { WaveHeader } from "@/components/ui/wave-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";


const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);


  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'authFailed') {
      setErrorMessage("Access denied. Only SuperAdmin can log in.");
    }
  }, [searchParams]);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (values.email.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
        setErrorMessage("Access denied: Only SuperAdmin can log in.");
        setIsLoading(false);
        return;
      }

      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "Login Successful",
        description: "Welcome back, Super Admin!",
      });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login failed:", error);
      let message = "Login failed. Please check your credentials.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = "Invalid email or password.";
      } else if (error.code === 'auth/too-many-requests') {
        message = "Too many failed login attempts. Please try again later.";
      }
      setErrorMessage(message);
      toast({
        title: "Login Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <WaveHeader 
        title="Welcome Back"
        subtitle="Sign in to manage your platform"
        icon={<LockKeyhole size={48} className="text-white"/>}
      />
      <main className="flex-grow flex items-center justify-center p-4 -mt-16 sm:-mt-20 md:-mt-24 relative z-10">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-primary">Super Admin Login</CardTitle>
            <CardDescription className="text-center">Enter your credentials to access the dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="superadmin@example.com" {...field} 
                          className="text-base"
                          aria-label="Email"
                        />
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
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="••••••••" {...field} 
                            className="text-base pr-10"
                            aria-label="Password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {errorMessage && (
                  <p className="text-sm font-medium text-destructive text-center bg-destructive/10 p-3 rounded-md">{errorMessage}</p>
                )}
                <Button type="submit" className="w-full text-base" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Login
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
