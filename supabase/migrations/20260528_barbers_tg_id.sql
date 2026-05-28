-- Link barbers to their Telegram accounts for role-based routing.
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS tg_id bigint UNIQUE;
