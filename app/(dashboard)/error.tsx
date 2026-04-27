"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-4">
      <EmptyState
        icon={AlertTriangle}
        title="Não foi possível carregar esta área"
        description={error.message || "Ocorreu uma falha inesperada ao montar a página. Você pode tentar novamente agora."}
      />
      <div className="flex justify-center">
        <Button onClick={reset}>
          <RotateCcw className="h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}
