"use client";

import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-background text-foreground">
        <main className="flex min-h-screen items-center justify-center px-6">
          <div className="w-full max-w-xl rounded-[32px] border border-border/80 bg-card/95 p-8 text-center shadow-panel">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div className="space-y-3">
              <h1 className="text-2xl font-semibold">Algo saiu do esperado</h1>
              <p className="text-sm leading-6 text-muted-foreground">
                {error.message || "O aplicativo encontrou uma falha inesperada. Você pode tentar recarregar ou voltar para a página inicial."}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button onClick={reset}>
                <RotateCcw className="h-4 w-4" />
                Tentar novamente
              </Button>
              <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
                <Home className="h-4 w-4" />
                Ir para o início
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
