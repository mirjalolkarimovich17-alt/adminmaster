-- Add slug and theme_color columns to barbershops
ALTER TABLE barbershops 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#ffcc00',
ADD COLUMN IF NOT EXISTS logo TEXT;

-- Generate slugs for existing salons
UPDATE barbershops 
SET slug = LOWER(REPLACE(name, ' ', '-')) || '-' || id
WHERE slug IS NULL;
