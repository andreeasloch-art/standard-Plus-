import { ProfileCard, ProfileCardSkeleton } from "@/components/site/ProfileCard";
import { useMehrLaden } from "@/lib/use-mehr-laden";
import type { OeffentlichesProfil } from "@/lib/profile-data";

/** Profile immer zu zweit nebeneinander – auch auf dem Handy. Lädt beim Scrollen weitere nach. */
export function ProfilListe({ profile, laedt }: { profile: OeffentlichesProfil[]; laedt?: boolean }) {
  const { anzahl, ref, mehr, weiter } = useMehrLaden(profile.length, 6);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-5">
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
            className="rounded-xl border border-tuerkis-300 px-5 py-2.5 text-sm font-semibold text-tuerkis-800 transition hover:bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-tuerkis-200"
          >
            Weitere Profile laden
          </button>
        </div>
      )}
    </>
  );
}
