# SitioWeb Digital — Prototipo visual

Prototipo clickeable de punta a punta (solo frontend, sin backend ni base de
datos) que simula el flujo completo de una plataforma donde emprendedores
crean su propia página web por subdominio. Pensado para validar la
experiencia antes de construir la versión real.

Todo el estado vive en memoria (React Context) y se pierde al refrescar.
El pago, el registro del subdominio y el hosting están simulados — buscá el
comentario `// MOCK:` en [src/pages/Checkout.jsx](src/pages/Checkout.jsx).

## Correr el proyecto

```bash
npm install
npm run dev
```

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
