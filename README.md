# SitioWeb Digital — Frontend

Plataforma donde emprendedores crean su propia página web por subdominio:
eligen una plantilla, la editan con preview en vivo, y publican. El backend
real vive en [`backend-sitio-web-digital`](https://github.com/sitio-web-digital/backend-sitio-web-digital)
(Node/Express + Postgres) — este repo es solo el frontend (React + Vite).

El deploy a producción (self-hosted runner + Docker + Cloudflare Tunnel) lo
administra el repo aparte [`infraestructura-sitio-web-digital-`](https://github.com/sitio-web-digital/infraestructura-sitio-web-digital-)
(Terraform + Ansible) — ver ese repo para levantar o reconfigurar el
servidor.

## Correr el proyecto

```bash
npm install
npm run dev
```

Necesita el backend corriendo en paralelo (ver el README de
`backend-sitio-web-digital`) para el login, el editor guardando de verdad,
y el resto de las páginas que ya no son solo mock.

## Flujo

1. **Landing** (`/`) — propuesta de valor y ejemplos reales.
2. **Quiz** (`/quiz`) — 4 preguntas para recomendar una plantilla.
3. **Galería** (`/plantillas`) — plantilla recomendada + alternativas.
4. **Editor** (`/editor`) — edición guiada con preview en vivo.
5. **Preview del subdominio** (`/preview`) — vista final antes de publicar.
6. **Checkout** (`/checkout`) — suscripción simulada estilo Mercado Pago.
7. **Éxito / panel** (`/exito`) — confirmación y accesos rápidos.
8. **Estadísticas** (`/estadisticas`) — KPIs y gráficos de ejemplo.

## Stack

React + Vite, Tailwind CSS v4, React Router, Recharts.
