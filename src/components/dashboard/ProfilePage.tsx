"use client";

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/lib/zodResolver";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { backendApi } from "@/lib/api";
import { updateStoredUser } from "@/lib/auth";

const profileSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register: regProfile,
    handleSubmit: handleProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  const {
    register: regPwd,
    handleSubmit: handlePwd,
    reset: resetPwd,
    formState: { errors: pwdErrors },
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

  const onProfileSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    setUpdating(true);
    try {
      const updated = await backendApi.updateProfile(user.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        displayName: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        phone: data.phone,
      });
      updateStoredUser(updated);
      refreshUser();
      addToast({ type: "success", title: "Profile updated successfully!" });
    } catch (err) {
      addToast({
        type: "error",
        title: "Failed to update profile",
        message: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setUpdating(false);
    }
  };

  const onPasswordSubmit = async (formData: PasswordFormData) => {
    if (!user) return;
    setChangingPassword(true);
    try {
      await backendApi.changePassword(user.id, user.email, formData);
      addToast({ type: "success", title: "Password changed successfully!" });
      resetPwd();
    } catch (err) {
      addToast({
        type: "error",
        title: "Failed to change password",
        message: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploaded = await backendApi.uploadAvatar(formData);
      if (uploaded.url) {
        updateStoredUser({ avatar: uploaded.url });
      }
      refreshUser();
      addToast({ type: "success", title: "Avatar updated!" });
    } catch {
      addToast({ type: "error", title: "Avatar upload failed" });
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <h1 className="text-2xl font-heading font-bold text-neutral-900 mb-8">My Profile</h1>

      {/* Avatar Section */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-6 mb-6 flex items-center gap-6">
        <div className="relative">
          <Avatar src={user?.avatar} name={user?.displayName} size="2xl" />
          {avatarUploading && (
            <div className="absolute inset-0 bg-white/80 rounded-full flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-primary-800 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">{user?.displayName}</h2>
          <p className="text-sm text-neutral-400 mb-3">{user?.email}</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
            aria-label="Upload profile photo"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            loading={avatarUploading}
          >
            Change Photo
          </Button>
          <p className="text-xs text-neutral-400 mt-2">JPG, PNG or GIF. Max 2MB.</p>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleProfile(onProfileSubmit)} className="bg-white rounded-2xl border border-neutral-100 p-6 mb-6">
        <h2 className="text-base font-semibold text-neutral-900 mb-5">Personal Information</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Input
            label="First Name"
            error={profileErrors.firstName?.message}
            {...regProfile("firstName")}
          />
          <Input
            label="Last Name"
            error={profileErrors.lastName?.message}
            {...regProfile("lastName")}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Input
            label="Email Address"
            type="email"
            error={profileErrors.email?.message}
            {...regProfile("email")}
          />
          <Input
            label="Phone Number"
            type="tel"
            hint="Optional"
            {...regProfile("phone")}
          />
        </div>

        <div className="flex justify-end mt-5">
          <Button type="submit" variant="primary" size="md" loading={updating}>
            Save Changes
          </Button>
        </div>
      </form>

      {/* Password Change */}
      <form onSubmit={handlePwd(onPasswordSubmit)} className="bg-white rounded-2xl border border-neutral-100 p-6">
        <h2 className="text-base font-semibold text-neutral-900 mb-5">Change Password</h2>

        <div className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            autoComplete="current-password"
            error={pwdErrors.currentPassword?.message}
            {...regPwd("currentPassword")}
          />
          <Input
            label="New Password"
            type="password"
            autoComplete="new-password"
            error={pwdErrors.newPassword?.message}
            {...regPwd("newPassword")}
          />
          <Input
            label="Confirm New Password"
            type="password"
            autoComplete="new-password"
            error={pwdErrors.confirmPassword?.message}
            {...regPwd("confirmPassword")}
          />
        </div>

        <div className="flex justify-end mt-5">
          <Button type="submit" variant="primary" size="md" loading={changingPassword}>
            Update Password
          </Button>
        </div>
      </form>
    </div>
  );
}
