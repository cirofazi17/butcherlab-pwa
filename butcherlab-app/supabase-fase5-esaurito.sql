-- Esegui una sola volta nel Supabase SQL Editor.
-- Aggiunge lo stato disponibile/esaurito ai prodotti.

alter table public.prodotti
add column if not exists available boolean not null default true;

update public.prodotti
set available = true
where available is null;
