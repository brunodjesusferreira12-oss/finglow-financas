import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  tone = "safe",
}: {
  value: number;
  tone?: "safe" | "warning" | "danger";
}) {
  const normalized = Math.max(0, Math.min(100, value));

  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          tone === "safe" && "bg-success",
          tone === "warning" && "bg-warning",
          tone === "danger" && "bg-danger",
        )}
        style={{ width: `${normalized}%` }}
      />
    </div>
  );
}
