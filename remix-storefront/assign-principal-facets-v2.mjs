// assign-principal-facets-v2.mjs
// Usa a facet "sub_category" para atribuir automaticamente a facet
// "categoria-principal" aos PRODUCTS, respeitando o limite de 1000 resultados
// (usa paginação skip/take em todas as queries).

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

// facet de subcategoria (já vimos que é "sub_category")
const SUBCATEGORY_FACET_CODE = "sub_category";

// facet nova (code da facet "Categoria Principal")
const PRINCIPAL_FACET_CODE = "categoria-principal";

// Códigos da facet "categoria-principal" (já confirmados pelo teu log):
//   equip_mecanico
//   capacetes_karting
//   piloto

// Mapa: sub_category.code -> categoria-principal.code
const SUB_TO_PRINCIPAL = {
  // Équipement Mécanique
  pitline: "equip_mecanico",
  "accessoires-meca": "equip_mecanico",
  lubrifiants: "equip_mecanico",
  additifs: "equip_mecanico",
  opportunites: "equip_mecanico",
  merchandising: "equip_mecanico",
  "sim-racing": "equip_mecanico",

  // Casques de Karting
  fluids: "capacetes_karting",
  "soin-protection": "capacetes_karting",
  lifestyle: "capacetes_karting",
  "sacs-bagagerie": "capacetes_karting",
  sieges: "capacetes_karting",
  volants: "capacetes_karting",
  securite: "capacetes_karting",
  "electricite-electronique": "capacetes_karting",

  // Pilote
  "equipement-pilote-fia": "piloto",
  "bottines-fia": "piloto",
  "gants-fia": "piloto",
  "combinaisons-fia": "piloto",
  "casques-pilote": "piloto",
  "hans-protections-hybrides": "piloto",
  communication: "piloto",
  "vetements-karting": "piloto",
  "protections-pilote-karting": "piloto",
};

// --------------------------------------
// 5) Carregar todas as facetValues (com paginação, take <= 1000)
// --------------------------------------

async function loadAllFacetValues() {
  console.log("📥 A carregar facetValues...");
  const take = 500; // bem abaixo do limite 1000
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
              facet { code }
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
// 6) Carregar todos os PRODUCTS (com paginação, take <= 100)
// --------------------------------------

async function loadAllProducts() {
  console.log("📥 A carregar products...");
  const take = 100; // seguro, bem abaixo do limite
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
// 7) Mutação para atualizar produto (sem fragments)
// --------------------------------------

async function updateProductFacetValues(productId, facetValueIds) {
  const mutation = `
    mutation UpdateProduct($input: UpdateProductInput!) {
      updateProduct(input: $input) {
        id
      }
    }
  `;

  const data = await graphql(mutation, {
    input: {
      id: productId,
      facetValueIds,
    },
  });

  if (!data.updateProduct) {
    console.error(`⚠️ Erro a atualizar produto ${productId}: resposta vazia`);
  }
}

// --------------------------------------
// 8) MAIN
// --------------------------------------

async function main() {
  const facetValues = await loadAllFacetValues();

  // Mapa de facet principal (categoria-principal): code -> id
  const principalByCode = {};
  for (const fv of facetValues) {
    if (fv.facet.code === PRINCIPAL_FACET_CODE) {
      principalByCode[fv.code] = fv.id;
    }
  }

  console.log(
    "✅ Facets 'categoria-principal' disponíveis:",
    Object.keys(principalByCode)
  );

  const products = await loadAllProducts();
  let updatedCount = 0;

  for (const product of products) {
    const existingIds = product.facetValues.map((fv) => fv.id);

    // Todas as subcategories que o produto já tem
    const subCodes = product.facetValues
      .filter((fv) => fv.facet.code === SUBCATEGORY_FACET_CODE)
      .map((fv) => fv.code);

    const principalsToAdd = new Set();

    for (const subCode of subCodes) {
      const principalCode = SUB_TO_PRINCIPAL[subCode];
      if (!principalCode) continue;

      const principalId = principalByCode[principalCode];
      if (!principalId) {
        console.warn(
          `⚠️ Não encontrei facetValue 'categoria-principal' com code "${principalCode}"`
        );
        continue;
      }

      principalsToAdd.add(principalId);
    }

    if (principalsToAdd.size === 0) {
      continue; // nada para adicionar neste produto
    }

    const newFacetIds = Array.from(
      new Set([...existingIds, ...principalsToAdd])
    );

    if (newFacetIds.length === existingIds.length) {
      continue; // já tinha tudo
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
