# Mantenimiento Vehículos – Starter (Vercel + Neon + Blob)

- Postgres (Neon) via Prisma
- Blob (Vercel) para firmas y PDFs
- PDFKit para informe final
- UI simple con roles y flujo completo

## Variables de entorno
- `DATABASE_URL` (Neon **pooled**, con `?sslmode=require`).

## Primer uso (local)
```
npm i
npx prisma migrate dev --name init-pg
npm run dev
```
