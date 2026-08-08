// Dominio raíz bajo el que viven los subdominios de clientes
// (<subdominio>.ROOT_DOMAIN) — configurable por VITE_ROOT_DOMAIN. Un solo
// lugar para no tener que tocar cada pantalla que muestra el sufijo.
export const ROOT_DOMAIN = import.meta.env.VITE_ROOT_DOMAIN || 'sitioweb.digital';

// Hostname donde vive la app en sí (home, login, dashboard...) — un
// subdominio fijo (app.sitioweb.digital), NO el apex: el apex y "www" del
// dominio real siguen sirviendo el sitio de siempre (el que ya tenían en
// DonWeb antes de migrar el DNS), así que la app necesita su propio
// hostname para no pisarlo ni confundirse con un subdominio de cliente más
// (ver App.jsx > detectPublicSubdomain). Mismo criterio que el certificado
// gratis de Cloudflare: solo cubre un nivel de wildcard, así que los
// subdominios de cliente viven directo bajo la zona (*.sitioweb.digital).
export const APP_HOSTNAME = import.meta.env.VITE_APP_HOSTNAME || `app.${ROOT_DOMAIN}`;
