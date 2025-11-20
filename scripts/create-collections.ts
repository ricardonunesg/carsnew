import { bootstrap, LanguageCode, AdminClient } from '@vendure/core';
import { config } from '../src/vendure-config';

/**
 * Árvore de coleções
 */
const categories = [
  {
    code: 'equipement-mecanique',
    name: 'Équipement Mécanique',
    children: [
      { code: 'pitline', name: 'Pitline' },
      { code: 'accessoires', name: 'Accessoires' },
      { code: 'lubrifiants', name: 'Lubrifiants' },
      { code: 'additifs', name: 'Additifs' },
      { code: 'opportunites', name: 'Opportunités' },
      { code: 'merchandising', name: 'Merchandising' },
      { code: 'sim-racing', name: 'Sim Racing' },
    ],
  },
  {
    code: 'casques-karting',
    name: 'Casques de Karting',
    children: [
      { code: 'fluids', name: 'Fluids' },
      { code: 'soin-et-protection', name: 'Soin et Protection' },
      { code: 'lifestyle', name: 'Lifestyle' },
      { code: 'sacs-bagagerie', name: 'Sacs & Bagagerie' },
      { code: 'sieges', name: 'Sièges' },
      { code: 'volants', name: 'Volants' },
      { code: 'securite', name: 'Sécurité' },
      { code: 'electricite-electronique', name: 'Électricité & Électronique' },
    ],
  },
  {
    code: 'pilote',
    name: 'Pilote',
    children: [
      { code: 'equipement-pilote-fia', name: 'Équipement Pilote FIA' },
      { code: 'bottines-fia', name: 'Bottines FIA' },
      { code: 'gants-fia', name: 'Gants FIA' },
      { code: 'combinaisons-fia', name: 'Combinaisons FIA' },
      { code: 'casques-de-pilote', name: 'Casques de Pilote' },
      { code: 'hans-protections-hybrides', name: 'Hans & Protections hybrides' },
      { code: 'communication', name: 'Communication' },
      { code: 'vetements-karting', name: 'Vêtements de Karting' },
      { code: 'protections-pilote-karting', name: 'Protections pilote Karting' },
    ],
  },
];

/**
 * Cria uma collection
 */
async function createCollection(client: AdminClient, parentId: string | undefined, code: string, name: string) {
  console.log(`➡ Creating: ${name} (${code})`);

  const result = await client.mutation(
    `
    mutation CreateCollection($input: CreateCollectionInput!) {
      createCollection(input: $input) {
        id
        name
        code
      }
    }
    `,
    {
      input: {
        code,
        parentId,
        inheritFilters: false,
        isPrivate: false,
        filters: [],
        translations: [
          {
            languageCode: LanguageCode.fr,
            name,
          },
        ],
      },
    }
  );

  return result.createCollection.id;
}

/**
 * MAIN
 */
(async () => {
  const app = await bootstrap(config);

  // AdminClient vem do Vendure Core
  const client = app.get(AdminClient);

  await client.authenticate({
    username: 'superadmin',
    password: 'superadmin',
  });

  for (const root of categories) {
    const rootId = await createCollection(client, undefined, root.code, root.name);

    for (const child of root.children) {
      await createCollection(client, rootId, child.code, child.name);
    }
  }

  console.log('✅ TODAS as collections foram criadas com sucesso!');
  process.exit(0);
})();
