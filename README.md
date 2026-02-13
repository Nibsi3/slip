# TipSA - Digital Tipping for South Africa

Cashless tipping platform. Customers scan a QR code, tap an amount, pay via PayFast. Workers receive tips to their digital wallet.

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (or use Neon.tech / Supabase free tier)

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
Create a `.env` file in the project root:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/tipping"
JWT_SECRET="your-secret-key-minimum-32-characters-long"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# PayFast (sandbox defaults are built-in)
PAYFAST_MERCHANT_ID="10000100"
PAYFAST_MERCHANT_KEY="46f0cd694581a"
PAYFAST_PASSPHRASE="jt7NOE43FZPn"
PAYFAST_SANDBOX="true"
```

### 3. Set up database
```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

### 4. Run the dev server
```bash
npm run dev
```

### 5. Open the app
- Landing page: http://localhost:3000
- Tip page (demo): http://localhost:3000/tip/demo-thabo-molefe
- Worker dashboard: http://localhost:3000/dashboard
- Admin dashboard: http://localhost:3000/admin

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tipsa.co.za | admin123 |
| Worker | thabo@example.com | worker123 |
| Worker | naledi@example.com | worker123 |

## End-to-End Flow

1. **Worker registers** → gets unique QR code
2. **Customer scans QR** → opens tip page in browser (no app needed)
3. **Customer selects amount** → R10, R20, R50, R100, R200 or custom
4. **PayFast payment** → secure checkout via PayFast
5. **ITN webhook** → backend credits worker wallet automatically
6. **Worker withdraws** → via Instant Money or EFT

## Tech Stack

- **Frontend**: Next.js 14 + TailwindCSS
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT (jose) + httpOnly cookies
- **Payments**: PayFast (sandbox for dev)
- **QR Codes**: qrcode library

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── tip/[code]/           # Customer tip page (public)
│   ├── auth/                 # Login & Register
│   ├── dashboard/            # Worker dashboard
│   ├── admin/                # Admin dashboard
│   └── api/                  # API routes
│       ├── auth/             # Auth endpoints
│       ├── tips/             # Tip creation & lookup
│       ├── payfast/          # PayFast ITN webhook
│       ├── workers/          # Worker profile & withdrawals
│       └── admin/            # Admin stats & management
├── lib/
│   ├── db.ts                 # Prisma client
│   ├── auth.ts               # JWT & session management
│   ├── payfast.ts            # PayFast integration
│   └── utils.ts              # Helpers & constants
└── middleware.ts              # Route protection
```

## Fees

- **Platform fee**: 5% of tip amount
- **Gateway fee**: ~3.5% + R2.00 (PayFast)
- **Instant Money withdrawal**: R5.00 flat fee
- **EFT withdrawal**: Free

## Deployment

Deploy to Vercel (free tier):
```bash
npm run build
```

Set environment variables in Vercel dashboard and connect your PostgreSQL database.
