# Trading Dashboard

A Next.js trading dashboard with email verification via Resend.

## Features

- User registration with email verification
- Login (test accounts can bypass verification)
- Protected dashboard with charts and trade history
- Deployed on Vercel

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

Required vars:
- `JWT_SECRET`: a strong random string
- `RESEND_API_KEY`: from Resend dashboard
- `RESEND_VERIFY_URL`: your production verify endpoint (e.g., https://your-app.vercel.app/api/auth/verify)
- `DATABASE_URL`: SQLite file (for dev) or Postgres URL (for production)

### 3. Initialize Database

```bash
npm run db:push
```

Optional: seed test user
```bash
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

### 5. Deploy to Vercel

```bash
vercel --prod
```

Make sure to set environment variables in Vercel dashboard.

## Test Accounts

- **Email**: `admin@test.com` / `password123`
- **Email**: `trader@test.com` / `trader123`

These bypass email verification.

## Create Additional Test Users

To create a new test user (with verified status), run:

```bash
npx tsx scripts/create-test-user.ts <email> <password>
```

Example:
```bash
npx tsx scripts/create-test-user.ts user1@test.com MyPassword123
```

## Project Structure

- `/src/app` – Next.js App Router pages and API routes
- `/src/components` – React components
- `/src/lib` – utilities (db, auth, mail)
- `/prisma` – database schema

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM (SQLite dev, Postgres prod)
- JWT authentication
- Resend (email verification)
