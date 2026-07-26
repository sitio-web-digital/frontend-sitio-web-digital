// Dominio raíz bajo el que viven los subdominios de clientes
// (<subdominio>.ROOT_DOMAIN) — configurable por VITE_ROOT_DOMAIN mientras el
// deploy de prueba use un dominio temporario en vez del real
// (sitiowebdigital.com.ar). Un solo lugar para no tener que tocar cada
// pantalla que muestra el sufijo cuando cambie.
export const ROOT_DOMAIN = import.meta.env.VITE_ROOT_DOMAIN || 'sitiowebdigital.com.ar';
