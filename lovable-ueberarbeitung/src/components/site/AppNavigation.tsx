import { Link } from "@tanstack/react-router";
import { Hand, Home, Star, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useFavoriten } from "@/lib/favoriten";

/** Untere Navigationsleiste wie in einer App – nur auf dem Handy. */
export function AppNavigation() {
  const { session } = useAuth();
  const { ids } = useFavoriten();
  const punkt = "flex flex-1 flex-col items-center gap-0.5 rounded-[1.25rem] py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors";
  const aktiv = { className: "bg-[var(--glas-stark)] text-tuerkis-700 shadow-soft dark:text-tuerkis-300" };

  return (
    <nav
      aria-label="App-Navigation"
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] z-40 md:hidden"
    >
      {/* Schwebendes Glas-Dock wie in iOS */}
      <div className="glas-leiste mx-auto flex max-w-md gap-1 rounded-[1.75rem] p-1.5">
        <Link to="/" className={punkt} activeProps={aktiv} activeOptions={{ exact: true }}>
          <Home className="h-6 w-6" aria-hidden /> Start
        </Link>
        <Link to="/talente" className={punkt} activeProps={aktiv}>
          <Hand className="h-6 w-6" aria-hidden /> Wischen
        </Link>
        <Link to="/favoriten" className={punkt} activeProps={aktiv}>
          <span className="relative">
            <Star className="h-6 w-6" aria-hidden />
            {ids.length > 0 && (
              <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {ids.length}
              </span>
            )}
          </span>
          Favoriten
        </Link>
        <Link to={session ? "/dashboard" : "/auth"} className={punkt} activeProps={aktiv}>
          <UserRound className="h-6 w-6" aria-hidden /> {session ? "Konto" : "Anmelden"}
        </Link>
      </div>
    </nav>
  );
}
