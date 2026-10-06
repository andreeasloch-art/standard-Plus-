import { build } from "esbuild";
import path from "node:path";
const r = (p) => path.resolve(p);
await build({ entryPoints: ["test/sms.test.ts"], bundle: true, platform: "node", format: "esm", outfile: "test/out.mjs", logLevel: "error",
  plugins: [{ name: "alias", setup(b) {
    b.onResolve({ filter: /^@tanstack\/react-start\/server$/ }, () => ({ path: r("test/stub-server.ts") }));
    b.onResolve({ filter: /^@\/integrations\/supabase\/client\.server$/ }, () => ({ path: r("test/fake-supabase.ts") }));
    b.onResolve({ filter: /^@supabase\/supabase-js$/ }, () => ({ path: r("test/fake-supabase.ts") }));
    b.onResolve({ filter: /^@\// }, (a) => ({ path: r("src/" + a.path.slice(2) + ".ts") }));
  } }] });
