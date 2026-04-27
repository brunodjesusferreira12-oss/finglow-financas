import Link from "next/link";
import { Compass } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="container flex min-h-screen items-center justify-center py-10">
      <div className="w-full max-w-2xl space-y-5">
        <EmptyState
          icon={Compass}
          title="Página não encontrada"
          description="O endereço que você tentou abrir não existe mais ou foi movido dentro do aplicativo."
        />
        <div className="flex justify-center">
          <Link href="/" className={cn(buttonVariants())}>
            Voltar ao início
          </Link>
        </div>
      </div>
    </main>
  );
}
