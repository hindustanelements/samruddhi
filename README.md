# Samruddhi - From Farm to Kitchen

Full-stack organic pantry and traditional clay cookware store.

## Stack

- Next.js + React + Tailwind CSS
- Node.js + Express API
- PostgreSQL + Prisma
- JWT authentication

## Run Locally

1. Copy `backend/.env.example` to `backend/.env` and set your PostgreSQL `DATABASE_URL`.
2. Copy `frontend/.env.example` to `frontend/.env.local`.
3. Run `npm install`, then `npm run install:all` from the project root.
4. Run `npm run db:push --prefix backend`.
5. Run `npm run db:seed --prefix backend`.
6. Run `npm run dev`.

Storefront: `http://localhost:3000`
API: `http://localhost:5000/api`

Seed admin: `venukoyyana908@gmail.com` / `Admin@123`

## Environment

`backend/.env`

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
PORT=5000
CLIENT_URL="http://localhost:3000"
```

`frontend/.env.local`

```env
API_PROXY_TARGET="http://localhost:5000"
```

## Production Deployments

The backend starts with `prisma migrate deploy`. The migration files in `backend/prisma/migrations` must be committed and included in the deployment image. The `20260910000000_add_order_state` migration adds the `Order.state` column required by the orders and cash-on-delivery endpoints.

Use `prisma migrate deploy` in production. Do not run `prisma db push`, `prisma migrate reset`, or the seed command against the production database: those workflows can change or replace schema/data unexpectedly.

Keep these two storage locations persistent across releases:

- PostgreSQL: use a managed database or persistent database volume.
- Product and admin uploads: mount a persistent disk and set `UPLOADS_DIR` to its mount path, for example `/data/samruddhi/uploads`.

The database stores image URLs such as `/uploads/product-image.png`; it does not contain the uploaded file after image storage migration. Back up the upload directory together with the database before deploying changes.

### Mobile Admin Order Alerts

Set these environment variables in Coolify. Keep the private key secret and do not commit it:

```env
VAPID_PUBLIC_KEY="your-generated-public-key"
VAPID_PRIVATE_KEY="your-generated-private-key"
VAPID_SUBJECT="mailto:hindustanelements98@gmail.com"
```

Generate a key pair locally with:

```bash
cd backend
node -e "const webpush = require('web-push'); console.log(webpush.generateVAPIDKeys())"
```

After deployment, log in as admin on mobile Chrome and click `Test Order Alarm` once. Allow notifications when Chrome asks. This registers that phone for notifications. New orders then send a notification even when Chrome is closed, subject to the phone's notification and battery settings.
