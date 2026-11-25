# GETBUY

A production-oriented Nigerian e-commerce platform built with Next.js, Prisma, and TypeScript.

## Phase 1 status

The foundation includes Next.js App Router, Tailwind CSS, Prisma, Zod, Zustand, Framer Motion, Lucide icons, authentication dependencies, environment configuration, and the normalized database schema.

## Local setup

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:push
npm run dev
```

Open http://localhost:3000.

## Database commands

- `npm run db:generate` - generate Prisma Client
- `npm run db:migrate` - create and apply a migration
- `npm run db:push` - synchronize the SQLite schema
- `npm run db:seed` - seed the database (available after the seed script is implemented)
- `npm run db:studio` - open Prisma Studio

## Admin catalogue

Sign in with the administrator account configured through `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`, then open `/admin`. Product prices and delivery fees are entered in whole naira and stored as integer kobo. Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` to upload product images; existing HTTPS Unsplash URLs remain supported. Payment and image-storage secrets must remain in environment variables and are not editable in the admin settings.

## Production deployment

The current Prisma schema uses SQLite for local development and is not ready to deploy to Vercel with PostgreSQL. Do not replace `DATABASE_URL` with a PostgreSQL URL until the Prisma schema, adapter, and migrations have been migrated together. Provision a managed PostgreSQL database before that migration so local development and deployment can both be validated. Configure the Monnify and Cloudinary environment variables in the deployment platform; do not commit their values.

## Quality commands

- `npm run lint`
- `npm test` - run payment-security unit tests and Monnify webhook integration tests against an isolated temporary SQLite database
- `npm run build`
