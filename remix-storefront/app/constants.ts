// app/constants.ts

// Metadados da loja
export const APP_META_TITLE =
  'Cars & Vibes — Performance Parts & Lifestyle';
export const APP_META_DESCRIPTION =
  'Loja oficial Cars & Vibes: performance, lifestyle e equipamento piloto.';

// URL base por defeito para a API do Vendure (teu backend, NÃO o demo)
export const DEFAULT_API_URL = 'https://carsandvibes.duckdns.org/shop-api';

// Mantemos o nome DEMO_API_URL por compatibilidade, mas agora já é o teu servidor
export const DEMO_API_URL = DEFAULT_API_URL;

// URL que o resto da app usa para chamar o backend
// Se existir VENDURE_API_URL no ambiente, usa essa.
// Caso contrário, usa sempre o teu backend, NUNCA o demo.
export const API_URL =
  typeof process !== 'undefined' && process.env.VENDURE_API_URL
    ? process.env.VENDURE_API_URL
    : DEFAULT_API_URL;
