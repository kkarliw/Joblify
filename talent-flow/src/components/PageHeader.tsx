import { ReactNode } from "react";

export const PageHeader = ({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: string; subtitle?: string; action?: ReactNode }) => (
  <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
    <div>
      {eyebrow && <p className="text-[11px] font-subtitle font-semibold uppercase tracking-wider text-muted-foreground">{eyebrow}</p>}
      <h1 className="mt-1 font-display text-2xl md:text-3xl font-bold text-foreground">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground font-sans max-w-2xl">{subtitle}</p>}
    </div>
    {action}
  </header>
);
