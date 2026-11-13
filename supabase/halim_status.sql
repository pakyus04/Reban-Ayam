-- Status langsung Halim. Jalankan sekali di Supabase (SQL Editor).
create table if not exists public.halim_status (
  id int primary key default 1 check (id = 1),
  status text not null default 'santai' check (status in ('santai','bekerja','siap','amaran')),
  message text not null default '',
  updated_at timestamptz not null default now()
);
insert into public.halim_status (id) values (1) on conflict do nothing;

-- Rahsia tulis: jadual ini tiada polisi, jadi tidak boleh dibaca daripada website.
create table if not exists public.halim_secret (
  id int primary key default 1 check (id = 1),
  secret text not null default gen_random_uuid()::text
);
insert into public.halim_secret (id) values (1) on conflict do nothing;
alter table public.halim_secret enable row level security;

alter table public.halim_status enable row level security;
drop policy if exists "baca status" on public.halim_status;
create policy "baca status" on public.halim_status for select to anon using (true);

-- Hermes menulis status melalui fungsi ini sahaja, dengan rahsia.
create or replace function public.set_halim_status(p_secret text, p_status text, p_message text default '')
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_secret is distinct from (select secret from public.halim_secret where id = 1) then
    raise exception 'rahsia salah';
  end if;
  update public.halim_status
     set status = p_status, message = left(coalesce(p_message,''), 200), updated_at = now()
   where id = 1;
end $$;
revoke all on function public.set_halim_status(text,text,text) from public;
grant execute on function public.set_halim_status(text,text,text) to anon;
