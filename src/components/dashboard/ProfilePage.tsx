"use client";

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/lib/zodResolver";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { wpApi } from "@/lib/api";
import { updateStoredUser } from "@/lib/auth";

const profileSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  displayName: z.string().min(2, "Display name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  bio: z.string().max(500, "Bio max 500 characters").optional(),
  timezone: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const TIMEZONES = [
  "Africa/Lagos",
  "Africa/Accra",
  "Africa/Nairobi",
  "Africa/Cairo",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Dubai",
];

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
      displayName: user?.displayName || "",
      email: user?.email || "",
      bio: user?.bio || "",
      timezone: user?.timezone || "Africa/Lagos",
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
      const updated = await wpApi.updateProfile(user.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        displayName: data.displayName,
        email: data.email,
        phone: data.phone,
        bio: data.bio,
        timezone: data.timezone,
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
      await wpApi.changePassword(user.id, user.email, formData);
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
      const uploaded = await wpApi.uploadAvatar(formData);
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
            label="Display Name"
            error={profileErrors.displayName?.message}
            {...regProfile("displayName")}
          />
          <Input
            label="Email Address"
            type="email"
            error={profileErrors.email?.message}
            {...regProfile("email")}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Input
            label="Phone Number"
            type="tel"
            hint="Optional"
            {...regProfile("phone")}
          />
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Timezone</label>
            <select
              className="input-field"
              {...regProfile("timezone")}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>

        <Textarea
          label="Bio"
          rows={4}
          placeholder="Tell us about yourself..."
          hint="Max 500 characters"
          error={profileErrors.bio?.message}
          {...regProfile("bio")}
        />

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
