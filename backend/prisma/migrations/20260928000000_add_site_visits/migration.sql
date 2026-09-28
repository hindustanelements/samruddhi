CREATE TABLE "SiteVisit" (
    "id"        SERIAL PRIMARY KEY,
    "path"      TEXT NOT NULL,
    "ipHash"    TEXT NOT NULL,
    "device"    TEXT,
    "browser"   TEXT,
    "country"   TEXT,
    "city"      TEXT,
    "referrer"  TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "SiteVisit_createdAt_idx" ON "SiteVisit"("createdAt");
CREATE INDEX "SiteVisit_ipHash_idx" ON "SiteVisit"("ipHash");
