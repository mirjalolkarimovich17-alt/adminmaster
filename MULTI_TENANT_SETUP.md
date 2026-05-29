# Multi-Tenant Deploy Qo'llanmasi

## Arxitektura

Bitta GitHub repo → har salon uchun alohida Vercel project.
Faqat `VITE_TENANT_ID` env variable farq qiladi.

## Yangi Salon Qo'shish (Qadamlar)

### 1. SuperAdmin panelida salon yaratish
- `/superadmin` ga kiring
- "Yangi Salon" tugmasini bosing
- Salon nomi va egasining Telegram ID sini kiriting
- Yaratilgandan keyin **TENANT_ID (UUID)** ni nusxa oling

### 2. Vercel da yangi project yaratish
1. vercel.com → "Add New Project"
2. Shu GitHub reponi import qiling
3. **Environment Variables** ga qo'shing:
   ```
   VITE_SUPABASE_URL      = (bir xil barcha salonlar uchun)
   VITE_SUPABASE_ANON_KEY = (bir xil barcha salonlar uchun)
   VITE_TENANT_ID         = <nusxa olingan UUID>
   ```
4. Deploy qiling → Vercel URL oling

### 3. Telegram Bot sozlash
1. @BotFather da yangi bot yarating
2. `/newapp` → Mini App URL ga Vercel URL ni kiriting
3. Salon egasiga bot linkini yuboring

### 4. Salon egasini belgilash
Supabase SQL Editor:
```sql
UPDATE barbershops SET owner_tg_id = <tg_id> WHERE id = '<uuid>';
```

---

## Rollar

| Rol | Yo'l | Kirish |
|-----|------|--------|
| SuperAdmin | `/superadmin` | Hardcoded TG ID |
| Owner (salon egasi) | `/owner` | `barbershops.owner_tg_id` |
| Barber | `/barber` | `barbers.tg_id` |
| Client | `/client` | Barchaga |

## Hozirgi Salonlar

| Salon | TENANT_ID | Owner TG ID |
|-------|-----------|-------------|
| Barbershop 23 | ae478bfc-b1e2-419d-a306-572da573461f | 6713025920 |
