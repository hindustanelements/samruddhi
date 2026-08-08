import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import slugify from "slugify";
import nodemailer from "nodemailer";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import prismaPackage from "@prisma/client";

const { PrismaClient, Role } = prismaPackage;

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");
const uploadsDir = path.join(publicDir, "uploads");
const secret = process.env.JWT_SECRET || "development-only-secret";
const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = String(process.env.SMTP_SECURE || "false") === "true";
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@samruddhi.store";
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
const razorpayCurrency = process.env.RAZORPAY_CURRENCY || "INR";
const transporter = smtpHost && smtpUser && smtpPass
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: smtpUser, pass: smtpPass }
    })
  : null;
const staffOtps = new Map();
const staffOtpTtlMs = 10 * 60 * 1000;
const customerPasswordOtps = new Map();
const customerPasswordOtpTtlMs = 10 * 60 * 1000;
const couponsReady = () => Boolean(prisma.coupon);
const pendingRazorpayOrders = new Map();

const sendEmail = async ({ to, subject, text, html }) => {
  if (!transporter || !to) return;
  await transporter.sendMail({ from: smtpFrom, to, subject, text, html });
};

app.use(cors({ origin: process.env.CLIENT_URL?.split(",") || true }));
app.use(express.json({ limit: "15mb" }));
app.use(morgan("dev"));
app.use("/uploads", express.static(uploadsDir));

const sign = (user) => jwt.sign({ id: user.id, role: user.role }, secret, { expiresIn: "7d" });
const authUserShape = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  mobile: user.mobile,
  address: user.address,
  city: user.city,
  pincode: user.pincode,
  role: user.role
});
const createOtp = () => String(Math.floor(100000 + Math.random() * 900000));
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
const productData = (body) => ({
  name: body.name?.trim(),
  slug: body.slug?.trim() || slugify(body.name || "", { lower: true }),
  sku: body.sku?.trim() || null,
  unit: body.unit?.trim() || null,
  shortDescription: body.shortDescription?.trim(),
  description: body.description?.trim() || body.shortDescription?.trim(),
  benefits: body.benefits?.trim() || "Naturally sourced and carefully packed",
  usage: body.usage?.trim() || "Store in a cool, dry place.",
  price: Number(body.price),
  discountPrice: body.discountPrice ? Number(body.discountPrice) : null,
  weight: body.weight?.trim(),
  stock: Number(body.stock),
  image: body.image?.trim(),
  metaTitle: body.metaTitle?.trim() || null,
  metaDescription: body.metaDescription?.trim() || null,
  seoKeywords: body.seoKeywords?.trim() || null,
  featured: body.featured === true,
  bestseller: body.bestseller === true,
  categoryId: Number(body.categoryId)
});
const requireProduct = (data) => {
  if (!data.name) return "Product name is required.";
  if (!data.sku) return "Product SKU is required.";
  if (!data.unit) return "Product unit is required.";
  if (!data.categoryId) return "Product category is required.";
  if (!data.weight) return "Product weight / size is required.";
  if (!Number.isFinite(data.price)) return "Product price is required.";
  if (!Number.isFinite(data.stock)) return "Product stock is required.";
  if (!data.shortDescription) return "Product short description is required.";
  if (!data.image) return "Product image is required.";
  return "";
};
const productImportFields = [
  "name", "slug", "sku", "unit", "shortDescription", "description", "benefits", "usage",
  "price", "discountPrice", "weight", "stock", "image", "metaTitle", "metaDescription",
  "seoKeywords", "featured", "bestseller", "active", "categoryId"
];
const productImportFieldByKey = Object.fromEntries(productImportFields.map((field) => [field.toLowerCase(), field]));
const productImportAliases = {
  itemcode: "sku",
  itemname: "name",
  saleprice: "price",
  sellingprice: "price",
  mrp: "price",
  category: "categoryName",
  categoryname: "categoryName"
};
const decodeXml = (value = "") => String(value)
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, "\"")
  .replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
  .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCharCode(parseInt(code, 16)));
const compactKey = (value = "") => String(value).trim().replace(/^\uFEFF/, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
const cleanImportString = (value) => value === null || value === undefined ? "" : String(value).trim();
const parseImportNumber = (value, fallback = 0) => {
  const clean = cleanImportString(value).replace(/,/g, "");
  if (!clean) return fallback;
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const parseImportBoolean = (value, fallback = false) => {
  if (value === true || value === false) return value;
  const clean = cleanImportString(value).toLowerCase();
  if (!clean) return fallback;
  return ["true", "yes", "y", "1", "active"].includes(clean)
    ? true
    : ["false", "no", "n", "0", "inactive"].includes(clean)
      ? false
      : fallback;
};
const importHeaderField = (header) => {
  const clean = cleanImportString(header);
  if (!clean) return null;
  if (productImportFields.includes(clean)) return clean;
  const lower = clean.toLowerCase();
  if (productImportFieldByKey[lower]) return productImportFieldByKey[lower];
  return productImportAliases[compactKey(clean)] || null;
};
const zipEntries = (buffer) => {
  const entries = {};
  let eocdOffset = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 66000); i -= 1) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error("Could not read Excel file.");
  const centralDirectorySize = buffer.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  let offset = centralDirectoryOffset;
  const end = centralDirectoryOffset + centralDirectorySize;
  while (offset < end) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) break;
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString("utf8");
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    const data = method === 0 ? compressed : method === 8 ? zlib.inflateRawSync(compressed) : null;
    if (data) entries[name] = data.toString("utf8");
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
};
const columnIndex = (ref = "") => {
  const letters = String(ref).match(/^[A-Z]+/i)?.[0]?.toUpperCase() || "";
  return letters.split("").reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1;
};
const sharedStringsFromXml = (xml = "") => (xml.match(/<si\b[\s\S]*?<\/si>/g) || []).map((block) => {
  const parts = [...block.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((match) => decodeXml(match[1]));
  return parts.join("");
});
const cellValueFromXml = (attrs = "", body = "", sharedStrings = []) => {
  const type = attrs.match(/\bt="([^"]+)"/)?.[1];
  if (type === "inlineStr") {
    return [...body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((match) => decodeXml(match[1])).join("");
  }
  const raw = body.match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1] || "";
  if (type === "s") return sharedStrings[Number(raw)] || "";
  return decodeXml(raw);
};
const rowsFromXlsx = (buffer) => {
  const entries = zipEntries(buffer);
  const sheetPath = entries["xl/worksheets/sheet1.xml"] ? "xl/worksheets/sheet1.xml" : Object.keys(entries).find((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name));
  if (!sheetPath) throw new Error("No worksheet found in Excel file.");
  const sharedStrings = sharedStringsFromXml(entries["xl/sharedStrings.xml"] || "");
  const sheetXml = entries[sheetPath];
  const rows = [];
  for (const rowMatch of sheetXml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
    const rowNumber = Number(rowMatch[1].match(/\br="(\d+)"/)?.[1] || rows.length + 1);
    const values = [];
    for (const cellMatch of rowMatch[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cellMatch[1] || "";
      const ref = attrs.match(/\br="([^"]+)"/)?.[1] || "";
      values[columnIndex(ref)] = cellValueFromXml(attrs, cellMatch[2] || "", sharedStrings);
    }
    rows.push({ rowNumber, values });
  }
  return rows;
};
const rowsFromCsv = (buffer) => {
  const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted && char === "\"" && next === "\"") {
      cell += "\"";
      i += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (!quoted && char === ",") {
      row.push(cell);
      cell = "";
    } else if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      rows.push({ rowNumber: rows.length + 1, values: row });
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push({ rowNumber: rows.length + 1, values: row });
  }
  return rows;
};
const uploadBufferFromBody = (body) => {
  const match = String(body.dataUrl || "").match(/^data:[^;]+;base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error("Upload a valid CSV or XLSX file.");
  return Buffer.from(match[1], "base64");
};
const importRowsFromUpload = (body) => {
  const filename = cleanImportString(body.filename).toLowerCase();
  const buffer = uploadBufferFromBody(body);
  if (buffer.length > 12 * 1024 * 1024) throw new Error("Bulk upload file must be 12 MB or smaller.");
  if (filename.endsWith(".csv")) return rowsFromCsv(buffer);
  if (filename.endsWith(".xlsx")) return rowsFromXlsx(buffer);
  throw new Error("Bulk upload supports .xlsx and .csv files.");
};
const uniqueProductSlug = (base, usedSlugs, ownSlug = "") => {
  const cleanBase = slugify(cleanImportString(base) || "imported-product", { lower: true, strict: true }) || "imported-product";
  let candidate = cleanBase;
  let index = 2;
  while (usedSlugs.has(candidate) && candidate !== ownSlug) {
    candidate = `${cleanBase}-${index}`;
    index += 1;
  }
  usedSlugs.add(candidate);
  return candidate;
};
const prepareBulkProducts = async (rows) => {
  const headerRow = rows.find((row) => row.values.some((value) => cleanImportString(value)));
  if (!headerRow) throw new Error("The file does not contain a header row.");
  const mappedHeaders = headerRow.values.map((header) => ({ header: cleanImportString(header), field: importHeaderField(header) }));
  const matchedHeaders = mappedHeaders.filter((item) => item.field);
  if (!matchedHeaders.length) throw new Error("No product fields matched. Use DB field names like name, sku, price, unit, image, categoryId, or stock report headers like Item Code, Item Name, Category, Sale Price.");

  const dataRows = rows.filter((row) => row.rowNumber > headerRow.rowNumber);
  const preparedRows = [];
  const skippedRows = [];
  const categoryNames = new Set(["Uncategorized"]);

  for (const row of dataRows) {
    const raw = {};
    mappedHeaders.forEach(({ field }, index) => {
      if (field) raw[field] = row.values[index];
    });
    const hasAnyMatchedValue = Object.values(raw).some((value) => cleanImportString(value));
    if (!hasAnyMatchedValue) {
      skippedRows.push({ rowNumber: row.rowNumber, reason: "No matching product values." });
      continue;
    }
    if (cleanImportString(raw.name) === "." && !cleanImportString(raw.sku) && !cleanImportString(raw.categoryName)) {
      skippedRows.push({ rowNumber: row.rowNumber, reason: "Placeholder row." });
      continue;
    }

    const price = parseImportNumber(raw.price, 0);
    const name = cleanImportString(raw.name) || `Imported Product ${row.rowNumber}`;
    const sku = cleanImportString(raw.sku) || `AUTO-ROW-${String(row.rowNumber).padStart(6, "0")}`;
    const unit = cleanImportString(raw.unit) || "PCS";
    const categoryName = cleanImportString(raw.categoryName) || "Uncategorized";
    categoryNames.add(categoryName);
    preparedRows.push({
      rowNumber: row.rowNumber,
      categoryName,
      data: {
        name,
        sku,
        unit,
        shortDescription: cleanImportString(raw.shortDescription) || name,
        description: cleanImportString(raw.description) || cleanImportString(raw.shortDescription) || name,
        benefits: cleanImportString(raw.benefits) || "Naturally sourced and carefully packed",
        usage: cleanImportString(raw.usage) || "Store in a cool, dry place.",
        price,
        discountPrice: cleanImportString(raw.discountPrice) ? parseImportNumber(raw.discountPrice, null) : null,
        weight: cleanImportString(raw.weight) || unit || "1 unit",
        stock: Math.max(0, Math.floor(parseImportNumber(raw.stock, 0))),
        image: cleanImportString(raw.image) || "/samruddhi-hero.png",
        metaTitle: cleanImportString(raw.metaTitle) || null,
        metaDescription: cleanImportString(raw.metaDescription) || null,
        seoKeywords: cleanImportString(raw.seoKeywords) || null,
        featured: parseImportBoolean(raw.featured, false),
        bestseller: parseImportBoolean(raw.bestseller, false),
        active: parseImportBoolean(raw.active, price > 0),
        categoryId: Math.floor(parseImportNumber(raw.categoryId, 0)) || null,
        slug: cleanImportString(raw.slug)
      },
      defaults: {
        generatedSku: !cleanImportString(raw.sku),
        defaultUnit: !cleanImportString(raw.unit),
        defaultCategory: !cleanImportString(raw.categoryName) && !cleanImportString(raw.categoryId),
        defaultPrice: !cleanImportString(raw.price),
        zeroPrice: price <= 0,
        defaultImage: !cleanImportString(raw.image)
      }
    });
  }

  const categories = await prisma.category.findMany();
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
  const newCategories = [];

  for (const name of categoryNames) {
    const slug = slugify(name, { lower: true, strict: true }) || "uncategorized";
    if (!categoryBySlug.has(slug)) {
      const category = await prisma.category.create({ data: { name, slug, description: null, image: null } });
      categoryBySlug.set(category.slug, category);
      categoryById.set(category.id, category);
      newCategories.push(category.name);
    }
  }

  const allProducts = await prisma.product.findMany({ select: { id: true, sku: true, slug: true } });
  const productBySku = new Map(allProducts.filter((product) => product.sku).map((product) => [product.sku, product]));
  const usedSlugs = new Set(allProducts.map((product) => product.slug));

  const readyRows = preparedRows.map((row) => {
    const existing = productBySku.get(row.data.sku);
    if (existing?.slug) usedSlugs.delete(existing.slug);
    const category = (row.data.categoryId ? categoryById.get(row.data.categoryId) : null) || categoryBySlug.get(slugify(row.categoryName, { lower: true, strict: true }) || "uncategorized");
    const categoryId = category?.id || categoryBySlug.get("uncategorized")?.id;
    const slug = uniqueProductSlug(row.data.slug || row.data.name, usedSlugs, existing?.slug);
    return { ...row, existingId: existing?.id || null, data: { ...row.data, slug, categoryId } };
  });

  const summary = {
    totalRows: dataRows.length,
    readyRows: readyRows.length,
    skippedRows: skippedRows.length,
    matchedHeaders: matchedHeaders.map((item) => `${item.header} -> ${item.field}`),
    ignoredHeaders: mappedHeaders.filter((item) => item.header && !item.field).map((item) => item.header),
    generatedSku: readyRows.filter((row) => row.defaults.generatedSku).length,
    defaultUnit: readyRows.filter((row) => row.defaults.defaultUnit).length,
    defaultCategory: readyRows.filter((row) => row.defaults.defaultCategory).length,
    defaultPrice: readyRows.filter((row) => row.defaults.defaultPrice).length,
    zeroPrice: readyRows.filter((row) => row.defaults.zeroPrice).length,
    defaultImage: readyRows.filter((row) => row.defaults.defaultImage).length,
    newCategories
  };
  return { readyRows, skippedRows, summary, preview: readyRows.slice(0, 8).map((row) => ({ rowNumber: row.rowNumber, ...row.data })) };
};
const couponShape = (coupon) => coupon ? ({
  ...coupon,
  value: Number(coupon.value),
  minSubtotal: Number(coupon.minSubtotal || 0),
  maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null
}) : null;
const couponData = (body) => ({
  code: body.code?.trim().toUpperCase(),
  type: body.type === "FIXED" ? "FIXED" : "PERCENT",
  value: Number(body.value),
  minSubtotal: Number(body.minSubtotal || 0),
  maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : null,
  usageLimit: body.usageLimit ? Number(body.usageLimit) : null,
  active: body.active !== false,
  startsAt: body.startsAt ? new Date(body.startsAt) : null,
  expiresAt: body.expiresAt ? new Date(body.expiresAt) : null
});
const requireCoupon = (data) => {
  if (!data.code) return "Coupon code is required.";
  if (!Number.isFinite(data.value) || data.value <= 0) return "Discount value must be greater than 0.";
  if (data.type === "PERCENT" && data.value > 100) return "Percentage discount cannot exceed 100.";
  if (!Number.isFinite(data.minSubtotal) || data.minSubtotal < 0) return "Minimum subtotal must be 0 or more.";
  if (data.maxDiscount !== null && (!Number.isFinite(data.maxDiscount) || data.maxDiscount <= 0)) return "Maximum discount must be greater than 0.";
  if (data.usageLimit !== null && (!Number.isInteger(data.usageLimit) || data.usageLimit <= 0)) return "Usage limit must be a whole number greater than 0.";
  if (data.startsAt && Number.isNaN(data.startsAt.valueOf())) return "Start date is invalid.";
  if (data.expiresAt && Number.isNaN(data.expiresAt.valueOf())) return "Expiry date is invalid.";
  if (data.startsAt && data.expiresAt && data.startsAt >= data.expiresAt) return "Expiry date must be after start date.";
  return "";
};
const cartRows = async (items = []) => {
  if (!Array.isArray(items) || !items.length) throw new Error("Cart is empty.");
  const ids = items.map((i) => Number(i.productId));
  const products = await prisma.product.findMany({ where: { id: { in: ids }, active: true } });
  return items.map((item) => {
    const productId = Number(item.productId);
    const quantity = Number(item.quantity || 0);
    const p = products.find((x) => x.id === productId);
    if (!p || p.stock < quantity || quantity < 1) throw new Error(`${p?.name || "Product"} is unavailable.`);
    return { productId: p.id, name: p.name, price: p.discountPrice || p.price, quantity, weight: p.weight };
  });
};
const couponDiscount = (coupon, subtotal) => {
  const raw = coupon.type === "PERCENT" ? subtotal * (Number(coupon.value) / 100) : Number(coupon.value);
  const capped = coupon.maxDiscount ? Math.min(raw, Number(coupon.maxDiscount)) : raw;
  return Math.min(subtotal, Math.max(0, Math.floor(capped)));
};
const validateCoupon = async (code, subtotal) => {
  const cleanCode = code?.trim().toUpperCase();
  if (!cleanCode) return { coupon: null, discount: 0 };
  if (!couponsReady()) throw new Error("Coupon setup is not ready. Please run Prisma db push and generate, then restart the server.");
  const coupon = await prisma.coupon.findUnique({ where: { code: cleanCode } });
  const now = new Date();
  if (!coupon || !coupon.active) throw new Error("Coupon code is not valid.");
  if (coupon.startsAt && coupon.startsAt > now) throw new Error("Coupon code is not active yet.");
  if (coupon.expiresAt && coupon.expiresAt < now) throw new Error("Coupon code has expired.");
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new Error("Coupon usage limit has been reached.");
  if (subtotal < Number(coupon.minSubtotal || 0)) throw new Error(`Add ${Number(coupon.minSubtotal) - subtotal} more to use this coupon.`);
  return { coupon, discount: couponDiscount(coupon, subtotal) };
};
const orderTotals = async ({ items, couponCode }) => {
  const rows = await cartRows(items);
  const subtotal = rows.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
  const delivery = 0;
  const { coupon, discount } = await validateCoupon(couponCode, subtotal);
  return { rows, subtotal, delivery, coupon, discount, total: subtotal + delivery - discount };
};
const verifyRazorpayPayment = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  if (!razorpayKeySecret || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return false;
  const expected = crypto
    .createHmac("sha256", razorpayKeySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
  if (expected.length !== razorpay_signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));
};
const heroSlideShape = ({ categoryName, categorySlug, ...slide }) => ({
  ...slide,
  highlights: slide.highlights.split("|").filter(Boolean),
  category: slide.categoryId ? { id: slide.categoryId, name: categoryName, slug: categorySlug } : null
});
const heroSlideData = (body) => ({
  eyebrow: body.eyebrow?.trim(),
  title: body.title?.trim(),
  body: body.body?.trim(),
  link: body.link?.trim() || "/products",
  cta: body.cta?.trim() || "Shop now",
  tone: body.tone?.trim() || null,
  image: body.image?.trim(),
  highlights: Array.isArray(body.highlights) ? body.highlights.map((x) => String(x).trim()).filter(Boolean).join("|") : String(body.highlights || "").split(",").map((x) => x.trim()).filter(Boolean).join("|"),
  categoryId: body.categoryId ? Number(body.categoryId) : null,
  sortOrder: Number(body.sortOrder || 0),
  active: body.active !== false
});
const requireHeroSlide = (data) => {
  if (!data.eyebrow || !data.title || !data.body || !data.image) return "Eyebrow, title, body and image are required.";
  if (!data.categoryId) return "Hero slide category is required.";
  if (!data.image.startsWith("/uploads/") && !data.image.startsWith("/slide-") && !data.image.startsWith("/samruddhi-")) return "Hero slide image must be uploaded from local files.";
  return "";
};
const heroSlideRows = () => prisma.$queryRaw`
  SELECT h.id, h.eyebrow, h.title, h.body, h.link, h.cta, h.tone, h.image, h.highlights, h."categoryId", c.name AS "categoryName", c.slug AS "categorySlug", h."sortOrder", h.active, h."createdAt", h."updatedAt"
  FROM "HeroSlide" h
  LEFT JOIN "Category" c ON c.id = h."categoryId"
  ORDER BY h."sortOrder" ASC, h."createdAt" ASC
`;
const adminUserShape = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt
});
const fallbackNameFromEmail = (email) => email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) || "Samruddhi Admin";
const randomPassword = () => `${createOtp()}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const defaultLogoImages = ["/samruddhi-transparent.png", "/samruddhi1-transparent.png", "/polam-transparent.png"];
const legacyLogoImages = {
  "/samruddhi.webp": "/samruddhi-transparent.png",
  "/samruddhi1.png": "/samruddhi1-transparent.png",
  "/samruddhi1.webp": "/samruddhi1-transparent.png",
  "/polam.webp": "/polam-transparent.png"
};
const cleanLogoImages = (value) => {
  const items = Array.isArray(value) ? value : [];
  return defaultLogoImages.map((fallback, index) => {
    const image = String(items[index] || "").trim();
    return legacyLogoImages[image] || image || fallback;
  });
};
const validateLogoImages = (images) => {
  for (const image of cleanLogoImages(images)) {
    if (!image.startsWith("/uploads/") && !image.endsWith("-transparent.png")) return "Logos must be uploaded from local files.";
  }
  return "";
};
const cleanSettingImage = (image) => String(image || "").trim();
const validateUploadedSettingImage = (image, label) => {
  const clean = cleanSettingImage(image);
  if (clean && !clean.startsWith("/uploads/")) return `${label} image must be uploaded from local files.`;
  return "";
};
const ensureDatabaseShape = async () => {
  await prisma.$executeRaw`ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'ONLINE'`;
  await prisma.$executeRaw`ALTER TABLE "HeroSlide" ADD COLUMN IF NOT EXISTS "categoryId" integer`;
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "SiteSetting" (
      key text PRIMARY KEY,
      value text NOT NULL,
      "updatedAt" timestamp(3) NOT NULL DEFAULT now()
    )
  `;
  await prisma.$executeRaw`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'HeroSlide_categoryId_fkey'
      ) THEN
        ALTER TABLE "HeroSlide"
        ADD CONSTRAINT "HeroSlide_categoryId_fkey"
        FOREIGN KEY ("categoryId") REFERENCES "Category"(id);
      END IF;
    END $$;
  `;
};
const homeSettingsShape = async () => {
  const rows = await prisma.$queryRaw`SELECT value FROM "SiteSetting" WHERE key = 'home_showcase_category_id'`;
  const logoRows = await prisma.$queryRaw`SELECT value FROM "SiteSetting" WHERE key = 'site_logo_images'`;
  const whatsappRows = await prisma.$queryRaw`SELECT value FROM "SiteSetting" WHERE key = 'whatsapp_button_image'`;
  const showcaseCategoryId = rows[0]?.value ? Number(rows[0].value) : null;
  const whatsappButtonImage = cleanSettingImage(whatsappRows[0]?.value);
  const logoImages = (() => {
    try { return cleanLogoImages(JSON.parse(logoRows[0]?.value || "[]")); }
    catch { return defaultLogoImages; }
  })();
  const [category] = showcaseCategoryId ? await prisma.$queryRaw`
    SELECT id, name, slug, description, image, "createdAt", (
      SELECT COUNT(*)::int FROM "Product" WHERE "categoryId" = ${showcaseCategoryId}
    ) AS "productCount"
    FROM "Category"
    WHERE id = ${showcaseCategoryId}
  ` : [];
  return { showcaseCategoryId, showcaseCategory: category ? categoryShape(category) : null, logoImages, whatsappButtonImage };
};

app.get("/api/health", (_req, res) => res.json({ status: "ok", database: "postgresql" }));

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const { name, email, mobile, password } = req.body;
    if (!name || !email || !password || password.length < 6) return res.status(400).json({ message: "Name, email and a 6+ character password are required." });
    const user = await prisma.user.create({ data: { name, email: email.toLowerCase(), mobile, password: await bcrypt.hash(password, 12) } });

    await sendEmail({
      to: user.email,
      subject: "Welcome to Samruddhi",
      text: `Hi ${user.name}, your Samruddhi account has been created successfully.`,
      html: `<p>Hi ${user.name},</p><p>Your Samruddhi account has been created successfully.</p>`
    });

    res.status(201).json({ token: sign(user), user: authUserShape(user) });
  } catch (e) { e.code === "P2002" ? res.status(409).json({ message: "An account with this email already exists." }) : next(e); }
});

app.post("/api/auth/continue", async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password || "";

    if (!name || !email || password.length < 6) {
      return res.status(400).json({ message: "Name, email and a 6+ character password are required." });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      if (!(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Invalid password." });
      }

      return res.json({ token: sign(user), user: authUserShape(user), mode: "login" });
    }

    const created = await prisma.user.create({
      data: { name, email, password: await bcrypt.hash(password, 12) }
    });

    await sendEmail({
      to: created.email,
      subject: "Welcome to Samruddhi",
      text: `Hi ${created.name}, your Samruddhi account has been created successfully.`,
      html: `<p>Hi ${created.name},</p><p>Your Samruddhi account has been created successfully.</p>`
    });

    res.status(201).json({ token: sign(created), user: authUserShape(created), mode: "register" });
  } catch (e) { next(e); }
});

app.post("/api/auth/staff/request-otp", async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "Staff email is required." });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== Role.ADMIN) return res.status(403).json({ message: "Staff account not found." });
    if (!transporter) return res.status(500).json({ message: "Email delivery is not configured." });

    const otp = createOtp();
    staffOtps.set(email, { otp, expiresAt: Date.now() + staffOtpTtlMs });

    await sendEmail({
      to: email,
      subject: "Your Samruddhi staff login OTP",
      text: `Your Samruddhi staff login OTP is ${otp}. It expires in 10 minutes.`,
      html: `<p>Your Samruddhi staff login OTP is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`
    });

    res.json({ message: "OTP sent to staff email." });
  } catch (e) { next(e); }
});

app.post("/api/auth/staff/verify-otp", async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const otp = req.body.otp?.trim();
    const saved = staffOtps.get(email);

    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required." });
    if (!saved || saved.expiresAt < Date.now() || saved.otp !== otp) return res.status(401).json({ message: "Invalid or expired OTP." });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== Role.ADMIN) return res.status(403).json({ message: "Staff account not found." });

    staffOtps.delete(email);
    res.json({ token: sign(user), user: authUserShape(user) });
  } catch (e) { next(e); }
});

app.post("/api/auth/customer/request-password-reset", async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "Email is required." });
    if (!transporter) return res.status(500).json({ message: "Email delivery is not configured." });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== Role.USER) return res.status(404).json({ message: "Customer account not found." });

    const otp = createOtp();
    customerPasswordOtps.set(email, { otp, expiresAt: Date.now() + customerPasswordOtpTtlMs });

    await sendEmail({
      to: email,
      subject: "Reset your Samruddhi password",
      text: `Your Samruddhi password reset OTP is ${otp}. It expires in 10 minutes.`,
      html: `<p>Your Samruddhi password reset OTP is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`
    });

    res.json({ message: "Password reset OTP sent to your email." });
  } catch (e) { next(e); }
});

app.post("/api/auth/customer/verify-password-otp", async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const otp = req.body.otp?.trim();
    const saved = customerPasswordOtps.get(email);

    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required." });
    if (!saved || saved.expiresAt < Date.now() || saved.otp !== otp) return res.status(401).json({ message: "Invalid or expired OTP." });

    customerPasswordOtps.set(email, { ...saved, verified: true });
    res.json({ message: "OTP verified. Enter your new password." });
  } catch (e) { next(e); }
});

app.post("/api/auth/customer/reset-password", async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password || "";
    const saved = customerPasswordOtps.get(email);

    if (!email || password.length < 6) return res.status(400).json({ message: "Email and a 6+ character password are required." });
    if (!saved || saved.expiresAt < Date.now() || !saved.verified) return res.status(401).json({ message: "Please verify OTP before setting a new password." });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== Role.USER) return res.status(404).json({ message: "Customer account not found." });

    const updated = await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(password, 12) } });
    customerPasswordOtps.delete(email);
    res.json({ token: sign(updated), user: authUserShape(updated), message: "Password updated successfully." });
  } catch (e) { next(e); }
});

app.post("/api/auth/login", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email?.toLowerCase() } });
  if (!user || !(await bcrypt.compare(req.body.password || "", user.password))) return res.status(401).json({ message: "Invalid email or password." });
  res.json({ token: sign(user), user: authUserShape(user) });
});

app.get("/api/profile", auth(), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.auth.id } });
    user ? res.json(authUserShape(user)) : res.status(404).json({ message: "Profile not found." });
  } catch (e) { next(e); }
});

app.put("/api/profile", auth(), async (req, res, next) => {
  try {
    const data = {
      name: req.body.name?.trim(),
      mobile: req.body.mobile?.trim(),
      address: req.body.address?.trim(),
      city: req.body.city?.trim(),
      pincode: req.body.pincode?.trim()
    };

    if (!data.name || !data.mobile || !data.address || !data.city || !data.pincode) {
      return res.status(400).json({ message: "Name, mobile number and full address are required." });
    }

    const user = await prisma.user.update({ where: { id: req.auth.id }, data });
    res.json(authUserShape(user));
  } catch (e) { next(e); }
});

const categoryRows = () => prisma.$queryRaw`
  SELECT c.id, c.name, c.slug, c.description, c.image, c."createdAt", COUNT(p.id)::int AS "productCount"
  FROM "Category" c
  LEFT JOIN "Product" p ON p."categoryId" = c.id
  GROUP BY c.id
  ORDER BY c.name ASC
`;
const categoryShape = (category) => ({ ...category, _count: { products: Number(category.productCount || 0) } });
const requireCategoryImage = (image) => {
  if (!image) return "Category image is required.";
  if (!image.startsWith("/uploads/")) return "Category image must be uploaded from local files.";
  return "";
};

app.get("/api/categories", async (_req, res) => {
  const categories = await categoryRows();
  res.json(categories.map(categoryShape));
});
app.get("/api/home-settings", async (_req, res, next) => {
  try {
    res.json(await homeSettingsShape());
  } catch (e) { next(e); }
});
app.post("/api/categories", auth(Role.ADMIN), async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    const description = req.body.description?.trim() || null;
    const image = req.body.image?.trim();
    if (!name) return res.status(400).json({ message: "Category name is required." });
    const imageError = requireCategoryImage(image);
    if (imageError) return res.status(400).json({ message: imageError });
    const [category] = await prisma.$queryRaw`
      INSERT INTO "Category" (name, slug, description, image)
      VALUES (${name}, ${slugify(name, { lower: true })}, ${description}, ${image})
      RETURNING id, name, slug, description, image, "createdAt", 0::int AS "productCount"
    `;
    res.status(201).json(categoryShape(category));
  } catch (e) { next(e); }
});
app.put("/api/categories/:id", auth(Role.ADMIN), async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    const description = req.body.description?.trim() || null;
    const image = req.body.image?.trim();
    if (!name) return res.status(400).json({ message: "Category name is required." });
    const imageError = requireCategoryImage(image);
    if (imageError) return res.status(400).json({ message: imageError });
    const [category] = await prisma.$queryRaw`
      UPDATE "Category"
      SET name = ${name}, slug = ${slugify(name, { lower: true })}, description = ${description}, image = ${image}
      WHERE id = ${Number(req.params.id)}
      RETURNING id, name, slug, description, image, "createdAt", (
        SELECT COUNT(*)::int FROM "Product" WHERE "categoryId" = ${Number(req.params.id)}
      ) AS "productCount"
    `;
    category ? res.json(categoryShape(category)) : res.status(404).json({ message: "Record not found." });
  } catch (e) { next(e); }
});
app.delete("/api/categories/:id", auth(Role.ADMIN), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const products = await prisma.product.count({ where: { categoryId: id } });
    if (products > 0) return res.status(409).json({ message: "Move or delete products in this category first." });
    await prisma.category.delete({ where: { id } });
    res.status(204).end();
  } catch (e) { next(e); }
});
app.get("/api/admin/overview", auth(Role.ADMIN), async (_req, res) => {
  const [products, orders, users, contactRows, revenueResult] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.user.count(),
    prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM "ContactSubmission"`,
    prisma.order.aggregate({ _sum: { total: true } })
  ]);
  const contacts = Number(contactRows[0]?.count || 0);
  res.json({ products, orders, users, contacts, revenue: Number(revenueResult._sum.total || 0) });
});

app.get("/api/admin/home-settings", auth(Role.ADMIN), async (_req, res, next) => {
  try {
    res.json(await homeSettingsShape());
  } catch (e) { next(e); }
});

app.put("/api/admin/home-settings", auth(Role.ADMIN), async (req, res, next) => {
  try {
    const categoryId = Number(req.body.showcaseCategoryId);
    const logoImages = cleanLogoImages(req.body.logoImages);
    const logoError = validateLogoImages(logoImages);
    if (logoError) return res.status(400).json({ message: logoError });
    const whatsappButtonImage = cleanSettingImage(req.body.whatsappButtonImage);
    const whatsappImageError = validateUploadedSettingImage(whatsappButtonImage, "WhatsApp button");
    if (whatsappImageError) return res.status(400).json({ message: whatsappImageError });
    if (!categoryId) return res.status(400).json({ message: "Choose a category to display on the home page." });
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return res.status(404).json({ message: "Category not found." });
    await prisma.$executeRaw`
      INSERT INTO "SiteSetting" (key, value, "updatedAt")
      VALUES ('home_showcase_category_id', ${String(categoryId)}, now())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = now()
    `;
    await prisma.$executeRaw`
      INSERT INTO "SiteSetting" (key, value, "updatedAt")
      VALUES ('site_logo_images', ${JSON.stringify(logoImages)}, now())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = now()
    `;
    await prisma.$executeRaw`
      INSERT INTO "SiteSetting" (key, value, "updatedAt")
      VALUES ('whatsapp_button_image', ${whatsappButtonImage}, now())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = now()
    `;
    res.json(await homeSettingsShape());
  } catch (e) { next(e); }
});

app.get("/api/admin/admins", auth(Role.ADMIN), async (_req, res, next) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: Role.ADMIN },
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: "asc" }
    });
    res.json(admins.map(adminUserShape));
  } catch (e) { next(e); }
});

app.get("/api/admin/customers", auth(Role.ADMIN), async (_req, res, next) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: Role.USER },
      select: { id: true, name: true, email: true, mobile: true, address: true, city: true, pincode: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" }
    });
    res.json({ count: customers.length, customers });
  } catch (e) { next(e); }
});

app.get("/api/admin/coupons", auth(Role.ADMIN), async (_req, res, next) => {
  try {
    if (!couponsReady()) return res.json([]);
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    res.json(coupons.map(couponShape));
  } catch (e) { next(e); }
});

app.post("/api/admin/coupons", auth(Role.ADMIN), async (req, res, next) => {
  try {
    if (!couponsReady()) return res.status(503).json({ message: "Coupon setup is not ready. Run npm run db:push in backend, then restart the server." });
    const data = couponData(req.body);
    const error = requireCoupon(data);
    if (error) return res.status(400).json({ message: error });
    const coupon = await prisma.coupon.create({ data });
    res.status(201).json(couponShape(coupon));
  } catch (e) { next(e); }
});

app.put("/api/admin/coupons/:id", auth(Role.ADMIN), async (req, res, next) => {
  try {
    if (!couponsReady()) return res.status(503).json({ message: "Coupon setup is not ready. Run npm run db:push in backend, then restart the server." });
    const data = couponData(req.body);
    const error = requireCoupon(data);
    if (error) return res.status(400).json({ message: error });
    const coupon = await prisma.coupon.update({ where: { id: Number(req.params.id) }, data });
    res.json(couponShape(coupon));
  } catch (e) { next(e); }
});

app.delete("/api/admin/coupons/:id", auth(Role.ADMIN), async (req, res, next) => {
  try {
    if (!couponsReady()) return res.status(503).json({ message: "Coupon setup is not ready. Run npm run db:push in backend, then restart the server." });
    await prisma.coupon.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (e) { next(e); }
});

app.post("/api/coupons/validate", async (req, res, next) => {
  try {
    const rows = await cartRows(req.body.items);
    const subtotal = rows.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
    const { coupon, discount } = await validateCoupon(req.body.code, subtotal);
    res.json({ coupon: couponShape(coupon), discount, subtotal, totalAfterDiscount: subtotal - discount });
  } catch (e) { next(e); }
});

app.post("/api/payments/razorpay/order", async (req, res, next) => {
  try {
    if (!razorpayKeyId || !razorpayKeySecret) {
      return res.status(503).json({ message: "Online payment is not configured." });
    }

    const totals = await orderTotals({ items: req.body.items, couponCode: req.body.couponCode });
    if (totals.total <= 0) return res.status(400).json({ message: "Order total must be greater than zero for online payment." });

    const receipt = `SAM${Date.now().toString().slice(-8)}`;
    const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString("base64");
    const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: Math.round(totals.total * 100),
        currency: razorpayCurrency,
        receipt,
        notes: {
          couponCode: req.body.couponCode || "",
          items: String(req.body.items?.length || 0)
        }
      })
    });
    const data = await razorpayRes.json().catch(() => ({}));
    if (!razorpayRes.ok) return res.status(502).json({ message: data.error?.description || "Could not start online payment." });

    pendingRazorpayOrders.set(data.id, { amount: data.amount, currency: data.currency, receipt, createdAt: Date.now() });
    res.status(201).json({ key: razorpayKeyId, order: data, amount: totals.total, currency: data.currency });
  } catch (e) { next(e); }
});

app.post("/api/admin/admins", auth(Role.ADMIN), async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const name = req.body.name?.trim();
    if (!email) return res.status(400).json({ message: "Admin email is required." });

    const existing = await prisma.user.findUnique({ where: { email } });
    const admin = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: { role: Role.ADMIN, ...(name ? { name } : {}) },
          select: { id: true, name: true, email: true, createdAt: true }
        })
      : await prisma.user.create({
          data: {
            name: name || fallbackNameFromEmail(email),
            email,
            password: await bcrypt.hash(randomPassword(), 12),
            role: Role.ADMIN
          },
          select: { id: true, name: true, email: true, createdAt: true }
        });

    await sendEmail({
      to: admin.email,
      subject: "Samruddhi admin access enabled",
      text: "Your Samruddhi admin access has been enabled. Use Staff login and verify with the OTP sent to this email.",
      html: "<p>Your Samruddhi admin access has been enabled.</p><p>Use <strong>Staff login</strong> and verify with the OTP sent to this email.</p>"
    });

    res.status(existing ? 200 : 201).json(adminUserShape(admin));
  } catch (e) { next(e); }
});

app.delete("/api/admin/admins/:id", auth(Role.ADMIN), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (id === req.auth.id) return res.status(400).json({ message: "You cannot remove your own admin access." });
    const remainingAdmins = await prisma.user.count({ where: { role: Role.ADMIN, id: { not: id } } });
    if (!remainingAdmins) return res.status(400).json({ message: "At least one admin must remain." });
    await prisma.user.update({ where: { id }, data: { role: Role.USER } });
    res.status(204).end();
  } catch (e) { next(e); }
});

app.post("/api/contact-submissions", async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    const phone = req.body.phone?.trim();

    if (!name || !phone) {
      return res.status(400).json({ message: "Name and phone number are required." });
    }

    const [submission] = await prisma.$queryRaw`
      INSERT INTO "ContactSubmission" (name, phone)
      VALUES (${name}, ${phone})
      RETURNING id, name, phone, "createdAt"
    `;
    res.status(201).json(submission);
  } catch (e) { next(e); }
});

app.get("/api/admin/contact-submissions", auth(Role.ADMIN), async (_req, res) => {
  res.json(await prisma.$queryRaw`
    SELECT id, name, phone, "createdAt"
    FROM "ContactSubmission"
    ORDER BY "createdAt" DESC
  `);
});

app.post("/api/uploads/image", auth(Role.ADMIN), async (req, res, next) => {
  try {
    const match = String(req.body.dataUrl || "").match(/^data:(image\/(png|jpe?g|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
    if (!match) return res.status(400).json({ message: "Choose a PNG, JPG, WEBP or GIF image file." });
    const buffer = Buffer.from(match[3], "base64");
    if (buffer.length > 10 * 1024 * 1024) return res.status(400).json({ message: "Image must be 10 MB or smaller." });
    await fs.mkdir(uploadsDir, { recursive: true });
    const ext = match[2].replace("jpeg", "jpg");
    const base = slugify(path.parse(req.body.filename || "hero-slide").name || "hero-slide", { lower: true, strict: true });
    const filename = `${Date.now()}-${base}.${ext}`;
    await fs.writeFile(path.join(uploadsDir, filename), buffer);
    res.status(201).json({ url: `/uploads/${filename}` });
  } catch (e) { next(e); }
});

app.get("/api/hero-slides", async (_req, res) => {
  const slides = await prisma.$queryRaw`
    SELECT h.id, h.eyebrow, h.title, h.body, h.link, h.cta, h.tone, h.image, h.highlights, h."categoryId", c.name AS "categoryName", c.slug AS "categorySlug", h."sortOrder", h.active, h."createdAt", h."updatedAt"
    FROM "HeroSlide" h
    LEFT JOIN "Category" c ON c.id = h."categoryId"
    WHERE h.active = true
    ORDER BY h."sortOrder" ASC, h."createdAt" ASC
  `;
  res.json(slides.map(heroSlideShape));
});
app.get("/api/admin/hero-slides", auth(Role.ADMIN), async (_req, res) => {
  const slides = await heroSlideRows();
  res.json(slides.map(heroSlideShape));
});
app.post("/api/admin/hero-slides", auth(Role.ADMIN), async (req, res, next) => {
  try {
    const data = heroSlideData(req.body);
    const error = requireHeroSlide(data);
    if (error) return res.status(400).json({ message: error });
    const [slide] = await prisma.$queryRaw`
      INSERT INTO "HeroSlide" (eyebrow, title, body, link, cta, tone, image, highlights, "categoryId", "sortOrder", active, "updatedAt")
      VALUES (${data.eyebrow}, ${data.title}, ${data.body}, ${data.link}, ${data.cta}, ${data.tone}, ${data.image}, ${data.highlights}, ${data.categoryId}, ${data.sortOrder}, ${data.active}, now())
      RETURNING id, eyebrow, title, body, link, cta, tone, image, highlights, "categoryId", "sortOrder", active, "createdAt", "updatedAt"
    `;
    const [created] = await heroSlideRows().then((rows) => rows.filter((row) => row.id === slide.id));
    res.status(201).json(heroSlideShape(created || slide));
  } catch (e) { next(e); }
});
app.put("/api/admin/hero-slides/:id", auth(Role.ADMIN), async (req, res, next) => {
  try {
    const data = heroSlideData(req.body);
    const error = requireHeroSlide(data);
    if (error) return res.status(400).json({ message: error });
    const [slide] = await prisma.$queryRaw`
      UPDATE "HeroSlide"
      SET eyebrow = ${data.eyebrow}, title = ${data.title}, body = ${data.body}, link = ${data.link}, cta = ${data.cta}, tone = ${data.tone}, image = ${data.image}, highlights = ${data.highlights}, "categoryId" = ${data.categoryId}, "sortOrder" = ${data.sortOrder}, active = ${data.active}, "updatedAt" = now()
      WHERE id = ${Number(req.params.id)}
      RETURNING id, eyebrow, title, body, link, cta, tone, image, highlights, "categoryId", "sortOrder", active, "createdAt", "updatedAt"
    `;
    const [updated] = slide ? await heroSlideRows().then((rows) => rows.filter((row) => row.id === slide.id)) : [];
    slide ? res.json(heroSlideShape(updated || slide)) : res.status(404).json({ message: "Record not found." });
  } catch (e) { next(e); }
});
app.delete("/api/admin/hero-slides/:id", auth(Role.ADMIN), async (req, res, next) => {
  try {
    await prisma.$executeRaw`DELETE FROM "HeroSlide" WHERE id = ${Number(req.params.id)}`;
    res.status(204).end();
  } catch (e) { next(e); }
});

app.post("/api/products/bulk-upload", auth(Role.ADMIN), async (req, res, next) => {
  try {
    const rows = importRowsFromUpload(req.body);
    const { readyRows, skippedRows, summary, preview } = await prepareBulkProducts(rows);
    const result = { created: 0, updated: 0, failed: 0, errors: [] };

    for (const row of readyRows) {
      try {
        if (!row.data.categoryId) throw new Error("Category could not be resolved.");
        const data = { ...row.data };
        if (row.existingId) {
          await prisma.product.update({ where: { id: row.existingId }, data });
          result.updated += 1;
        } else {
          await prisma.product.create({ data });
          result.created += 1;
        }
      } catch (e) {
        result.failed += 1;
        result.errors.push({ rowNumber: row.rowNumber, name: row.data.name, sku: row.data.sku, message: e.message || "Could not import row." });
      }
    }

    res.status(201).json({
      message: `Imported ${result.created} new products and updated ${result.updated} products.`,
      ...result,
      skipped: skippedRows.length,
      skippedRows: skippedRows.slice(0, 20),
      summary: { ...summary, created: result.created, updated: result.updated, failed: result.failed },
      preview
    });
  } catch (e) { next(e); }
});

app.get("/api/products", async (req, res) => {
  const { category, search, sort = "newest", featured } = req.query;
  const orderBy = sort === "price-low"
    ? { discountPrice: "asc" }
    : sort === "price-high"
    ? { discountPrice: "desc" }
    : sort === "bestsellers"
    ? { bestseller: "desc" }
    : sort === "name" || sort === "alpha"
    ? { name: "asc" }
    : { createdAt: "desc" };
  const products = await prisma.product.findMany({
    where: {
      active: true,
      ...(category ? { category: { slug: category } } : {}),
      ...(featured === "true" ? { featured: true } : {}),
      ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { shortDescription: { contains: search, mode: "insensitive" } }] } : {})
    }, include: { category: true }, orderBy
  });
  res.json(products.map(productShape));
});
app.get("/api/products/:slug", async (req, res) => {
  const product = await prisma.product.findFirst({ where: { slug: req.params.slug, active: true }, include: { category: true } });
  product ? res.json(productShape(product)) : res.status(404).json({ message: "Product not found." });
});
app.post("/api/products", auth(Role.ADMIN), async (req, res, next) => {
  try {
    const data = productData(req.body);
    const error = requireProduct(data);
    if (error) return res.status(400).json({ message: error });
    const product = await prisma.product.create({ data, include: { category: true } });
    res.status(201).json(productShape(product));
  } catch (e) { next(e); }
});
app.put("/api/products/:id", auth(Role.ADMIN), async (req, res, next) => {
  try {
    const data = productData(req.body);
    const error = requireProduct(data);
    if (error) return res.status(400).json({ message: error });
    const product = await prisma.product.update({ where: { id: Number(req.params.id) }, data, include: { category: true } });
    res.json(productShape(product));
  } catch (e) { next(e); }
});
app.delete("/api/products/:id", auth(Role.ADMIN), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const orderItems = await prisma.orderItem.count({ where: { productId: id } });
    if (orderItems > 0) {
      await prisma.product.update({ where: { id }, data: { active: false, featured: false, bestseller: false, stock: 0 } });
      return res.json({ message: "Product is used by orders, so it was archived instead of deleted." });
    }
    await prisma.product.delete({ where: { id } });
    res.status(204).end();
  } catch (e) { next(e); }
});

app.post("/api/orders", async (req, res, next) => {
  try {
    const { customer, items, paymentMethod = "COD", couponCode, razorpay } = req.body;
    const method = paymentMethod === "ONLINE" ? "ONLINE" : "COD";
    const { rows, subtotal, delivery, coupon, discount, total } = await orderTotals({ items, couponCode });

    if (method === "ONLINE") {
      if (!verifyRazorpayPayment(razorpay || {})) return res.status(400).json({ message: "Online payment verification failed." });
      const pending = pendingRazorpayOrders.get(razorpay.razorpay_order_id);
      if (!pending || pending.amount !== Math.round(total * 100)) return res.status(400).json({ message: "Online payment amount does not match this order." });
      pendingRazorpayOrders.delete(razorpay.razorpay_order_id);
    }

    let userId = null;
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token) try { userId = jwt.verify(token, secret).id; } catch {}
    const order = await prisma.$transaction(async (tx) => {
      for (const row of rows) await tx.product.update({ where: { id: row.productId }, data: { stock: { decrement: row.quantity } } });
      if (coupon) await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
      return tx.order.create({ data: { orderNumber: `SAM${Date.now().toString().slice(-8)}`, userId, ...customer, paymentMethod: method, subtotal, delivery, ...(coupon ? { discount, couponCode: coupon.code, couponId: coupon.id } : {}), total, items: { create: rows } }, include: { items: true } });
    });

    await sendEmail({
      to: customer.email,
      subject: `Order ${order.orderNumber} confirmed`,
      text: `Your Samruddhi order ${order.orderNumber} has been placed successfully.`,
      html: `<p>Your Samruddhi order <strong>${order.orderNumber}</strong> has been placed successfully.</p>`
    });

    res.status(201).json(order);
  } catch (e) { next(e); }
});
app.get("/api/orders/mine", auth(), async (req, res) => res.json(await prisma.order.findMany({ where: { userId: req.auth.id }, include: { items: { include: { product: { select: { slug: true, image: true, sku: true } } } } }, orderBy: { createdAt: "desc" } })));
app.get("/api/orders", auth(Role.ADMIN), async (_req, res) => res.json(await prisma.order.findMany({ include: { items: { include: { product: { select: { slug: true, image: true, sku: true } } } }, user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" } })));
app.patch("/api/orders/:id/status", auth(Role.ADMIN), async (req, res) => res.json(await prisma.order.update({ where: { id: Number(req.params.id) }, data: { status: req.body.status } })));

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === "P2002") return res.status(409).json({ message: "A record with this name or slug already exists." });
  if (err.code === "P2003") return res.status(409).json({ message: "This record is used by orders or products and cannot be deleted." });
  if (err.code === "P2025") return res.status(404).json({ message: "Record not found." });
  res.status(500).json({ message: err.message || "Something went wrong." });
});
ensureDatabaseShape()
  .then(() => app.listen(port, () => console.log(`Samruddhi API running on http://localhost:${port}`)))
  .catch((err) => {
    console.error("Database setup failed", err);
    process.exit(1);
  });
