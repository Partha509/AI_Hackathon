import { notFound } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { isRoleKey, ROLES } from "@/lib/auth-roles";

// Admin has no self-service signup, so it is intentionally excluded here.
export function generateStaticParams() {
  return Object.values(ROLES)
    .filter((role) => role.allowSignup)
    .map((role) => ({ role: role.key }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  if (!isRoleKey(role)) return { title: "Sign up | FacultyOS" };
  return {
    title: `Create ${ROLES[role].label} account | FacultyOS`,
    description: `Create your FacultyOS ${ROLES[role].label.toLowerCase()} account.`,
  };
}

export default async function RoleSignupPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  if (!isRoleKey(role) || !ROLES[role].allowSignup) notFound();

  return <AuthForm role={role} mode="signup" />;
}
