// /root/carsandvibes/create-collection-cli.mjs
// Node v20+ (fetch nativo)

const endpoint = process.env.ADMIN_API_URL ?? 'http://127.0.0.1:3000/admin-api';
const username = process.env.VENDURE_USER ?? 'superadmin';
const password = process.env.VENDURE_PASS ?? 'superadmin';

/* ====================== Helpers ====================== */

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    let arg = argv[i];
    if (!arg.startsWith('--')) continue;
    arg = arg.slice(2);
    let key, value;
    if (arg.includes('=')) {
      [key, value] = arg.split('=');
    } else {
      key = arg;
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { value = next; i++; }
      else { value = 'true'; }
    }
    out[key] = value;
  }
  return out;
}

function requireArg(obj, key, help) {
  if (!obj[key]) {
    console.error(`Falta --${key}\n\n${help}`);
    process.exit(1);
  }
}

async function postGraphQL(query, variables, headers = {}) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ query, variables }),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch {
    throw new Error(`Resposta não-JSON do endpoint ${endpoint}.\nCorpo:\n${text}`);
  }
  return { res, json };
}

function extractCookieHeader(resp) {
  const getSetCookie = resp.headers.getSetCookie?.() ?? [];
  if (getSetCookie.length) {
    return getSetCookie.map(c => c.split(';')[0]).join('; ');
  }
  const sc = resp.headers.get('set-cookie');
  if (sc) {
    return sc.split(',').map(p => p.split(';')[0]).join('; ');
  }
  return '';
}

/* ====================== GraphQL ====================== */

// Login
const LOGIN_MUTATION = `
  mutation ($u:String!, $p:String!, $remember:Boolean!) {
    login(username:$u, password:$p, rememberMe:$remember) {
      __typename
      ... on CurrentUser { id identifier }
      ... on InvalidCredentialsError { errorCode message }
      ... on NativeAuthStrategyError { errorCode message }
    }
  }
`;

// Procurar coleção por slug (idempotência)
const FIND_COLLECTION_BY_SLUG = `
  query ($slug: String!) {
    collections(options: { filter: { slug: { eq: $slug } }, take: 1 }) {
      totalItems
      items { id slug name parent { id } }
    }
  }
`;

// Criar coleção
const CREATE_COLLECTION_MUTATION = `
  mutation ($input: CreateCollectionInput!) {
    createCollection(input: $input) {
      id
      slug
      name
      parent { id }
    }
  }
`;

// Disparar reindex
const REINDEX_MUTATION = `
  mutation { reindex { id } }
`;

/* ====================== Main ====================== */

const help = `
Uso:
  node create-collection-cli.mjs --parentId <ID> --name "<Nome>" --slug "<slug>" [opções]

Opções:
  --parentId <ID>           ID da coleção pai (obrigatório)
  --name "<Nome>"           Nome da sub-coleção (obrigatório)
  --slug "<slug>"           Slug único (obrigatório)
  --lang <código>           Código de língua (default: pt_PT)
  --desc "<texto>"          Descrição (default: "Descrição de <Nome>")
  --inheritFilters <bool>   true/false (default: false)
  --ensure <bool>           Idempotente: não cria se slug já existir (default: true)
  --reindex <bool>          Disparar reindex após criar (default: false)

Exemplos:
  node create-collection-cli.mjs --parentId 1 --name "Filtros" --slug "filtros"
  node create-collection-cli.mjs --parentId 1 --name "Escapes" --slug "escapes" --lang pt_PT --desc "Peças de escape"
  node create-collection-cli.mjs --parentId 1 --name "Travagem" --slug "travagem" --inheritFilters true --reindex true
`.trim();

(async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    console.log(help);
    process.exit(0);
  }

  requireArg(args, 'parentId', help);
  requireArg(args, 'name', help);
  requireArg(args, 'slug', help);

  const lang = args.lang ?? 'pt_PT';
  const desc = args.desc ?? `Descrição de ${args.name}`;
  const inheritFilters = /^true$/i.test(String(args.inheritFilters ?? 'false'));
  const ensure = args.ensure === undefined ? true : /^true$/i.test(String(args.ensure));
  const doReindex = /^true$/i.test(String(args.reindex ?? 'false'));

  console.log('A autenticar em', endpoint);
  const { res: loginRes, json: loginJson } = await postGraphQL(
    LOGIN_MUTATION,
    { u: username, p: password, remember: true }
  );

  if (loginJson.errors?.length) {
    console.error('Erros GraphQL no login:', JSON.stringify(loginJson.errors, null, 2));
    process.exit(1);
  }
  if (loginJson.data?.login?.__typename !== 'CurrentUser') {
    console.error('Login falhou:', JSON.stringify(loginJson.data?.login, null, 2));
    process.exit(1);
  }
  const cookieHeader = extractCookieHeader(loginRes);
  if (!cookieHeader) {
    console.error('Não foi possível obter cookie de sessão.');
    process.exit(1);
  }
  console.log('Login OK como', loginJson.data.login.identifier);

  // Idempotente: verificar se já existe por slug
  if (ensure) {
    console.log(`A verificar existência de slug "${args.slug}"...`);
    const { json: findJson } = await postGraphQL(
      FIND_COLLECTION_BY_SLUG,
      { slug: args.slug },
      { Cookie: cookieHeader }
    );
    if (findJson.errors?.length) {
      console.error('Erro ao procurar coleção:', JSON.stringify(findJson.errors, null, 2));
      process.exit(1);
    }
    const existing = findJson.data?.collections?.items?.[0];
    if (existing) {
      console.log('Já existe. A devolver coleção existente:');
      console.log(existing);
      if (doReindex) {
        console.log('A disparar reindex...');
        const { json: reJson } = await postGraphQL(REINDEX_MUTATION, {}, { Cookie: cookieHeader });
        if (reJson.errors?.length) {
          console.error('Erro no reindex:', JSON.stringify(reJson.errors, null, 2));
          process.exit(1);
        }
        console.log('Reindex job id:', reJson.data.reindex.id);
      }
      process.exit(0);
    }
  }

  // Criar
  const input = {
    parentId: String(args.parentId),
    filters: [],
    translations: [
      { languageCode: lang, name: args.name, slug: args.slug, description: desc }
    ],
    ...(inheritFilters ? { inheritFilters: true } : {})
  };

  console.log('A criar coleção...');
  const { json: createJson } = await postGraphQL(
    CREATE_COLLECTION_MUTATION,
    { input },
    { Cookie: cookieHeader }
  );

  if (createJson.errors?.length) {
    console.error('GraphQL errors:', JSON.stringify(createJson.errors, null, 2));
    process.exit(1);
  }
  const created = createJson.data?.createCollection;
  console.log('Coleção criada com sucesso:');
  console.log(created);

  if (doReindex) {
    console.log('A disparar reindex...');
    const { json: reJson } = await postGraphQL(REINDEX_MUTATION, {}, { Cookie: cookieHeader });
    if (reJson.errors?.length) {
      console.error('Erro no reindex:', JSON.stringify(reJson.errors, null, 2));
      process.exit(1);
    }
    console.log('Reindex job id:', reJson.data.reindex.id);
  }
})().catch((err) => {
  console.error('Erro ao executar script:', err);
  process.exit(1);
});
