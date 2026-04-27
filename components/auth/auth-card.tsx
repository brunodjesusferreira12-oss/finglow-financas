import type { ReactNode } from "react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthCard({
  title,
  description,
  children,
  footerText,
  footerLinkHref,
  footerLinkLabel,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footerText: string;
  footerLinkHref: string;
  footerLinkLabel: string;
}) {
  return (
    <Card className="w-full max-w-xl rounded-[32px] border-border/70 bg-card/95 shadow-panel">
      <CardHeader className="space-y-3 p-8">
        <CardTitle className="text-3xl">{title}</CardTitle>
        <CardDescription className="text-sm leading-6">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 px-8 pb-8">
        {children}
        <p className="text-center text-sm text-muted-foreground">
          {footerText}{" "}
          <Link href={footerLinkHref} className="font-semibold text-primary transition hover:text-primary/80">
            {footerLinkLabel}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
