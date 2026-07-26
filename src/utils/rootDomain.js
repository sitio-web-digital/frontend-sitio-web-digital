// Dominio raíz bajo el que viven los subdominios de clientes
// (<subdominio>.ROOT_DOMAIN) — configurable por VITE_ROOT_DOMAIN mientras el
// deploy de prueba use un dominio temporario en vez del real
// (sitiowebdigital.com.ar). Un solo lugar para no tener que tocar cada
// pantalla que muestra el sufijo cuando cambie.
export const ROOT_DOMAIN = import.meta.env.VITE_ROOT_DOMAIN || 'sitiowebdigital.com.ar';

// Hostname donde vive la app en sí (home, login, dashboard...), distinto de
// ROOT_DOMAIN SOLO durante las pruebas: el dominio de prueba
// (cloudfordeploy.com) es una zona compartida con otros proyectos, así que
// los subdominios de cliente viven directo bajo ella (*.cloudfordeploy.com,
// el único nivel de wildcard que cubre el certificado gratis de Cloudflare)
// y la app necesita un hostname propio y fijo para no confundirse con un
// subdominio de cliente más. Con el dominio real, ROOT_DOMAIN y APP_HOSTNAME
// vuelven a ser lo mismo (la app vive en el apex, como siempre fue).
export const APP_HOSTNAME = import.meta.env.VITE_APP_HOSTNAME || ROOT_DOMAIN;
