
"use client";

import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserCircle, Mail, Phone, MapPin, Save, Edit3, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSuperAdminProfile, createOrUpdateSuperAdminProfile } from "@/lib/firestore";
import type { SuperAdminProfile } from "@/types";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Textarea } from "../ui/textarea";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name too long"),
  mobile: z.string().optional().refine(val => !val || /^\+?[0-9\s-()]{7,20}$/.test(val), {
    message: "Invalid mobile number format"
  }),
  address: z.string().optional().max(200, "Address too long"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function UserProfile() {
  const { user, superAdminProfile: authContextProfile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const { data: profile, isLoading, error } = useQuery<SuperAdminProfile | null>({
    queryKey: ['superAdminProfile', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      return getSuperAdminProfile(user.uid);
    },
    enabled: !!user?.uid,
    initialData: authContextProfile,
  });

  const { control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      mobile: '',
      address: '',
    }
  });

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || '',
        mobile: profile.mobile || '',
        address: profile.address || '',
      });
    }
  }, [profile, reset]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormData) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      return createOrUpdateSuperAdminProfile(user.uid, { ...data, email: user.email! });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superAdminProfile', user?.uid] });
      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    }
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Loading profile...</p>
      </div>
    );
  }

  if (error) {
     return (
      <div className="flex flex-col h-full items-center justify-center text-center p-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading Profile</h2>
        <p className="text-muted-foreground mb-4">Could not load profile data: {error.message}</p>
         <Button onClick={() => queryClient.refetchQueries({ queryKey: ['superAdminProfile', user?.uid] })}>Retry</Button>
      </div>
    );
  }
  
  if (!profile) {
     return (
      <div className="flex flex-col h-full items-center justify-center text-center p-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Profile Not Found</h2>
        <p className="text-muted-foreground mb-4">Super Admin profile data is not available.</p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <UserCircle className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">Super Admin Profile</CardTitle>
          </div>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit3 className="mr-2 h-4 w-4" /> Edit
            </Button>
          )}
        </div>
        <CardDescription>View and manage your account details.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="flex items-center space-x-2 p-3 border rounded-md bg-muted/50">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">{profile.email}</span>
            </div>
          </div>

          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                {isEditing ? (
                  <Input id="name" {...field} placeholder="Your full name" />
                ) : (
                  <div className="flex items-center space-x-2 p-3 border rounded-md bg-muted/50">
                     <UserCircle className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">{field.value || 'Not set'}</span>
                  </div>
                )}
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
            )}
          />
          
          <Controller
            name="mobile"
            control={control}
            render={({ field }) => (
               <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                 {isEditing ? (
                    <Input id="mobile" {...field} placeholder="Your mobile number" />
                 ) : (
                    <div className="flex items-center space-x-2 p-3 border rounded-md bg-muted/50">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm">{field.value || 'Not set'}</span>
                    </div>
                 )}
                 {errors.mobile && <p className="text-sm text-destructive">{errors.mobile.message}</p>}
              </div>
            )}
          />

          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                 {isEditing ? (
                    <Textarea id="address" {...field} placeholder="Your address" />
                 ) : (
                    <div className="flex items-start space-x-2 p-3 border rounded-md bg-muted/50 min-h-[40px]">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                        <span className="text-sm whitespace-pre-wrap">{field.value || 'Not set'}</span>
                    </div>
                 )}
                {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
              </div>
            )}
          />
        </CardContent>
        {isEditing && (
          <CardFooter className="flex justify-end space-x-2 border-t pt-6">
            <Button type="button" variant="outline" onClick={() => { setIsEditing(false); reset(); }}>Cancel</Button>
            <Button type="submit" disabled={updateProfileMutation.isPending || !isDirty}>
              {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardFooter>
        )}
      </form>
    </Card>
  );
}
