export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="glass-panel overflow-hidden p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-40 rounded-full bg-secondary/70" />
          <div className="h-11 w-full max-w-2xl rounded-3xl bg-secondary/60" />
          <div className="h-5 w-full max-w-3xl rounded-3xl bg-secondary/50" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-[28px] border border-border/80 bg-card/80 shadow-soft" />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-80 animate-pulse rounded-[28px] border border-border/80 bg-card/80 shadow-soft" />
        <div className="h-80 animate-pulse rounded-[28px] border border-border/80 bg-card/80 shadow-soft" />
      </div>
    </div>
  );
}
