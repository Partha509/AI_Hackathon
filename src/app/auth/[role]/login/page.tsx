import { notFound } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { isRoleKey, ROLE_KEYS, ROLES } from "@/lib/auth-roles";

export function generateStaticParams() {
  return ROLE_KEYS.map((role) => ({ role }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  if (!isRoleKey(role)) return { title: "Sign in | FacultyOS" };
  return {
    title: `${ROLES[role].label} sign in | FacultyOS`,
    description: `Sign in to your FacultyOS ${ROLES[role].label.toLowerCase()} account.`,
  };
}

export default async function RoleLoginPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  if (!isRoleKey(role)) notFound();

  return <AuthForm role={role} mode="login" />;
}
