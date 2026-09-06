import { Users } from "lucide-react";
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";

export const metadata = {
  title: "Manage Accounts | FacultyOS",
  description: "Create student and teacher accounts and send invitations.",
};

export default function AdminUsersPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Manage Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Issue student &amp; teacher IDs. Invited users set their own password via email link.
          </p>
        </div>
      </div>
      <AdminUsersPanel />
    </div>
  );
}
