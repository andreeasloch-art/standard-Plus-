import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/site/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useBenachrichtigungen, zeitpunkt } from "@/lib/benachrichtigungen";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/benachrichtigungen")({
  head: () => ({ meta: [{ title: "Benachrichtigungen – Standard Plus" }, { name: "robots", content: "noindex" }] }),
  component: Benachrichtigungen,
});

function Benachrichtigungen() {
  const { liste, anzahlUngelesen, alleGelesen, alsGelesen, isLoading, isError } = useBenachrichtigungen();

  return (
    <div className="container-page max-w-2xl py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-4xl">Benachrichtigungen</h1>
        {anzahlUngelesen > 0 && (
          <Button variant="outline" size="sm" onClick={alleGelesen}><CheckCheck />Alle als gelesen markieren</Button>
        )}
      </div>

      <div className="mt-6">
        {isLoading && <div className="card-base h-40 animate-pulse bg-muted" />}
        {isError && <ErrorState />}
        {!isLoading && !isError && liste.length === 0 && (
          <EmptyState title="Noch nichts Neues">Hier erscheinen Einladungen, Zusagen, Vertrags- und Fahrtnachrichten.</EmptyState>
        )}
        {liste.length > 0 && (
          <ul className="card-base divide-y divide-[var(--glas-linie)] overflow-hidden">
            {liste.map((b) => (
              <li key={b.id}>
                <Link
                  to={(b.link ?? "/dashboard") as "/dashboard"}
                  onClick={() => !b.gelesen_at && alsGelesen(b.id)}
                  className={cn("flex gap-3 p-4 transition-colors hover:bg-[var(--glas)]", !b.gelesen_at && "bg-tint/60")}
                >
                  <span className={cn("mt-2 h-2.5 w-2.5 shrink-0 rounded-full", b.gelesen_at ? "bg-transparent" : "bg-tuerkis-600")} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <strong className={cn("font-semibold", b.gelesen_at && "font-medium")}>{b.titel}</strong>
                      <span className="text-xs text-muted-foreground">{zeitpunkt(b.created_at)}</span>
                    </span>
                    {b.text && <span className="mt-0.5 block text-sm text-muted-foreground">{b.text}</span>}
                    {!b.gelesen_at && <span className="sr-only">(ungelesen)</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <EmailEinstellung />
    </div>
  );
}

function EmailEinstellung() {
  const { session } = useAuth();
  const uid = session?.user.id;
  const qc = useQueryClient();
  const profil = useQuery({
    queryKey: ["email-benachrichtigungen", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("email, email_benachrichtigungen").eq("id", uid!).maybeSingle();
      if (error) throw error;
      return data as { email: string | null; email_benachrichtigungen: boolean } | null;
    },
  });
  const setzen = useMutation({
    mutationFn: async (an: boolean) => {
      const { error } = await supabase.from("profiles").update({ email_benachrichtigungen: an }).eq("id", uid!);
      if (error) throw error;
    },
    onMutate: (an) => {
      qc.setQueryData<{ email: string | null; email_benachrichtigungen: boolean } | null>(["email-benachrichtigungen", uid], (alt) => (alt ? { ...alt, email_benachrichtigungen: an } : alt));
    },
    onSuccess: (_d, an) => toast.success(an ? "E-Mails sind eingeschaltet." : "E-Mails sind ausgeschaltet."),
    onError: () => toast.error("Das hat nicht geklappt. Bitte erneut versuchen."),
    onSettled: () => qc.invalidateQueries({ queryKey: ["email-benachrichtigungen", uid] }),
  });

  if (!profil.data) return null;
  const an = profil.data.email_benachrichtigungen;
  return (
    <section className="card-base mt-8 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="email-titel">
      <div>
        <h2 id="email-titel" className="flex items-center gap-2 text-lg"><Bell className="h-5 w-5 text-tuerkis-600" aria-hidden />Auch per E-Mail</h2>
        <p className="text-sm text-muted-foreground">
          {profil.data.email
            ? <>Wir schicken jede Benachrichtigung zusätzlich an <strong>{profil.data.email}</strong>.</>
            : "Sie haben keine E-Mail-Adresse hinterlegt – Benachrichtigungen sehen Sie hier in der App."}
        </p>
      </div>
      {profil.data.email && (
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm font-medium">
          <input type="checkbox" className="h-5 w-5 accent-[var(--color-tuerkis-600)]" defaultChecked={an} onChange={(e) => setzen.mutate(e.target.checked)} />
          E-Mails erhalten
        </label>
      )}
    </section>
  );
}
