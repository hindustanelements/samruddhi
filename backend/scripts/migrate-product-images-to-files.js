import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import slugify from "slugify";
import prismaPackage from "@prisma/client";

const { PrismaClient } = prismaPackage;

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");
const uploadsDir = process.env.UPLOADS_DIR ? path.resolve(process.env.UPLOADS_DIR) : path.join(publicDir, "uploads");
const dryRun = process.argv.includes("--dry-run");
const batchSize = Number(process.env.IMAGE_MIGRATION_BATCH_SIZE || 10);

const imageFromDataUrl = (dataUrl) => {
  const match = String(dataUrl || "").match(/^data:(image\/(png|jpe?g|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) return null;
  const ext = match[2].replace("jpeg", "jpg");
  const buffer = Buffer.from(match[3].replace(/\s/g, ""), "base64");
  return { ext, buffer };
};

const filenameForProduct = (product, ext, buffer) => {
  const name = slugify(product.name || "product", { lower: true, strict: true }) || "product";
  const hash = crypto.createHash("sha1").update(buffer).digest("hex").slice(0, 10);
  return `${Date.now()}-${product.id}-${name}-${hash}.${ext}`;
};

const migrateBatch = async () => {
  const products = await prisma.product.findMany({
    where: { image: { startsWith: "data:image/" } },
    select: { id: true, name: true, image: true },
    orderBy: { id: "asc" },
    take: batchSize
  });

  let migrated = 0;
  let skipped = 0;

  for (const product of products) {
    const image = imageFromDataUrl(product.image);
    if (!image) {
      skipped += 1;
      console.log(`Skipped product ${product.id}: image is not a supported data URL`);
      continue;
    }

    const filename = filenameForProduct(product, image.ext, image.buffer);
    const uploadPath = path.join(uploadsDir, filename);
    const publicUrl = `/uploads/${filename}`;

    console.log(`${dryRun ? "Would migrate" : "Migrating"} product ${product.id}: ${product.name} -> ${publicUrl}`);

    if (!dryRun) {
      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.writeFile(uploadPath, image.buffer, { flag: "wx" });
      await prisma.product.update({
        where: { id: product.id },
        data: { image: publicUrl }
      });
    }

    migrated += 1;
  }

  return { fetched: products.length, migrated, skipped };
};

try {
  let totalMigrated = 0;
  let totalSkipped = 0;

  while (true) {
    const result = await migrateBatch();
    totalMigrated += result.migrated;
    totalSkipped += result.skipped;
    if (dryRun || result.fetched < batchSize) break;
  }

  console.log(`${dryRun ? "Dry run complete" : "Migration complete"}: ${totalMigrated} product images ${dryRun ? "found" : "migrated"}, ${totalSkipped} skipped.`);
} catch (error) {
  console.error("Product image migration failed:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
