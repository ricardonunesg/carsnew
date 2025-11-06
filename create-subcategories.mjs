// /root/carsandvibes/create-subcategories.mjs
// Node v20+ (fetch nativo)

const endpoint = process.env.ADMIN_API_URL ?? 'http://127.0.0.1:3000/admin-api';
const username = process.env.VENDURE_USER ?? 'superadmin';
const password = process.env.VENDURE_PASS ?? 'superadmin';

// 1) mutation de login (Admin API)
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

// 2) mutation para criar Collection
const CREATE_COLLECTION_MUTATION = `
  mutation createCollection($input: CreateCollectionInput!) {
    createCollection(input: $input) {
      id
      slug
      name
      parent { id }
    }
  }
`;

// util: POST GraphQL
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

async function run() {
  console.log('A autenticar em', endpoint);

  // A) Login
  const { res: loginRes, json: loginJson } = await postGraphQL(
    LOGIN_MUTATION,
    { u: username, p: password, remember: true }
  );

  const setCookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [];
  const cookieHeader = setCookies.length ? setCookies.map(c => c.split(';')[0]).join('; ') : '';

  if (loginJson.errors?.length) {
    console.error('Erros GraphQL no login:', JSON.stringify(loginJson.errors, null, 2));
    process.exit(1);
  }
  const t = loginJson.data?.login?.__typename;
  if (t !== 'CurrentUser') {
    console.error('Login falhou:', JSON.stringify(loginJson.data?.login, null, 2));
    process.exit(1);
  }
  if (!cookieHeader) {
    console.error('Não foi possível obter cookie de sessão do header Set-Cookie.');
    process.exit(1);
  }
  console.log('Login OK como', loginJson.data.login.identifier);

  // B) Criar sub-coleção
  const variables = {
    input: {
      parentId: "1",
      filters: [],
      translations: [
        {
          languageCode: "pt_PT",
          name: "Subcategoria Exemplo",
          slug: "subcategoria-exemplo",
          description: "Descrição da Subcategoria Exemplo"
        }
      ]
      // inheritFilters: true, // opcional
    }
  };

  console.log('A criar coleção...');
  const { json } = await postGraphQL(
    CREATE_COLLECTION_MUTATION,
    variables,
    { Cookie: cookieHeader }
  );

  if (json.errors?.length) {
    console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2));
    process.exit(1);
  }

  console.log('Coleção criada com sucesso:');
  console.log(json.data.createCollection);
}

run().catch((err) => {
  console.error('Erro ao executar script:', err);
  process.exit(1);
});
