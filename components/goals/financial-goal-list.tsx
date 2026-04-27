"use client";

import Link from "next/link";
import { CheckCircle2, Pause, PencilLine, Play, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  deleteFinancialGoalAction,
  registerFinancialGoalContributionAction,
  updateFinancialGoalStatusAction,
} from "@/app/actions/financial-goals";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Spinner } from "@/components/ui/spinner";
import { useNotifications } from "@/hooks/use-notifications";
import { GOAL_PRIORITY_LABELS, GOAL_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  financialGoalContributionSchema,
  type FinancialGoalContributionFormValues,
} from "@/lib/validations/financial-goals";
import { cn } from "@/lib/utils";
import type { FinancialGoalProgress, GoalPriority, GoalStatus } from "@/types/finance";

function getDeadlineCopy(goal: FinancialGoalProgress) {
  if (goal.status === "completed") {
    return `Meta concluída. Prazo final: ${formatDate(goal.deadline)}.`;
  }

  if (goal.daysRemaining < 0) {
    const days = Math.abs(goal.daysRemaining);
    return days === 1 ? "Atrasada há 1 dia." : `Atrasada há ${days} dias.`;
  }

  if (goal.daysRemaining === 0) {
    return "Vence hoje.";
  }

  if (goal.daysRemaining === 1) {
    return "Falta 1 dia para o prazo.";
  }

  return `Faltam ${goal.daysRemaining} dias para o prazo.`;
}

function getPriorityTone(priority: GoalPriority) {
  if (priority === "high") return "danger";
  if (priority === "medium") return "warning";
  return "neutral";
}

function getStatusTone(status: GoalStatus) {
  if (status === "completed") return "success";
  if (status === "paused") return "warning";
  return "neutral";
}

function DeleteGoalButton({ goalId }: { goalId: string }) {
  const router = useRouter();
  const { notify } = useNotifications();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm("Deseja excluir esta meta financeira?")) return;

        startTransition(async () => {
          const result = await deleteFinancialGoalAction(goalId);
          notify({ variant: result.success ? "success" : "error", message: result.message });
          router.refresh();
        });
      }}
      aria-label="Excluir meta"
    >
      <Trash2 className="h-4 w-4 text-danger" />
    </Button>
  );
}

function ChangeGoalStatusButton({
  goalId,
  status,
  label,
  icon,
  variant = "secondary",
}: {
  goalId: string;
  status: GoalStatus;
  label: string;
  icon: typeof Pause;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
}) {
  const router = useRouter();
  const { notify } = useNotifications();
  const [isPending, startTransition] = useTransition();
  const Icon = icon;

  return (
    <Button
      variant={variant}
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await updateFinancialGoalStatusAction(goalId, status);
          notify({ variant: result.success ? "success" : "error", message: result.message });
          router.refresh();
        });
      }}
    >
      {isPending ? <Spinner /> : <Icon className="h-4 w-4" />}
      {label}
    </Button>
  );
}

function GoalContributionForm({ goal }: { goal: FinancialGoalProgress }) {
  const router = useRouter();
  const { notify } = useNotifications();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FinancialGoalContributionFormValues>({
    resolver: zodResolver(financialGoalContributionSchema),
    defaultValues: {
      goalId: goal.id,
    },
  });

  const onSubmit = (values: FinancialGoalContributionFormValues) => {
    startTransition(async () => {
      const result = await registerFinancialGoalContributionAction(values);
      notify({ variant: result.success ? "success" : "error", message: result.message });

      if (result.success) {
        reset({ goalId: goal.id });
        router.refresh();
      }
    });
  };

  if (goal.status === "completed") {
    return (
      <div className="rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-muted-foreground">
        Meta concluída. Novos aportes não são necessários por enquanto.
      </div>
    );
  }

  return (
    <form className="space-y-2" onSubmit={handleSubmit(onSubmit)}>
      <input type="hidden" {...register("goalId")} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Input type="number" min="0.01" step="0.01" placeholder="Registrar aporte" {...register("amount")} />
        </div>
        <Button type="submit" size="sm" disabled={isPending} className="sm:min-w-[150px]">
          {isPending ? <Spinner /> : <Plus className="h-4 w-4" />}
          Registrar aporte
        </Button>
      </div>
      {errors.amount ? <p className="text-sm text-danger">{errors.amount.message}</p> : null}
    </form>
  );
}

export function FinancialGoalList({
  goals,
  nearDeadlineCount,
}: {
  goals: FinancialGoalProgress[];
  nearDeadlineCount: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Metas cadastradas</CardTitle>
        <CardDescription>
          {nearDeadlineCount > 0
            ? `${nearDeadlineCount} meta(s) pedem mais atenção por prazo curto ou vencido.`
            : "Acompanhe progresso, status, prazo e aportes de cada objetivo."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className={cn(
              "space-y-5 rounded-3xl border p-5",
              goal.isOverdue && "border-danger/35 bg-danger/5",
              !goal.isOverdue && goal.isNearDeadline && "border-warning/35 bg-warning/10",
              !goal.isOverdue && !goal.isNearDeadline && "border-border/70 bg-secondary/20",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold">{goal.title}</p>
                  <Badge tone={getStatusTone(goal.status)}>{GOAL_STATUS_LABELS[goal.status]}</Badge>
                  <Badge tone={getPriorityTone(goal.priority)}>{GOAL_PRIORITY_LABELS[goal.priority]}</Badge>
                  {goal.isAchieved && goal.status !== "completed" ? <Badge tone="warning">Alvo atingido</Badge> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>{goal.category?.name ?? "Sem categoria"}</span>
                  <span>•</span>
                  <span>
                    Início {formatDate(goal.start_date)} • Limite {formatDate(goal.deadline)}
                  </span>
                </div>
                {goal.description ? <p className="max-w-2xl text-sm text-muted-foreground">{goal.description}</p> : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/metas?edit=${goal.id}`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
                  <PencilLine className="h-4 w-4" />
                </Link>
                {goal.status !== "completed" ? (
                  <ChangeGoalStatusButton goalId={goal.id} status="completed" label="Concluir" icon={CheckCircle2} />
                ) : null}
                {goal.status === "paused" ? (
                  <ChangeGoalStatusButton goalId={goal.id} status="in_progress" label="Retomar" icon={Play} variant="outline" />
                ) : null}
                {goal.status === "in_progress" ? (
                  <ChangeGoalStatusButton goalId={goal.id} status="paused" label="Pausar" icon={Pause} variant="outline" />
                ) : null}
                <DeleteGoalButton goalId={goal.id} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                <p className="text-sm text-muted-foreground">Valor acumulado</p>
                <p className="mt-2 text-xl font-semibold">{formatCurrency(goal.currentAmount)}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                <p className="text-sm text-muted-foreground">Valor restante</p>
                <p className="mt-2 text-xl font-semibold">{formatCurrency(goal.remainingAmount)}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                <p className="text-sm text-muted-foreground">Valor-alvo</p>
                <p className="mt-2 text-xl font-semibold">{formatCurrency(goal.targetAmount)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span className="font-medium">{goal.progressPercentage}% concluído</span>
                <span className="text-muted-foreground">{getDeadlineCopy(goal)}</span>
              </div>
              <ProgressBar value={goal.progressPercentage} tone={goal.deadlineTone} />
            </div>

            <GoalContributionForm goal={goal} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
