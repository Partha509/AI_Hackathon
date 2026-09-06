"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface AuthButtonProps {
  className?: string;
  onNavigate?: () => void;
}

export function AuthButton({ className, onNavigate }: AuthButtonProps) {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = React.useState<boolean | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setIsAuthed(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setIsAuthed(!!session?.user)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    setIsLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsLoading(false);
    onNavigate?.();
    router.push("/");
    router.refresh();
  }

  if (isAuthed === null) {
    return (
      <Button size="sm" variant="ghost" className={className} disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (isAuthed) {
    return (
      <Button
        size="sm"
        variant="outline"
        className={className}
        onClick={handleSignOut}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
        Sign Out
      </Button>
    );
  }

  return (
    <Button asChild size="sm" className={className}>
      <Link href="/auth" onClick={onNavigate}>
        <LogIn className="h-4 w-4" />
        Sign In
      </Link>
    </Button>
  );
}
