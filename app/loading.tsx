import { Spinner } from "@/components/ui/spinner";

export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full border border-border/80 bg-card p-4 shadow-soft">
          <Spinner className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Carregando sua experiência financeira</p>
          <p className="text-sm text-muted-foreground">Só um instante enquanto organizamos seus dados.</p>
        </div>
      </div>
    </div>
  );
}
