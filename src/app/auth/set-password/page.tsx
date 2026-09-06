import { SetPasswordForm } from "@/components/auth/SetPasswordForm";

export const metadata = {
  title: "Set your password | FacultyOS",
};

export default function SetPasswordPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-muted/40 via-background to-background px-4 py-12 sm:py-16">
      <SetPasswordForm />
    </div>
  );
}
