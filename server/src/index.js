import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import slugify from "slugify";
import prismaPackage from "@prisma/client";

const { PrismaClient, Role } = prismaPackage;

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 5000;
const secret = process.env.JWT_SECRET || "development-only-secret";

app.use(cors({ origin: process.env.CLIENT_URL?.split(",") || true }));
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));

const sign = (user) => jwt.sign({ id: user.id, role: user.role }, secret, { expiresIn: "7d" });
const auth = (requiredRole) => async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "Please sign in to continue." });
    req.auth = jwt.verify(token, secret);
    if (requiredRole && req.auth.role !== requiredRole) return res.status(403).json({ message: "Admin access required." });
    next();
  } catch { res.status(401).json({ message: "Your session has expired." }); }
};
const productShape = (p) => ({ ...p, price: Number(p.price), discountPrice: p.discountPrice ? Number(p.discountPrice) : null });

app.get("/api/health", (_req, res) => res.json({ status: "ok", database: "postgresql" }));

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const { name, email, mobile, password } = req.body;
    if (!name || !email || !password || password.length < 6) return res.status(400).json({ message: "Name, email and a 6+ character password are required." });
    const user = await prisma.user.create({ data: { name, email: email.toLowerCase(), mobile, password: await bcrypt.hash(password, 12) } });
    res.status(201).json({ token: sign(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { e.code === "P2002" ? res.status(409).json({ message: "An account with this email already exists." }) : next(e); }
});

app.post("/api/auth/login", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email?.toLowerCase() } });
  if (!user || !(await bcrypt.compare(req.body.password || "", user.password))) return res.status(401).json({ message: "Invalid email or password." });
  res.json({ token: sign(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.get("/api/categories", async (_req, res) => res.json(await prisma.category.findMany({ include: { _count: { select: { products: true } } }, orderBy: { name: "asc" } })));
app.post("/api/categories", auth(Role.ADMIN), async (req, res) => {
  const name = req.body.name?.trim();
  res.status(201).json(await prisma.category.create({ data: { name, slug: slugify(name, { lower: true }), description: req.body.description } }));
});

app.get("/api/products", async (req, res) => {
  const { category, search, sort = "newest", featured } = req.query;
  const orderBy = sort === "price-low" ? { discountPrice: "asc" } : sort === "price-high" ? { discountPrice: "desc" } : sort === "bestsellers" ? { bestseller: "desc" } : { createdAt: "desc" };
  const products = await prisma.product.findMany({
    where: {
      ...(category ? { category: { slug: category } } : {}),
      ...(featured === "true" ? { featured: true } : {}),
      ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { shortDescription: { contains: search, mode: "insensitive" } }] } : {})
    }, include: { category: true }, orderBy
  });
  res.json(products.map(productShape));
});
app.get("/api/products/:slug", async (req, res) => {
  const product = await prisma.product.findUnique({ where: { slug: req.params.slug }, include: { category: true } });
  product ? res.json(productShape(product)) : res.status(404).json({ message: "Product not found." });
});
app.post("/api/products", auth(Role.ADMIN), async (req, res, next) => {
  try {
    const data = req.body;
    const product = await prisma.product.create({ data: { ...data, slug: data.slug || slugify(data.name, { lower: true }), price: Number(data.price), discountPrice: data.discountPrice ? Number(data.discountPrice) : null, stock: Number(data.stock), categoryId: Number(data.categoryId) }, include: { category: true } });
    res.status(201).json(productShape(product));
  } catch (e) { next(e); }
});
app.put("/api/products/:id", auth(Role.ADMIN), async (req, res, next) => {
  try {
    const data = req.body;
    const product = await prisma.product.update({ where: { id: Number(req.params.id) }, data: { ...data, price: Number(data.price), discountPrice: data.discountPrice ? Number(data.discountPrice) : null, stock: Number(data.stock), categoryId: Number(data.categoryId) }, include: { category: true } });
    res.json(productShape(product));
  } catch (e) { next(e); }
});
app.delete("/api/products/:id", auth(Role.ADMIN), async (req, res) => {
  await prisma.product.delete({ where: { id: Number(req.params.id) } }); res.status(204).end();
});

app.post("/api/orders", async (req, res, next) => {
  try {
    const { customer, items, paymentMethod = "COD" } = req.body;
    const ids = items.map((i) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: ids } } });
    const rows = items.map((item) => {
      const p = products.find((x) => x.id === item.productId);
      if (!p || p.stock < item.quantity) throw new Error(`${p?.name || "Product"} is unavailable.`);
      return { productId: p.id, name: p.name, price: p.discountPrice || p.price, quantity: item.quantity, weight: p.weight };
    });
    const subtotal = rows.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
    const delivery = subtotal >= 999 ? 0 : 79;
    let userId = null;
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token) try { userId = jwt.verify(token, secret).id; } catch {}
    const order = await prisma.$transaction(async (tx) => {
      for (const row of rows) await tx.product.update({ where: { id: row.productId }, data: { stock: { decrement: row.quantity } } });
      return tx.order.create({ data: { orderNumber: `SAM${Date.now().toString().slice(-8)}`, userId, ...customer, paymentMethod, subtotal, delivery, total: subtotal + delivery, items: { create: rows } }, include: { items: true } });
    });
    res.status(201).json(order);
  } catch (e) { next(e); }
});
app.get("/api/orders/mine", auth(), async (req, res) => res.json(await prisma.order.findMany({ where: { userId: req.auth.id }, include: { items: true }, orderBy: { createdAt: "desc" } })));
app.get("/api/orders", auth(Role.ADMIN), async (_req, res) => res.json(await prisma.order.findMany({ include: { items: true, user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" } })));
app.patch("/api/orders/:id/status", auth(Role.ADMIN), async (req, res) => res.json(await prisma.order.update({ where: { id: Number(req.params.id) }, data: { status: req.body.status } })));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Something went wrong." });
});
app.listen(port, () => console.log(`Samruddhi API running on http://localhost:${port}`));
