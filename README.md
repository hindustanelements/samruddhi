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

If the frontend reports `Request failed: /admin/coupons (404)` or `Request failed: /admin/delivery-settings (404)`, restart the backend so it loads the current API routes:

1. Stop the running backend in its terminal with `Ctrl+C`.
2. From the project root, run `npm run dev --prefix backend`.
3. Reload the admin page. The frontend should continue proxying API requests to `http://localhost:5000`.

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

When API routes are added or changed, deploy the backend as well as the frontend. Updating only the frontend leaves the old API running and causes these endpoints to return 404.

- With the root `Dockerfile` (combined frontend/backend image), rebuild and redeploy the whole application image.
- With separate services, rebuild/redeploy the backend from `backend/Dockerfile` and the frontend from `frontend/Dockerfile`. Configure the frontend build argument `API_PROXY_TARGET` to the backend's reachable internal URL, such as `http://backend:5000`, then rebuild the frontend because Next.js stores rewrites at build time.
- Confirm the deployed backend serves `GET /api/delivery-settings`. The admin coupon routes are `GET/POST /api/admin/coupons` and `PUT/DELETE /api/admin/coupons/:id`; an unauthenticated request should return an authorization error, not 404.
- The category-restricted coupon feature also requires the `20260926000000_add_coupon_category` migration to be applied to the production database. Ensure the deployment's migration step completes successfully before testing coupons.

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
