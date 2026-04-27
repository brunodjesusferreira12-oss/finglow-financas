import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  description: string;
  icon?: LucideIcon;
  tone?: "neutral" | "success" | "danger";
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-semibold">{value}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {Icon ? (
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl",
                tone === "neutral" && "bg-secondary text-foreground",
                tone === "success" && "bg-success/15 text-success",
                tone === "danger" && "bg-danger/15 text-danger",
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
