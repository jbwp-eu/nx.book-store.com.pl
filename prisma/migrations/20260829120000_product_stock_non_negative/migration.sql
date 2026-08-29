-- Fix existing negative stock before adding constraint
UPDATE "Product" SET stock = 0 WHERE stock < 0;

ALTER TABLE "Product" ADD CONSTRAINT "Product_stock_non_negative" CHECK (stock >= 0);
