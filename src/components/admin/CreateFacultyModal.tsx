"use client";

import * as React from "react";
import { UserPlus, GraduationCap, Loader2, KeyRound, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { provisionFacultyAction } from "@/app/actions/admin";

interface CreateFacultyModalProps {
  onUserCreated?: () => void;
  trigger?: React.ReactNode;
}

export function CreateFacultyModal({
  onUserCreated,
  trigger,
}: CreateFacultyModalProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [department, setDepartment] = React.useState("CSE");
  const [tempPassword, setTempPassword] = React.useState("Aust1234!");
  const [successInfo, setSuccessInfo] = React.useState<{
    email: string;
    tempPassword: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error("Faculty name and institutional email are required.");
      return;
    }

    setLoading(true);
    const res = await provisionFacultyAction({
      fullName,
      email,
      department,
      tempPassword,
    });
    setLoading(false);

    if (res.success) {
      toast.success(`Faculty account provisioned for ${fullName}!`);
      setSuccessInfo({
        email: res.email || email,
        tempPassword: res.tempPassword || tempPassword,
      });
      onUserCreated?.();
    } else {
      toast.error(res.error || "Failed to provision faculty account");
    }
  }

  function handleClose() {
    setOpen(false);
    setSuccessInfo(null);
    setFullName("");
    setEmail("");
    setTempPassword("Aust1234!");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
        else setOpen(true);
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            <GraduationCap className="h-4 w-4" />
            <span>+ Provision Faculty</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <GraduationCap className="h-4 w-4" />
            </div>
            <DialogTitle>Provision Faculty Account</DialogTitle>
          </div>
          <DialogDescription>
            Register a verified university faculty instructor with course assignment privileges.
          </DialogDescription>
        </DialogHeader>

        {successInfo ? (
          <div className="space-y-4 py-3">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-900 dark:text-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-700 dark:text-emerald-400">
                <Check className="h-4 w-4" />
                <span>Account Created Successfully</span>
              </div>
              <p>Share these temporary credentials with the faculty member:</p>
              <div className="bg-background/80 p-2.5 rounded-lg border border-border font-mono space-y-1">
                <div>
                  <span className="text-muted-foreground">Email: </span>
                  <strong className="text-foreground">{successInfo.email}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Temp Password: </span>
                  <strong className="text-primary">{successInfo.tempPassword}</strong>
                </div>
              </div>
            </div>
            <Button className="w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="facultyName" className="text-xs font-semibold">
                Full Name & Academic Title
              </Label>
              <Input
                id="facultyName"
                placeholder="e.g. Dr. Tanvir Rahman / Lecturer Hasan Mahmud"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="facultyEmail" className="text-xs font-semibold">
                University Email Address
              </Label>
              <Input
                id="facultyEmail"
                type="email"
                placeholder="e.g. tanvir.cse@aust.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dept" className="text-xs font-semibold">
                  Department
                </Label>
                <select
                  id="dept"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="CSE">Computer Science & Eng (CSE)</option>
                  <option value="EEE">Electrical & Electronic Eng (EEE)</option>
                  <option value="CE">Civil Engineering (CE)</option>
                  <option value="ME">Mechanical Engineering (ME)</option>
                  <option value="TE">Textile Engineering (TE)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tempPass" className="text-xs font-semibold">
                  Temporary Password
                </Label>
                <Input
                  id="tempPass"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="h-9 font-mono text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
                disabled={loading}
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{loading ? "Provisioning..." : "Provision Faculty"}</span>
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
