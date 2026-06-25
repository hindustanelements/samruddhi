# Samruddhi — From Farm to Kitchen

Full-stack organic pantry and traditional clay cookware store.

## Stack

- React + Vite + Tailwind CSS
- Node.js + Express
- PostgreSQL + Prisma
- JWT authentication

## Run locally

1. Copy `server/.env.example` to `server/.env` and set your PostgreSQL URL.
2. Run `npm install`, then `npm run install:all` from the project root.
3. Run `npm run db:push --prefix server`.
4. Run `npm run db:seed --prefix server`.
5. Run `npm run dev`.

Storefront: `http://localhost:5173`  
API: `http://localhost:5000/api`

Seed admin: `admin@samruddhi.in` / `Admin@123`
