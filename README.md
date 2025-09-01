# Mantenimiento Vehículos – Starter (Vercel + Neon + Blob)

Este proyecto está listo para desplegar en **Vercel** con **Neon (Postgres)** y **Vercel Blob**.
Incluye flujo completo (solicitud → taller → coordinación → reparación → entrega → PDF) y un UI sencillo.

## Variables de entorno
- `DATABASE_URL`: cadena de conexión **Neon (pooled)** con SSL (`?sslmode=require`).

## Primer uso
1. Ejecuta `npm i` (local) y configura `DATABASE_URL`.
2. `npm run build` crea las tablas (migrate deploy) y compila.
3. Arranca `npm run dev`.

## Producción (Vercel)
- Vercel ejecuta `postinstall` → `prisma generate` y `build` → `prisma migrate deploy && next build`.
- Conecta un **Blob Store** en Vercel para guardar firmas y PDFs.
