export default function AuthRoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-muted/40 via-background to-background px-4 py-12 sm:py-16">
      {children}
    </div>
  );
}
