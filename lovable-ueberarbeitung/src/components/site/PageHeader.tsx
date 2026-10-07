import type { ReactNode } from "react";

/** Heller Seitenkopf mit leichtem Türkis- und Goldschimmer. */
/** `eyebrow` wird bewusst nicht mehr angezeigt – die Überschrift trägt allein. */
export function PageHeader({ title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <section className="flaeche-hell">
      <div className="container-page py-12 sm:py-16">
        <h1 className="fade-up text-4xl sm:text-6xl">{title}</h1>
        {children && <div className="prose-measure mt-3 text-lg text-muted-foreground">{children}</div>}
      </div>
    </section>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card-base flex flex-col items-center gap-2 p-10 text-center">
      <p className="font-display text-lg font-semibold">{title}</p>
      {children && <div className="max-w-md text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function ErrorState({ message }: { message?: string }) {
  return (
    <div role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-sm">
      <strong className="text-destructive">Das hat leider nicht geklappt.</strong>
      <p className="mt-1 text-muted-foreground">{message ?? "Bitte laden Sie die Seite neu oder versuchen Sie es später erneut."}</p>
    </div>
  );
}
