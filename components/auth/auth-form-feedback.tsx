import { CircleAlert, CircleCheck } from "lucide-react";

import { cn } from "@/lib/utils";

export function AuthFormFeedback({
  message,
  tone,
}: {
  message?: string;
  tone: "success" | "error";
}) {
  if (!message) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm",
        tone === "success" && "border-success/25 bg-success/10 text-success",
        tone === "error" && "border-danger/25 bg-danger/10 text-danger",
      )}
    >
      {tone === "success" ? <CircleCheck className="mt-0.5 h-4 w-4" /> : <CircleAlert className="mt-0.5 h-4 w-4" />}
      <p>{message}</p>
    </div>
  );
}
