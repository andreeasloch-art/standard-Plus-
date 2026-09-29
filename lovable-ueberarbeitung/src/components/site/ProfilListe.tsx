import { ProfileCard, ProfileCardSkeleton } from "@/components/site/ProfileCard";
import { useMehrLaden } from "@/lib/use-mehr-laden";
import type { OeffentlichesProfil } from "@/lib/profile-data";

/** Profile immer zu zweit nebeneinander (ab Tablet), lädt beim Scrollen weitere nach. */
export function ProfilListe({ profile, laedt }: { profile: OeffentlichesProfil[]; laedt?: boolean }) {
  const { anzahl, ref, mehr, weiter } = useMehrLaden(profile.length, 6);

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        {laedt && Array.from({ length: 4 }).map((_, i) => <ProfileCardSkeleton key={i} />)}
        {profile.slice(0, anzahl).map((p) => (
          <ProfileCard key={p.id} p={p} />
        ))}
      </div>
      {mehr && (
        <div ref={ref} className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={weiter}
            className="rounded-xl border px-5 py-2.5 text-sm font-semibold transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Weitere Profile laden
          </button>
        </div>
      )}
    </>
  );
}
