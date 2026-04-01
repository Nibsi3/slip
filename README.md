# slip-a-tip

<!-- color-strip -->
![build](https://img.shields.io/badge/build-passing-22c55e) ![coverage](https://img.shields.io/badge/coverage-growing-06b6d4) ![focus](https://img.shields.io/badge/focus-product%20quality-a855f7)


![status](https://img.shields.io/badge/status-active-16a34a)
![stack](https://img.shields.io/badge/stack-next.js%20%7C%20prisma%20%7C%20capacitor-111827)
![type](https://img.shields.io/badge/type-fintech-0ea5e9)

![slip-a-tip preview](public/qr-slipatip.png)

QR-based tipping platform for service teams, with fast payment entry, account management, and mobile-ready delivery.

## Snapshot
- **Core value:** let users tip in seconds from scan to checkout.
- **Architecture:** Next.js web app + Prisma data model + Redis-backed fast operations.
- **Delivery model:** shared codebase with web and Android packaging via Capacitor.

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
