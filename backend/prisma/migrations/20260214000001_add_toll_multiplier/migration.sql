-- Add toll multiplier to vehicle types for accurate toll cost calculation
ALTER TABLE "vehicle_types" ADD COLUMN "tollMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0;

-- Set default toll multipliers for existing vehicle types
UPDATE "vehicle_types" SET "tollMultiplier" = 2.5 WHERE "slug" = 'vrachtwagen';
UPDATE "vehicle_types" SET "tollMultiplier" = 2.0 WHERE "slug" = 'motorwagen';
UPDATE "vehicle_types" SET "tollMultiplier" = 1.0 WHERE "slug" = 'bestelbus';
UPDATE "vehicle_types" SET "tollMultiplier" = 2.5 WHERE "slug" = 'koelwagen';
UPDATE "vehicle_types" SET "tollMultiplier" = 3.5 WHERE "slug" = 'dieplader';
