// assign-principal-facets.mjs
// Atribui automaticamente a facet "categoria-principal" aos PRODUCTS
// com base na facet antiga "categoria" (do fornecedor).

import fs from "fs";

// --------------------------------------
// 1) LER .env.script À MÃO
// --------------------------------------

function loadEnvScript(path) {
  try {
    const text = fs.readFileSync(path, "utf8");
    for (const rawLine of text.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;

      const m = line.match(/^([^=#]+)=(.*)$/);
      if (!m) continue;

      const key = m[1].trim();
      const value = m[2].trim();

      process.env[key] = value;
    }
    console.log("✅ .env.script carregado");
  } catch (e) {
    console.error("⚠️ Não consegui ler .env.script:", e.message);
  }
}

loadEnvScript("./.env.script");

// --------------------------------------
// 2) CONFIG BÁSICA
// --------------------------------------

const ADMIN_API_URL =
  process.env.ADMIN_API_URL || "http://127.0.0.1:3000/admin-api";
const ADMIN_COOKIE = process.env.VENDURE_ADMIN_COOKIE;

if (!ADMIN_COOKIE) {
  console.error("DEBUG ENV:", process.env);
  throw new Error("❌ Falta VENDURE_ADMIN_COOKIE no .env.script");
}

console.log("🔐 Cookie usado:", ADMIN_COOKIE);

// --------------------------------------
// 3) GraphQL wrapper com autenticação
// --------------------------------------

async function graphql(query, variables = {}) {
  const res = await fetch(ADMIN_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: ADMIN_COOKIE,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors) {
    console.error("GraphQL errors:", JSON.stringify(json.errors, null, 2));
    throw new Error("GraphQL error");
  }
  return json.data;
}

// --------------------------------------
// 4) CONFIG DO MAPA DE CATEGORIAS
// --------------------------------------

// facet antiga (code da facet "CATEGORIA" no admin)
const OLD_CATEGORY_FACET_CODE = "categoria";

// facet nova (code da facet "Categoria Principal")
const PRINCIPAL_FACET_CODE = "categoria-principal";

// Mapa: code da facet antiga -> code da facet principal
// (estes são os CODES, não os nomes. Ajusta se no teu admin forem outros)
const CATEGORY_TO_PRINCIPAL = {
  pitline: "equip_mecanico",
  accessoires: "equip_mecanico",
  lubrifiants: "equip_mecanico",
  additifs: "equip_mecanico",
  opportunites: "equip_mecanico",
  merchandising: "equip_mecanico",
  sim_racing: "equip_mecanico",

  fluids: "capacetes_karting",
  soin_protection: "capacetes_karting",
  lifestyle: "capacetes_karting",
  sacs_bagagerie: "capacetes_karting",
  sieges: "capacetes_karting",
  volants: "capacetes_karting",
  securite: "capacetes_karting",
  electricite_electronique: "capacetes_karting",

  equipement_pilote_fia: "piloto",
  bottines_fia: "piloto",
  gants_fia: "piloto",
  combinaisons_fia: "piloto",
  casques_pilote: "piloto",
  hans_protections_hybrides: "piloto",
  communication: "piloto",
  vetements_karting: "piloto",
  protections_pilote_karting: "piloto",
};

// --------------------------------------
// 5) Carregar todas as facetValues (com paginação)
// --------------------------------------

async function loadAllFacetValues() {
  console.log("📥 A carregar facetValues...");
  const take = 1000;
  let skip = 0;
  const all = [];

  while (true) {
    const data = await graphql(
      `
        query FacetValues($skip: Int!, $take: Int!) {
          facetValues(options: { skip: $skip, take: $take }) {
            totalItems
            items {
              id
              code
              name
              facet {
                code
              }
            }
          }
        }
      `,
      { skip, take }
    );

    const { items, totalItems } = data.facetValues;
    all.push(...items);
    skip += items.length;

    if (skip >= totalItems) break;
  }

  console.log(`✅ Total facetValues carregadas: ${all.length}`);
  return all;
}

// --------------------------------------
// 6) Carregar todos os PRODUCTS (com paginação)
// --------------------------------------

async function loadAllProducts() {
  console.log("📥 A carregar products...");
  const take = 100;
  let skip = 0;
  const all = [];

  while (true) {
    const data = await graphql(
      `
        query Products($skip: Int!, $take: Int!) {
          products(options: { skip: $skip, take: $take }) {
            totalItems
            items {
              id
              facetValues {
                id
                code
                facet { code }
              }
            }
          }
        }
      `,
      { skip, take }
    );

    const { items, totalItems } = data.products;
    all.push(...items);
    skip += items.length;

    if (skip >= totalItems) break;
  }

  console.log(`✅ Total products carregados: ${all.length}`);
  return all;
}

// --------------------------------------
// 7) Mutação para atualizar produto
// --------------------------------------

async function updateProductFacetValues(productId, facetValueIds) {
  const mutation = `
    mutation UpdateProduct($input: UpdateProductInput!) {
      updateProduct(input: $input) {
        __typename
        ... on Product { id }
        ... on ErrorResult { message }
      }
    }
  `;

  const data = await graphql(mutation, {
    input: {
      id: productId,
      facetValueIds,
    },
  });

  if (data.updateProduct.__typename === "ErrorResult") {
    console.error(
      `⚠️ Erro a atualizar produto ${productId}:`,
      data.updateProduct.message
    );
  }
}

// --------------------------------------
// 8) MAIN
// --------------------------------------

async function main() {
  const facetValues = await loadAllFacetValues();

  // Mapa: "facetCode:code" -> facetValue
  const facetMap = {};
  for (const fv of facetValues) {
    facetMap[`${fv.facet.code}:${fv.code}`] = fv;
  }

  // Mapa de facet principal: code -> id
  const principalFacetByCode = {};
  for (const fv of facetValues) {
    if (fv.facet.code === PRINCIPAL_FACET_CODE) {
      principalFacetByCode[fv.code] = fv.id;
    }
  }

  console.log("✅ Facets principais disponíveis:", Object.keys(principalFacetByCode));

  const products = await loadAllProducts();
  let updatedCount = 0;

  for (const product of products) {
    const existingFacetIds = product.facetValues.map((fv) => fv.id);

    // Códigos da facet antiga presentes no produto
    const oldCategoryCodes = product.facetValues
      .filter((fv) => fv.facet.code === OLD_CATEGORY_FACET_CODE)
      .map((fv) => fv.code);

    const principalsToAdd = new Set();

    for (const oldCode of oldCategoryCodes) {
      const principalCode = CATEGORY_TO_PRINCIPAL[oldCode];
      if (!principalCode) continue;

      const principalFacetId = principalFacetByCode[principalCode];
      if (!principalFacetId) {
        console.warn(
          `⚠️ Não encontrei facetValue da categoria-principal com code "${principalCode}"`
        );
        continue;
      }

      principalsToAdd.add(principalFacetId);
    }

    if (principalsToAdd.size === 0) {
      continue;
    }

    const newFacetIds = Array.from(
      new Set([...existingFacetIds, ...principalsToAdd])
    );

    if (newFacetIds.length === existingFacetIds.length) {
      continue; // nada novo para adicionar
    }

    await updateProductFacetValues(product.id, newFacetIds);
    updatedCount++;
    console.log(`✔️ Produto ${product.id} atualizado`);
  }

  console.log(`\n🎉 COMPLETO — ${updatedCount} produtos atualizados.`);
}

main().catch((err) => {
  console.error("❌ ERRO GERAL:", err);
  process.exit(1);
});
