import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";

import "@/app/globals.css";
import { NotificationProvider } from "@/components/providers/notification-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

const fontSans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontDisplay = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "FinGlow | Gestão financeira pessoal",
  description:
    "Aplicação SaaS de gestão financeira pessoal com dashboard, orçamentos, relatórios e autenticação segura com Supabase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontDisplay.variable} min-h-screen bg-background font-sans text-foreground antialiased`}>
        <ThemeProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
