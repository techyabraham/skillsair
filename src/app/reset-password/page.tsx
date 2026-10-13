import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = { title: "Reset Password | SkillsAir" };

export default function ResetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <ResetPasswordForm token={searchParams.token || ""} />
    </main>
  );
}
