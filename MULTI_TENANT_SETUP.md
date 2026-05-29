# Multi-Tenant Salon Setup Guide

## 1. Database Migration

Run this SQL in Supabase SQL Editor:

```sql
ALTER TABLE barbershops 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#ffcc00',
ADD COLUMN IF NOT EXISTS logo TEXT;

UPDATE barbershops 
SET slug = LOWER(REPLACE(name, ' ', '-')) || '-' || id
WHERE slug IS NULL;
```

## 2. Add New Salon

In Supabase `barbershops` table, insert:

| Column | Value |
|--------|-------|
| `name` | "Ali Sartaroshxona" |
| `slug` | `ali-sartaroshxona-123` (unique) |
| `theme_color` | `#ffcc00` (gold) |
| `logo` | `https://example.com/logo.png` (optional) |
| `is_active` | `true` |
| `subscription_plan_id` | (existing plan ID) |

## 3. Access Salon

Open in Telegram Mini App:
```
https://your-app.com/client/ali-sartaroshxona-123
```

Or via bot link:
```
t.me/yourbot?start=ali-sartaroshxona-123
```

## 4. Configure Salon

Each salon has:
- **Unique URL:** `/client/{slug}`
- **Custom logo** (from `barbershops.logo`)
- **Custom theme color** (from `barbershops.theme_color`)
- **Own barbers & services** (filtered by `tenant_id`)

## 5. SuperAdmin Panel

Still at: `/superadmin`

Manages all salons, plans, and limits.
