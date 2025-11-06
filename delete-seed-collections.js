import fs from "fs";
import fetch from "node-fetch";

const BASE = "https://carsandvibes.duckdns.org/admin-api";
const COOKIE_FILE = "/root/carsandvibes/cookie.txt";
const SLUGS = ["electronics","home-garden","sports-outdoor"];

async function login() {
  const q = `mutation {
    login(username:"superadmin", password:"superadmin", rememberMe:true) {
      __typename ... on CurrentUser { id }
    }
  }`;
  const res = await fetch(BASE, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({query:q})
  });
  const raw = res.headers.raw();
  const cookie = (raw["set-cookie"]||[]).map(c=>c.split(";")[0]).join("; ");
  if (!cookie) throw new Error("Sem cookie de sessão");
  fs.writeFileSync(COOKIE_FILE, cookie);
  return cookie;
}

async function gql(query, variables, cookie) {
  const r = await fetch(BASE, {
    method:"POST",
    headers:{ "Content-Type":"application/json", "Cookie": cookie },
    body: JSON.stringify({query, variables})
  });
  return r.json();
}

async function getIdBySlug(slug, cookie){
  const q=`query($slug:String!){
    collections(options:{filter:{slug:{eq:$slug}}, take:1}){ items{ id slug } }
  }`;
  const j = await gql(q, {slug}, cookie);
  return j?.data?.collections?.items?.[0]?.id ?? null;
}

async function deleteById(id, cookie){
  const q=`mutation($ids:[ID!]!){ deleteCollections(ids:$ids){ result message } }`;
  return gql(q, {ids:[id]}, cookie);
}

(async()=>{
  try{
    console.log("🔐 Login…");
    const cookie = await login();
    console.log("✅ Cookie OK\n");

    for (const slug of SLUGS){
      const id = await getIdBySlug(slug, cookie);
      if (!id) { console.log(`• ${slug}: já não existe`); continue; }
      const res = await deleteById(id, cookie);
      const out = res?.data?.deleteCollections?.result || res?.errors?.[0]?.message || JSON.stringify(res);
      console.log(`• ${slug}: ${out}`);
    }
    console.log("\n✅ Concluído. (Sugiro reindexar.)");
  } catch(e){ console.error("❌ Erro:", e.message); process.exit(1); }
})();
