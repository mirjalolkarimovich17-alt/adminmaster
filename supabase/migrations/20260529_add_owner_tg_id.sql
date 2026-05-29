-- barbershops jadvaliga owner_tg_id ustuni qo'shish
ALTER TABLE barbershops ADD COLUMN IF NOT EXISTS owner_tg_id bigint;

-- 23-salon egasini belgilash
-- Avval salonning UUID sini toping: SELECT id, name FROM barbershops;
-- Keyin quyidagi UPDATE ni ishga tushiring (UUID ni o'zgartiring):
-- UPDATE barbershops SET owner_tg_id = 6713025920 WHERE id = '<salon-uuid-here>';

-- Yoki salon nomi bo'yicha (agar nomi ma'lum bo'lsa):
-- UPDATE barbershops SET owner_tg_id = 6713025920 WHERE name = 'Salon nomi';
