"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useNotifications } from "@/hooks/use-notifications";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { notify } = useNotifications();
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      const result = await signOutAction();
      notify({ variant: result.success ? "success" : "error", message: result.message });

      if (result.success) {
        router.replace("/login");
        router.refresh();
      }
    });
  };

  return (
    <Button variant={compact ? "ghost" : "outline"} onClick={handleSignOut} disabled={isPending} className={compact ? "w-full justify-start" : undefined}>
      {isPending ? <Spinner /> : <LogOut className="h-4 w-4" />}
      Sair
    </Button>
  );
}
