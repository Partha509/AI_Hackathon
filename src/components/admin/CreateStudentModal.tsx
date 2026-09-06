"use client";

import * as React from "react";
import { UserPlus, GraduationCap, Loader2, Check, Hash, Calendar } from "lucide-react";
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
import { provisionStudentAction } from "@/app/actions/admin";
import { ALL_SEMESTERS } from "@/lib/semester-utils";

interface CreateStudentModalProps {
  onUserCreated?: () => void;
  trigger?: React.ReactNode;
}

export function CreateStudentModal({
  onUserCreated,
  trigger,
}: CreateStudentModalProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [studentIdNumber, setStudentIdNumber] = React.useState("");
  const [initialSemester, setInitialSemester] = React.useState("1.1");
  const [department, setDepartment] = React.useState("CSE");
  const [tempPassword, setTempPassword] = React.useState("Aust1234!");
  const [successInfo, setSuccessInfo] = React.useState<{
    email: string;
    studentIdNumber: string;
    currentSemester: string;
    tempPassword: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !studentIdNumber.trim()) {
      toast.error("Full name, email, and Student ID Number are required.");
      return;
    }

    setLoading(true);
    const res = await provisionStudentAction({
      fullName,
      email,
      studentIdNumber,
      initialSemester,
      department,
      tempPassword,
    });
    setLoading(false);

    if (res.success) {
      toast.success(`Student profile provisioned for ${fullName}!`);
      setSuccessInfo({
        email: res.email || email,
        studentIdNumber: res.studentIdNumber || studentIdNumber,
        currentSemester: res.currentSemester || initialSemester,
        tempPassword: res.tempPassword || tempPassword,
      });
      onUserCreated?.();
    } else {
      toast.error(res.error || "Failed to provision student account");
    }
  }

  function handleClose() {
    setOpen(false);
    setSuccessInfo(null);
    setFullName("");
    setEmail("");
    setStudentIdNumber("");
    setInitialSemester("1.1");
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
          <Button
            size="sm"
            className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Provision Student</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <UserPlus className="h-4 w-4" />
            </div>
            <DialogTitle>Provision Student Account</DialogTitle>
          </div>
          <DialogDescription>
            Register an undergraduate student with immutable Student ID Number and current academic semester level.
          </DialogDescription>
        </DialogHeader>

        {successInfo ? (
          <div className="space-y-4 py-3">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-900 dark:text-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-700 dark:text-emerald-400">
                <Check className="h-4 w-4" />
                <span>Student Enrolled in System</span>
              </div>
              <p>Generated credentials and academic placement:</p>
              <div className="bg-background/80 p-3 rounded-lg border border-border font-mono space-y-1.5 text-xs">
                <div>
                  <span className="text-muted-foreground">Student ID: </span>
                  <strong className="text-primary">{successInfo.studentIdNumber}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Semester: </span>
                  <strong className="text-foreground">{successInfo.currentSemester}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Email: </span>
                  <strong className="text-foreground">{successInfo.email}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Temp Password: </span>
                  <strong className="text-accent">{successInfo.tempPassword}</strong>
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
              <Label htmlFor="studentName" className="text-xs font-semibold">
                Full Name
              </Label>
              <Input
                id="studentName"
                placeholder="e.g. Sabbir Ahmed"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="studentEmail" className="text-xs font-semibold">
                Student Institutional Email
              </Label>
              <Input
                id="studentEmail"
                type="email"
                placeholder="e.g. sabbir.210104099@aust.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="studentId" className="text-xs font-semibold flex items-center gap-1">
                  <Hash className="h-3 w-3 text-muted-foreground" />
                  <span>Student ID Number</span>
                </Label>
                <Input
                  id="studentId"
                  placeholder="e.g. 21.01.04.099"
                  value={studentIdNumber}
                  onChange={(e) => setStudentIdNumber(e.target.value)}
                  required
                  className="h-9 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="semSelect" className="text-xs font-semibold flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span>Current Semester</span>
                </Label>
                <select
                  id="semSelect"
                  value={initialSemester}
                  onChange={(e) => setInitialSemester(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-semibold shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {ALL_SEMESTERS.map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sDept" className="text-xs font-semibold">
                  Department
                </Label>
                <select
                  id="sDept"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="CSE">CSE</option>
                  <option value="EEE">EEE</option>
                  <option value="CE">CE</option>
                  <option value="ME">ME</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sTempPass" className="text-xs font-semibold">
                  Temp Password
                </Label>
                <Input
                  id="sTempPass"
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
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold gap-1.5"
                disabled={loading}
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{loading ? "Provisioning..." : "Provision Student"}</span>
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
