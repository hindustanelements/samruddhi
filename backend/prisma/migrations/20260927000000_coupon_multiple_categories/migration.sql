ALTER TABLE "Coupon" ADD COLUMN "categoryIds" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];

UPDATE "Coupon"
SET "categoryIds" = ARRAY["categoryId"]
WHERE "categoryId" IS NOT NULL;

ALTER TABLE "Coupon" DROP CONSTRAINT "Coupon_categoryId_fkey";
ALTER TABLE "Coupon" DROP COLUMN "categoryId";