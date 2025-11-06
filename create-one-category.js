import fs from "fs";
import fetch from "node-fetch";

const BASE = "https://carsandvibes.duckdns.org/admin-api";
const COOKIE_FILE = "/root/carsandvibes/cookie.txt";

const ROOT_PAYLOAD = {
  code: "pecas-competicao-performance",
  namePT: "Peças de Competição e Performance",
  descriptionPT: "Componentes de upgrade e competição.",
  nameEN: "Motorsport & Performance Parts",
  descriptionEN: "Upgrade and competition components.",
  nameFR: "Pièces Compétition & Performance",
  descriptionFR: "Composants d'amélioration et de compétition.",
  nameES: "Piezas de Competición y Rendimiento",
  descriptionES: "Componentes de mejora y competición.",
};

// Filtro mínimo exigido pelo Vendure para Collections (não filtra nada)
const NOOP_FILTER = [{
  code: "facet-value-filter",
  arguments: [
    { name: "facetValueIds", value: "[]" },
    { name: "containsAny", value: "false" },
  ],
}];

async function login() {
  const q = `mutation {
    login(username:"superadmin", password:"superadmin", rememberMe:true) {
      __typename
      ... on CurrentUser { id identifier }
      ... on InvalidCredentialsError { message }
    }
  }`;
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: q }),
  });
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) {
    const t = await res.text();
    throw new Error("Sem cookie de sessão. Resposta: " + t);
  }
  fs.writeFileSync(COOKIE_FILE, setCookie);
  return setCookie;
}

async function gql(query, variables = {}, cookie) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookie,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  return json;
}

async function ensureCategory(cookie) {
  const slug = ROOT_PAYLOAD.code;

  const createMutation = `
    mutation Create($input: CreateCollectionInput!) {
      createCollection(input: $input) {
        __typename
        ... on Collection { id }
      }
    }
  `;

  const updateMutation = `
    mutation Update($input: UpdateCollectionInput!) {
      updateCollection(input: $input) {
        __typename
        ... on Collection { id }
      }
    }
  `;

  const findQuery = `
    query Find($slug: String!) {
      collections(options:{ filter:{ slug:{ eq:$slug }}, take:1 }) {
        items { id slug }
        totalItems
      }
    }
  `;

  // tenta create
  const createInput = {
    isPrivate: false,
    inheritFilters: false,
    filters: NOOP_FILTER,
    translations: [
      { languageCode: "pt", name: ROOT_PAYLOAD.namePT, slug, description: ROOT_PAYLOAD.descriptionPT },
      { languageCode: "en", name: ROOT_PAYLOAD.nameEN, slug, description: ROOT_PAYLOAD.descriptionEN },
      { languageCode: "fr", name: ROOT_PAYLOAD.nameFR, slug, description: ROOT_PAYLOAD.descriptionFR },
      { languageCode: "es", name: ROOT_PAYLOAD.nameES, slug, description: ROOT_PAYLOAD.descriptionES },
    ],
  };

  const jsonCreate = await gql(createMutation, { input: createInput }, cookie);

  // Se criou, ótimo
  if (jsonCreate?.data?.createCollection?.__typename === "Collection") {
    console.log("✅ Criada:", slug);
    return;
  }

  // Se não criou, pode já existir — vamos procurar e fazer update das traduções
  const found = await gql(findQuery, { slug }, cookie);
  const id = found?.data?.collections?.items?.[0]?.id;
  if (!id) {
    // devolve o erro bruto
    console.log("⚠️ Falha no create:", JSON.stringify(jsonCreate));
    throw new Error("Não foi possível criar nem localizar '" + slug + "'");
  }

  const updateInput = {
    id,
    translations: [
      { languageCode: "pt", name: ROOT_PAYLOAD.namePT, slug, description: ROOT_PAYLOAD.descriptionPT },
      { languageCode: "en", name: ROOT_PAYLOAD.nameEN, slug, description: ROOT_PAYLOAD.descriptionEN },
      { languageCode: "fr", name: ROOT_PAYLOAD.nameFR, slug, description: ROOT_PAYLOAD.descriptionFR },
      { languageCode: "es", name: ROOT_PAYLOAD.nameES, slug, description: ROOT_PAYLOAD.descriptionES },
    ],
  };

  const jsonUpdate = await gql(updateMutation, { input: updateInput }, cookie);
  if (jsonUpdate?.data?.updateCollection?.__typename === "Collection") {
    console.log("🔁 Atualizada:", slug);
    return;
  }
  console.log("⚠️ Falha no update:", JSON.stringify(jsonUpdate));
  throw new Error("Não foi possível atualizar '" + slug + "'");
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  try {
    console.log("🔐 Login…");
    const cookie = await login();
    console.log("✅ Cookie guardado.");

    const MAX_TRIES = 8;
    for (let i = 1; i <= MAX_TRIES; i++) {
      try {
        await ensureCategory(cookie);
        console.log("🎯 Done");
        break;
      } catch (e) {
        const msg = String(e?.message || e);
        if (msg.includes("SQLITE_BUSY") || msg.includes("database is locked")) {
          const wait = 500 * i; // backoff
          console.log(`⏳ SQLITE_BUSY (tentativa ${i}/${MAX_TRIES}) — a aguardar ${wait}ms…`);
          await sleep(wait);
          continue;
        }
        throw e;
      }
    }
  } catch (e) {
    console.error("❌ Erro:", e);
    process.exit(1);
  }
})();
