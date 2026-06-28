-- Run this in Supabase SQL Editor to add UPC/GTIN/WPID columns
-- to the walmart_product_catalog table

ALTER TABLE walmart_product_catalog
  ADD COLUMN IF NOT EXISTS upc  TEXT,
  ADD COLUMN IF NOT EXISTS gtin TEXT,
  ADD COLUMN IF NOT EXISTS wpid TEXT;

-- Index for fast barcode lookups
CREATE INDEX IF NOT EXISTS idx_wpc_upc  ON walmart_product_catalog (user_id, upc);
CREATE INDEX IF NOT EXISTS idx_wpc_gtin ON walmart_product_catalog (user_id, gtin);
