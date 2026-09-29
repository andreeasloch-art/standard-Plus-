import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/lib/auth";
import { ConsentProvider } from "@/lib/consent";
import { registriereApp } from "@/lib/pwa";
import { CookieBanner } from "@/components/site/CookieBanner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { AppNavigation } from "@/components/site/AppNavigation";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";

function NotFoundComponent() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-display text-7xl font-bold">404</p>
      <h1 className="mt-4 text-xl">Seite nicht gefunden</h1>
      <p className="mt-2 text-muted-foreground">Die gesuchte Seite existiert nicht oder wurde verschoben.</p>
      <Button asChild className="mt-6"><Link to="/">Zur Startseite</Link></Button>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <h1 className="text-xl">Diese Seite konnte nicht geladen werden</h1>
      <p className="mt-2 text-muted-foreground">Bitte versuchen Sie es erneut oder kehren Sie zur Startseite zurück.</p>
      <div className="mt-6 flex gap-2">
        <Button onClick={() => { router.invalidate(); reset(); }}>Erneut versuchen</Button>
        <Button asChild variant="outline"><a href="/">Zur Startseite</a></Button>
      </div>
    </div>
  );
}

// So früh wie möglich, damit das Installationssignal von Android nicht verloren geht
registriereApp();

const themeScript = `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Standard Plus" },
      { name: "description", content: "Standard Plus – die europäische Plattform für Personalvermittlung." },
      { name: "author", content: "Standard Plus" },
      { property: "og:site_name", content: "Standard Plus" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      // App-Version (installierbar auf dem Startbildschirm)
      { name: "theme-color", content: "#1f6166" },
      { name: "application-name", content: "Standard Plus" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Standard Plus" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/app/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <ConsentProvider>
        <CookieBanner />
        <a href="#inhalt" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2">
          Zum Inhalt springen
        </a>
        <div className="flex min-h-screen flex-col pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0">
          <Header />
          <main id="inhalt" className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
        <AppNavigation />
        <Toaster position="top-center" />
      </ConsentProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
