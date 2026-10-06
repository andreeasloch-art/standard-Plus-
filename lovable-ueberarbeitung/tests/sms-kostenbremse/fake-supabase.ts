// Nachgebaute Datenbank für den Test
export const db = { sms_log: [] as any[], profiles: [] as any[], fehlerBeimZaehlen: false, frei: true, nutzer: [] as any[] };
export const aufrufe: string[] = [];
function tabelle(name: string) {
  const f: ((z: any) => boolean)[] = []; let kopfZaehlen = false;
  const b: any = {
    select: (_s: string, o?: any) => { kopfZaehlen = !!o?.head; return b; },
    eq: (k: string, v: any) => { f.push((z) => z[k] === v); return b; },
    gte: (k: string, v: any) => { f.push((z) => z[k] >= v); return b; },
    maybeSingle: async () => ({ data: (db as any)[name].filter((z: any) => f.every((x) => x(z)))[0] ?? null, error: null }),
    insert: async (z: any) => { (db as any)[name].push({ ...z, created_at: new Date().toISOString() }); return { error: null }; },
    then: (ok: any) => {
      if (kopfZaehlen && db.fehlerBeimZaehlen) return Promise.resolve({ count: null, error: { message: "kaputt" } }).then(ok);
      const n = (db as any)[name].filter((z: any) => f.every((x) => x(z))).length;
      return Promise.resolve({ count: n, data: null, error: null }).then(ok);
    },
  };
  return b;
}
const client: any = {
  from: tabelle,
  rpc: async (n: string) => { aufrufe.push("rpc:" + n); return { data: db.frei, error: null }; },
  auth: {
    admin: {
      createUser: async (o: any) => { aufrufe.push("createUser:" + o.phone); const u = { id: "neu-" + db.nutzer.length, email: o.email }; db.nutzer.push(u); db.profiles.push({ id: u.id, telefon: o.phone }); return { data: { user: u }, error: null }; },
      getUserById: async (id: string) => ({ data: { user: db.nutzer.find((u) => u.id === id) ?? { id, email: null } } }),
      updateUserById: async (id: string, o: any) => { aufrufe.push("update:" + id); return { data: {}, error: null }; },
      generateLink: async (o: any) => { aufrufe.push("link:" + o.email); return { data: { properties: { hashed_token: "h123" } }, error: null }; },
    },
    verifyOtp: async () => ({ data: { session: { access_token: "A", refresh_token: "R" } } }),
  },
};
export const supabaseAdmin = client;
export const createClient = () => client;
