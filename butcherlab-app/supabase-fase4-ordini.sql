-- Esegui questo comando una sola volta nel SQL Editor di Supabase.
-- Aggiunge il comando manuale per sospendere o riattivare gli ordini online.

alter table public.site_settings
add column if not exists orders_enabled boolean not null default true;
