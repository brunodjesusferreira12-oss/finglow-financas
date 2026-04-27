import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/utils";

export function InlineNotice({
  title,
  description,
  tone = "info",
}: {
  title: string;
  description: string;
  tone?: "info" | "warning" | "success";
}) {
  const Icon = tone === "warning" ? AlertTriangle : tone === "success" ? CheckCircle2 : Info;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-3xl border px-4 py-4",
        tone === "info" && "border-border bg-card/70",
        tone === "warning" && "border-warning/35 bg-warning/10",
        tone === "success" && "border-success/35 bg-success/10",
      )}
    >
      <div
        className={cn(
          "mt-0.5 rounded-2xl p-2",
          tone === "info" && "bg-secondary text-foreground",
          tone === "warning" && "bg-warning/20 text-warning-foreground",
          tone === "success" && "bg-success/20 text-success",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
