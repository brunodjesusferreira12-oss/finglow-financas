import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, LockKeyhole, PieChart, ShieldCheck } from "lucide-react";

import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen subtle-grid bg-background">
      <div className="container flex min-h-screen items-center py-10">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="relative hidden overflow-hidden rounded-[32px] border border-border/70 bg-slate-950 px-8 py-10 text-white shadow-panel lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.32),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.12),_transparent_20%)]" />
            <div className="relative space-y-6">
              <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white/85">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-primary">
                  <PieChart className="h-5 w-5" />
                </span>
                {APP_NAME}
              </Link>
              <div className="space-y-4">
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-white/70">
                  Controle financeiro pessoal
                </span>
                <h1 className="max-w-xl text-4xl font-semibold leading-tight text-balance">
                  Um painel elegante para acompanhar entradas, gastos, metas e orçamentos com privacidade.
                </h1>
                <p className="max-w-lg text-base text-white/75">
                  Visual premium, dados isolados por usuário, autenticação segura e deploy fácil na Vercel com Supabase.
                </p>
              </div>
            </div>

            <div className="relative grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: ShieldCheck,
                  title: "Segurança real",
                  description: "RLS no banco e rotas privadas de ponta a ponta.",
                },
                {
                  icon: LockKeyhole,
                  title: "Acesso privado",
                  description: "Cada pessoa enxerga apenas os próprios dados.",
                },
                {
                  icon: ArrowRight,
                  title: "Feito para rodar",
                  description: "Estrutura pronta para publicar gratuitamente.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <item.icon className="mb-3 h-5 w-5 text-primary" />
                  <h2 className="text-sm font-semibold">{item.title}</h2>
                  <p className="mt-2 text-sm text-white/70">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="flex items-center justify-center">{children}</section>
        </div>
      </div>
    </div>
  );
}
