import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, Moon, Sun, X, LogOut, LayoutDashboard, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth";
import { useFavoriten } from "@/lib/favoriten";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/talente", label: "Talente finden" },
  { to: "/unternehmen", label: "Unternehmen" },
  { to: "/arbeitnehmer", label: "Arbeitnehmer" },
  { to: "/preise", label: "Preise" },
] as const;

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch { /* ignore */ }
  };
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label={dark ? "Hellmodus aktivieren" : "Dunkelmodus aktivieren"}>
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}

function FavoritenLink() {
  const { ids } = useFavoriten();
  return (
    <Link to="/favoriten" aria-label={`Favoriten (${ids.length})`} className="relative flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-[var(--glas)]">
      <Star className="h-5 w-5" aria-hidden />
      {ids.length > 0 && (
        <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground" aria-hidden>
          {ids.length}
        </span>
      )}
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const menuBtn = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); menuBtn.current?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const signOut = async () => {
    setOpen(false);
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const linkCls = "rounded-md px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-[var(--glas)] hover:text-foreground";

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-b from-background via-background/80 to-transparent pt-2 pb-1 sm:pt-3">
      {/* Schwebende Glasleiste */}
      <div className="container-page">
      <div className="glas-leiste flex h-14 items-center justify-between gap-4 rounded-xl pl-4 pr-1.5 sm:h-16 sm:pl-6 sm:pr-2">
        <Logo className="h-5 sm:h-6" />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Hauptnavigation">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className={linkCls} activeProps={{ className: "bg-[var(--glas-stark)] text-tuerkis-800 shadow-soft dark:text-tuerkis-200" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <FavoritenLink />
          <ThemeToggle />
          <div className="hidden items-center gap-2 md:flex">
            {session ? (
              <>
                <Button asChild variant="outline" size="sm"><Link to="/dashboard"><LayoutDashboard />Dashboard</Link></Button>
                <Button variant="ghost" size="sm" onClick={signOut}><LogOut />Abmelden</Button>
              </>
            ) : (
              <Button asChild size="sm" variant="outline"><Link to="/auth">Anmelden</Link></Button>
            )}
          </div>
          <Button ref={menuBtn} variant="ghost" size="icon" className="md:hidden" aria-controls="mobile-nav" aria-label={open ? "Menü schließen" : "Menü öffnen"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      </div>
      {open && (
        <nav ref={menuRef} id="mobile-nav" className="container-page mt-2 md:hidden" aria-label="Mobile Navigation">
          <div className="glas-leiste flex flex-col gap-1 rounded-xl p-3">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 text-base font-medium hover:bg-[var(--glas)]">
                {n.label}
              </Link>
            ))}
            <div className="mt-2 grid gap-2">
              {session ? (
                <>
                  <Button asChild variant="outline"><Link to="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link></Button>
                  <Button variant="ghost" onClick={signOut}>Abmelden</Button>
                </>
              ) : (
                <Button asChild><Link to="/auth" onClick={() => setOpen(false)}>Anmelden</Link></Button>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
