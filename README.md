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
