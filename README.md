# slip

Digital tipping and payment web app with QR-driven flows, auth, admin tooling, and mobile packaging via Capacitor.

## What it does
- Generates and serves QR-based tipping entry points.
- Handles authenticated user and dashboard experiences.
- Includes admin/apply/legal flows and API routes for operational tasks.
- Supports push notifications, biometric auth, and mobile builds through Capacitor plugins.

## Stack
- Next.js 15 + React + TypeScript
- Prisma + relational database workflows
- Redis (`ioredis`) for fast state/session operations
- Capacitor (Android/mobile wrapper), Sentry, AWS S3 SDK

## Local development
```bash
npm install
npm run db:generate
npm run dev
```

Database commands:
```bash
npm run db:push
npm run db:migrate
npm run db:seed
```

## Repository structure
- `src/app/` route groups (`dashboard`, `tip`, `qr`, `admin`, `auth`)
- `prisma/` schema and seed scripts
- `scripts/` utilities (including QR generation)
- `android/` Capacitor Android project

## Practical next improvements
- Add end-to-end tests for tip payment and redemption flows.
- Add rate-limit instrumentation for public QR endpoints.
- Add release checklist for web + Android builds.
