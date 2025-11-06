import fs from 'fs';
import fetch from 'node-fetch';

const LANGS = ['pt','en','fr','es'];
const T = {
  'Piloto': { pt:'Piloto', en:'Driver', fr:'Pilote', es:'Piloto' },
  'Veículo': { pt:'Veículo', en:'Vehicle', fr:'Véhicule', es:'Vehículo' },
  'Lubrificantes e Fluidos': { pt:'Lubrificantes e Fluidos', en:'Lubricants & Fluids', fr:'Lubrifiants et Fluides', es:'Lubricantes y Fluidos' },
  'Pneus e Jantes': { pt:'Pneus e Jantes', en:'Tyres & Wheels', fr:'Pneus et Jantes', es:'Neumáticos y Llantas' },
  'Ferramentas e Oficina': { pt:'Ferramentas e Oficina', en:'Tools & Workshop', fr:'Outils & Atelier', es:'Herramientas y Taller' },
  'Peças de Competição e Performance': { pt:'Peças de Competição e Performance', en:'Motorsport & Performance Parts', fr:'Pièces Compétition & Performance', es:'Piezas Competición y Performance' },
  'Merchandising': { pt:'Merchandising', en:'Merchandising', fr:'Merchandising', es:'Merchandising' },
  'Oportunidades / Outlet': { pt:'Oportunidades / Outlet', en:'Outlet', fr:'Opportunités / Outlet', es:'Oportunidades / Outlet' },
  'Equipamento FIA': { pt:'Equipamento FIA', en:'FIA Gear', fr:'Équipement FIA', es:'Equipamiento FIA' },
  'Capacetes': { pt:'Capacetes', en:'Helmets', fr:'Casques', es:'Cascos' },
  'Hans & Proteções': { pt:'Hans & Proteções', en:'HANS & Protection', fr:'HANS & Protections', es:'HANS y Protecciones' },
  'Karting': { pt:'Karting', en:'Karting', fr:'Karting', es:'Karting' },
  'Travões': { pt:'Travões', en:'Brakes', fr:'Freins', es:'Frenos' },
  'Suspensão': { pt:'Suspensão', en:'Suspension', fr:'Suspension', es:'Suspensión' },
  'Motor & Transmissão': { pt:'Motor & Transmissão', en:'Engine & Drivetrain', fr:'Moteur & Transmission', es:'Motor y Transmisión' },
};

const ROOTS = [
  'Piloto',
  'Veículo',
  'Lubrificantes e Fluidos',
  'Pneus e Jantes',
  'Ferramentas e Oficina',
  'Peças de Competição e Performance',
  'Merchandising',
  'Oportunidades / Outlet',
];

const CHILDREN = {
  'Piloto': ['Equipamento FIA','Capacetes','Hans & Proteções','Karting'],
  'Peças de Competição e Performance': ['Travões','Suspensão','Motor & Transmissão'],
};

const BASE_URL = 'https://carsandvibes.duckdns.org/admin-api';

const slugify = s =>
  s.toLowerCase()
   .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
   .replace(/[^a-z0-9]+/g,'-')
   .replace(/(^-|-$)/g,'');

const Q_LOGIN = `
mutation Login($u:String!, $p:String!){
  login(username:$u, password:$p, rememberMe:true){
    __typename
    ... on CurrentUser { id identifier }
    ... on InvalidCredentialsError { message }
  }
}`;

const Q_COLLECTIONS = `
query GetCollections($options: CollectionListOptions){
  collections(options:$options){ items{ id name slug parent{ id } } totalItems }
}`;

const M_CREATE = () => `
mutation CreateCollection($input: CreateCollectionInput!){
  createCollection(input:$input){
    __typename
    ... on Collection { id name slug }
    
  }
}`;

const M_UPDATE = `
mutation UpdateCollection($input: UpdateCollectionInput!){
  updateCollection(input:$input){
    __typename
    ... on Collection { id name slug }
  }
}`;

// --- util: ler todas as Set-Cookie e convertê-las para header Cookie ---
function extractCookieHeader(res) {
  // node-fetch v3: headers.raw() expõe todas as Set-Cookie
  const raw = res.headers.raw()?.['set-cookie'] || [];
  // fica só com "nome=valor"
  const parts = raw.map(c => c.split(';')[0]).filter(Boolean);
  return parts.join('; ');
}

async function gql(query, variables={}, cookie='') {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type':'application/json', ...(cookie?{Cookie:cookie}:{}) },
    body: JSON.stringify({ query, variables }),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { throw new Error('Resposta inválida: '+text); }
  if (json.errors?.length) throw new Error(json.errors[0].message);
  const setCookie = extractCookieHeader(res);
  return { data: json.data, cookie: setCookie };
}

async function loginAndGetCookie() {
  console.log('🔐 A fazer login no Vendure...');
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ query: Q_LOGIN, variables: { u:'superadmin', p:'superadmin' } }),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { throw new Error('Resposta inválida: '+text); }
  if (json.errors?.length) throw new Error(json.errors[0].message);
  if (json.data?.login?.__typename !== 'CurrentUser') throw new Error('Falha no login');
  const cookieHeader = extractCookieHeader(res);
  if (!cookieHeader) throw new Error('Sem cookies de sessão');
  fs.writeFileSync('cookie.txt', cookieHeader + '\n');
  console.log('✅ Login OK. Cookie guardado em cookie.txt');
  return cookieHeader;
}

async function findCollectionBySlug(slug, cookie) {
  const { data } = await gql(Q_COLLECTIONS, { options:{ filter:{ slug:{ eq: slug } }, take:1 } }, cookie);
  return data.collections.items[0] || null;
}

function translationsForKey(key){
  return LANGS.map(lc => ({
    languageCode: lc,
    name: T[key]?.[lc] ?? key,
    description: T[key]?.[lc] ?? key,
    slug: slugify(T[key]?.[lc] ?? key),
  }));
}

async function ensureCollection(key, parentId, cookie){
  const trans = translationsForKey(key);
  const slug = trans[0].slug;
  const exist = await findCollectionBySlug(slug, cookie);

  if (exist) {
    const input = {
      id: exist.id,
      translations: trans.map(t => ({
        languageCode: t.languageCode, name: t.name, description: t.description, slug: t.slug,
      })),
    };
    await gql(M_UPDATE, { input }, cookie);
    return exist.id;
  } else {
    const input = {
      isPrivate: false,
      inheritFilters: false,
      parentId: parentId ?? null,
      filters: [], // requerido
      translations: trans.map(t => ({
        languageCode: t.languageCode, name: t.name, description: t.description, slug: t.slug,
      })),
    };
    const { data } = await gql(M_CREATE(), { input }, cookie);
    if (data.createCollection.__typename !== 'Collection') throw new Error('Falha ao criar: '+key);
    return data.createCollection.id;
  }
}

async function main(){
  try {
    const cookie = await loginAndGetCookie();

    console.log('\n🚀 A criar categorias raiz…');
    const rootIds = {};
    for (const root of ROOTS) {
      try {
        rootIds[root] = await ensureCollection(root, null, cookie);
        console.log(`  • OK: ${root}`);
      } catch (e) {
        console.log(`  • ERRO ${root}: ${e.message}`);
      }
    }

    console.log('\n🌿 A criar subcategorias…');
    for (const [parent, kids] of Object.entries(CHILDREN)) {
      const pid = rootIds[parent];
      if (!pid) continue;
      for (const k of kids) {
        try {
          await ensureCollection(k, pid, cookie);
          console.log(`  └─ OK: ${parent} › ${k}`);
        } catch (e) {
          console.log(`  └─ ERRO ${parent} › ${k}: ${e.message}`);
        }
      }
    }

    console.log('\n✅ Terminado!');
    console.log(`Reindex: curl -s ${BASE_URL} -b cookie.txt -H 'Content-Type: application/json' --data '{"query":"mutation { reindex { id state progress } }"}' | jq`);
  } catch (e) {
    console.error('❌ Falhou:', e.message);
    process.exit(1);
  }
}

main();
