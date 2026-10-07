import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRight, Bus, CalendarDays, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/site/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDatum } from "@/lib/profile-data";

export const Route = createFileRoute("/_authenticated/anreise")({
  head: () => ({ meta: [{ title: "Anreise anfragen – Standard Plus" }, { name: "robots", content: "noindex" }] }),
  component: Anreise,
});

type Status = "angefragt" | "in_planung" | "gebucht" | "abgeschlossen" | "storniert";
type AnreiseAnfrage = {
  id: string; von_ort: string; nach_ort: string; datum: string; personen: number;
  hinweis: string | null; status: Status; team_info: string | null; created_at: string;
};

const SCHRITTE: { s: Status; label: string }[] = [
  { s: "angefragt", label: "Angefragt" },
  { s: "in_planung", label: "In Planung" },
  { s: "gebucht", label: "Gebucht" },
  { s: "abgeschlossen", label: "Angekommen" },
];

const heute = () => new Date().toISOString().slice(0, 10);
const schema = z.object({
  von_ort: z.string().trim().min(2, "Bitte Abfahrtsort eingeben.").max(120),
  nach_ort: z.string().trim().min(2, "Bitte Zielort eingeben.").max(120),
  datum: z.string().min(1, "Bitte ein Datum wählen.").refine((d) => d >= heute(), "Das Datum liegt in der Vergangenheit."),
  personen: z.coerce.number().int().min(1).max(9),
  hinweis: z.string().trim().max(500, "Maximal 500 Zeichen.").optional(),
});

/** Fachkraft fragt eine Anreise an; das Standard-Plus-Team organisiert Bus/Fahrt und trägt den Stand ein. */
function Anreise() {
  const { session } = useAuth();
  const uid = session?.user.id;
  const qc = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const liste = useQuery({
    queryKey: ["anreise", uid],
    enabled: !!uid,
    queryFn: async (): Promise<AnreiseAnfrage[]> => {
      const { data, error } = await supabase.from("anreise_anfragen").select("*").eq("user_id", uid!).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AnreiseAnfrage[];
    },
  });

  const anfragen = useMutation({
    mutationFn: async (d: z.infer<typeof schema>) => {
      const { error } = await supabase.from("anreise_anfragen").insert({ ...d, hinweis: d.hinweis || null, user_id: uid! });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Anreise angefragt. Wir melden uns mit einem Vorschlag."); formRef.current?.reset(); qc.invalidateQueries({ queryKey: ["anreise", uid] }); },
    onError: () => toast.error("Anfrage konnte nicht gesendet werden."),
  });
  const stornieren = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("anreise_anfragen").update({ status: "storniert" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Anfrage storniert."); qc.invalidateQueries({ queryKey: ["anreise", uid] }); },
    onError: () => toast.error("Stornieren fehlgeschlagen."),
  });

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const r = schema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!r.success) {
      const errs: Record<string, string> = {};
      r.error.issues.forEach((i) => { errs[String(i.path[0])] ??= i.message; });
      return void setErrors(errs);
    }
    setErrors({});
    anfragen.mutate(r.data);
  };

  const feld = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label htmlFor={name} className="text-sm font-medium">{label}</label>
      <input id={name} name={name} className="field mt-1.5" aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${name}-err` : undefined} {...props} />
      {errors[name] && <p id={`${name}-err`} className="mt-1 text-sm text-destructive">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="text-4xl">Anreise anfragen</h1>
      <p className="mt-2 text-muted-foreground">Sagen Sie uns, von wo und wann. Wir organisieren Bus oder Fahrt und melden uns mit Abfahrt und Ticket.</p>

      <form ref={formRef} onSubmit={submit} noValidate className="card-base mt-6 grid gap-4 p-6 sm:grid-cols-2">
        {feld("von_ort", "Von (Ort, Land)", { placeholder: "z. B. Cluj-Napoca, Rumänien", autoComplete: "address-level2", required: true })}
        {feld("nach_ort", "Nach (Arbeitsort)", { placeholder: "z. B. München", required: true })}
        {feld("datum", "Frühestes Reisedatum", { type: "date", min: heute(), required: true })}
        {feld("personen", "Personen", { type: "number", min: 1, max: 9, defaultValue: 1, inputMode: "numeric" })}
        <div className="sm:col-span-2">
          <label htmlFor="hinweis" className="text-sm font-medium">Hinweis (freiwillig)</label>
          <textarea id="hinweis" name="hinweis" rows={2} maxLength={500} className="field mt-1.5 h-auto py-2" placeholder="z. B. viel Gepäck, Zwischenhalt" />
        </div>
        <p className="text-xs text-muted-foreground sm:col-span-2">
          Wir speichern Ihre Angaben nur, um die Fahrt zu organisieren. Mehr in der <Link to="/datenschutz" className="underline">Datenschutzerklärung</Link>.
        </p>
        <div className="sm:col-span-2">
          <Button type="submit" size="lg" disabled={anfragen.isPending || !uid}><Bus /> {anfragen.isPending ? "Wird gesendet …" : "Anreise anfragen"}</Button>
        </div>
      </form>

      <h2 className="mt-10 text-2xl">Meine Anfragen</h2>
      <div className="mt-4 space-y-3">
        {liste.isLoading && <p className="text-sm text-muted-foreground">Wird geladen …</p>}
        {liste.isError && <ErrorState />}
        {liste.data?.length === 0 && <EmptyState title="Noch keine Anreise angefragt" />}
        {liste.data?.map((a) => {
          const nr = SCHRITTE.findIndex((x) => x.s === a.status);
          return (
            <article key={a.id} className="card-base p-5" aria-label={`Anreise von ${a.von_ort} nach ${a.nach_ort}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="schrift-tafel flex items-center gap-2 text-xl font-semibold">
                  {a.von_ort} <ArrowRight className="h-4 w-4 text-tuerkis-600" aria-label="nach" /> <span className="text-tuerkis-700 dark:text-tuerkis-300">{a.nach_ort}</span>
                </p>
                {a.status === "storniert" && <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold">Storniert</span>}
              </div>
              <p className="mt-1 flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" aria-hidden />ab {formatDatum(a.datum)}</span>
                <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" aria-hidden />{a.personen} {a.personen === 1 ? "Person" : "Personen"}</span>
              </p>
              {a.status !== "storniert" && (
                <ol className="mt-4 grid grid-cols-4 gap-1" aria-label="Stand der Anreise">
                  {SCHRITTE.map((x, i) => (
                    <li key={x.s} className="text-center text-xs">
                      <span className={`mx-auto mb-1 block h-1.5 rounded-full ${i <= nr ? "bg-tuerkis-600" : "bg-muted"}`} aria-hidden />
                      <span className={i === nr ? "font-semibold text-foreground" : "text-muted-foreground"}>
                        {x.label}{i === nr && <span className="sr-only"> (aktueller Stand)</span>}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
              {a.team_info && <p className="mt-3 rounded-lg bg-tint p-3 text-sm text-tint-foreground"><strong>Vom Team:</strong> {a.team_info}</p>}
              {(a.status === "angefragt" || a.status === "in_planung") && (
                <Button variant="ghost" size="sm" className="mt-2" disabled={stornieren.isPending}
                  onClick={() => { if (confirm("Anfrage wirklich stornieren?")) stornieren.mutate(a.id); }}>
                  Anfrage stornieren
                </Button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
