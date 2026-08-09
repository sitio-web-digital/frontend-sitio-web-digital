import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { APP_HOSTNAME } from './utils/rootDomain.js'

// Mercado Pago rechaza el back_url de la suscripción en cualquier dominio
// .digital, sin excepción (ver server/src/routes/subscription.js) — por eso
// esa redirección post-pago sigue apuntando a un hostname .com viejo
// (sitiowebdigital.cloudfordeploy.com, mismo build servido igual por el
// túnel de Cloudflare, ver infraestructura/terraform/cloudflare.tf). El
// problema: es un origen DISTINTO al que usa la app día a día, así que no
// comparte localStorage/sesión con app.sitioweb.digital — quien vuelve de
// pagar puede terminar sin sesión ahí. Apenas el bundle carga en ESE
// hostname puntual, se salta solo al real preservando el resto de la URL
// (path/query/hash) — así la sesión real (la de app.sitioweb.digital, que
// es donde el usuario ya estaba logueado antes de ir a pagar) está
// disponible apenas aterriza, en vez de quedar en un origen vacío.
const MP_BOUNCE_HOSTNAME = 'sitiowebdigital.cloudfordeploy.com';
if (window.location.hostname === MP_BOUNCE_HOSTNAME) {
  window.location.replace(
    `https://${APP_HOSTNAME}${window.location.pathname}${window.location.search}${window.location.hash}`
  );
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
