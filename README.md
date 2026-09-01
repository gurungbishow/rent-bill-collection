# Rent Bill Collection & Room Management System

A full-stack application built for managing monthly rent and utility bills for properties with multiple rooms. It enforces strict financial correctness by deriving all totals and balances dynamically based on historical billing snapshots and immutable payment records.

## Tech Stack

- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Framer Motion
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL (Neon)

## Local Development

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

Create `.env` inside the `backend` directory:
```env
DATABASE_URL="postgresql://user:password@hostname:5432/dbname?schema=public"
JWT_SECRET="your_super_secret_jwt_key"
PORT=5000
FRONTEND_URL="http://localhost:3000"
```

Create `.env.local` inside the `frontend` directory:
```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
```

### 3. Database Setup

```bash
cd backend
# Push the schema to your Neon DB
npx prisma db push

# Seed the database (Creates Admin and 5 Rooms)
npx ts-node prisma/seed.ts
```

### 4. Start the Application

Start Backend (from `/backend`):
```bash
npm run dev
```

Start Frontend (from `/frontend`):
```bash
npm run dev
```

Admin login credentials (from seed):
- Email: `admin@example.com`
- Password: `admin123`

---

## Production Deployment (Free Tier)

### Database: Neon PostgreSQL
1. Create a project at [Neon.tech](https://neon.tech/).
2. Create a new PostgreSQL database.
3. Copy the standard connection string into your `DATABASE_URL` for the backend.
4. Run `npx prisma db push` and `npx ts-node prisma/seed.ts` locally connected to your Neon string to initialize the schema.

### Backend: Render
1. Connect your GitHub repository to Render and create a **Web Service**.
2. Root Directory: `backend`
3. Build Command: `npm install && npx prisma generate && npx tsc`
4. Start Command: `node dist/app.js`
5. Configure Environment Variables:
   - `DATABASE_URL` (From Neon)
   - `JWT_SECRET` (Secure string)
   - `PORT` (Usually 10000 or let Render inject it)
   - `FRONTEND_URL` (Your Vercel URL, e.g., `https://my-rent-app.vercel.app`)

*Note: The backend tolerates Render's free-tier spin down since Prisma handles reconnection automatically.*

### Frontend: Vercel
1. Connect your GitHub repository to Vercel.
2. Framework Preset: Next.js
3. Root Directory: `frontend`
4. Configure Environment Variables:
   - `NEXT_PUBLIC_API_URL`: Your Render backend URL (e.g., `https://rent-backend.onrender.com/api`)
5. Deploy.

---

## Financial Architecture Rules

This application does not rely on easily-editable financial fields to maintain state. Instead, it computes values on-the-fly or at snapshot time:
- **Monthly Bill Totals:** Snapshots of room rates (rent, utilities) combined with dynamic calculation of `(Present Unit - Prev Unit) * Rate`.
- **Payment History:** The `Remaining Balance` is calculated by subtracting `SUM(payments.amount)` from `MonthlyBill.grand_total`.
- **Status:** If sum == 0 (UNPAID). If 0 < sum < grand_total (PARTIAL). If sum >= grand_total (PAID).
- **Previous Balance:** Carries over the strictly calculated remaining balance from the previous month.
