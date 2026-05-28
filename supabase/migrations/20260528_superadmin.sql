-- SuperAdmin registry: only Telegram IDs listed here get superadmin access.
CREATE TABLE IF NOT EXISTS superadmin (
    tg_id   bigint PRIMARY KEY,
    note    text
);
