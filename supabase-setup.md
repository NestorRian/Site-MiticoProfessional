# Supabase Setup

## 1) Criar projeto
- Crie um projeto no Supabase.
- Em "Project Settings > API", copie:
  - Project URL
  - anon public key

## 2) Configurar o admin
- No arquivo `script.js`, atualize:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `ADMIN_EMAIL`

## 3) Criar tabela e politicas
Rode no SQL Editor:

```sql
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null,
  discount_percent numeric(5,2) default 0,
  stock_quantity integer default 0,
  category text,
  image_urls jsonb default '[]'::jsonb,
  image_url text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  product_id uuid,
  product_name text,
  visitor_hash text,
  country text,
  page_url text,
  created_at timestamptz default now()
);

alter table public.products
add column if not exists discount_percent numeric(5,2) default 0;

alter table public.products
add column if not exists stock_quantity integer default 0;

alter table public.products
add column if not exists category text;

alter table public.products
add column if not exists image_urls jsonb default '[]'::jsonb;

update public.products
set discount_percent = 0
where discount_percent is null;

update public.products
set stock_quantity = 0
where stock_quantity is null;

update public.products
set category = 'Tratamento'
where category is null;

update public.products
set image_urls = '[]'::jsonb
where image_urls is null;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_products_updated_at on public.products;

create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

alter table public.products enable row level security;

alter table public.analytics_events enable row level security;

drop policy if exists "Public read" on public.products;
drop policy if exists "Admin insert" on public.products;
drop policy if exists "Admin update" on public.products;
drop policy if exists "Admin delete" on public.products;
drop policy if exists "Analytics insert" on public.analytics_events;
drop policy if exists "Admin read analytics" on public.analytics_events;

create policy "Public read"
on public.products
for select
using (true);

create policy "Admin insert"
on public.products
for insert
with check (lower(auth.jwt()->>'email') = 'miticoprofissional@gmail.com');

create policy "Admin update"
on public.products
for update
using (lower(auth.jwt()->>'email') = 'miticoprofissional@gmail.com');

create policy "Admin delete"
on public.products
for delete
using (lower(auth.jwt()->>'email') = 'miticoprofissional@gmail.com');

create policy "Analytics insert"
on public.analytics_events
for insert
with check (true);

create policy "Admin read analytics"
on public.analytics_events
for select
using (lower(auth.jwt()->>'email') = 'miticoprofissional@gmail.com');

-- Storage (bucket para imagens)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read images" on storage.objects;
drop policy if exists "Admin upload images" on storage.objects;
drop policy if exists "Admin update images" on storage.objects;
drop policy if exists "Admin delete images" on storage.objects;

create policy "Public read images"
on storage.objects
for select
using (bucket_id = 'product-images');

create policy "Admin upload images"
on storage.objects
for insert
with check (bucket_id = 'product-images' and lower(auth.jwt()->>'email') = 'miticoprofissional@gmail.com');

create policy "Admin update images"
on storage.objects
for update
using (bucket_id = 'product-images' and lower(auth.jwt()->>'email') = 'miticoprofissional@gmail.com');

create policy "Admin delete images"
on storage.objects
for delete
using (bucket_id = 'product-images' and lower(auth.jwt()->>'email') = 'miticoprofissional@gmail.com');
```

Substitua `MiticoProfissional@gmail.com` pelo mesmo email do `ADMIN_EMAIL`.

## 4) Storage para imagens
Crie o bucket publico `product-images` e as politicas abaixo:

```sql
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Public read images"
on storage.objects
for select
using (bucket_id = 'product-images');

create policy "Admin upload images"
on storage.objects
for insert
with check (bucket_id = 'product-images' and lower(auth.jwt()->>'email') = 'miticoprofissional@gmail.com');

create policy "Admin update images"
on storage.objects
for update
using (bucket_id = 'product-images' and lower(auth.jwt()->>'email') = 'miticoprofissional@gmail.com');

create policy "Admin delete images"
on storage.objects
for delete
using (bucket_id = 'product-images' and lower(auth.jwt()->>'email') = 'miticoprofissional@gmail.com');
```

## 5) Criar usuario admin
- No Supabase Auth, crie um usuario com o email do `ADMIN_EMAIL`.
- Use essa senha no painel do site.

## 6) Publicar
- Publique no Netlify normalmente.
- O front-end vai ler os produtos do Supabase e o admin vai gerenciar.

## 7) Dashboard GA4 (dados reais)
Para o painel usar dados do Google Analytics:

1) No Google Cloud:
- Crie/seleciona um projeto.
- Ative a **Google Analytics Data API**.
- Crie uma **Service Account** e copie:
  - `client_email`
  - `private_key`

2) No GA4:
- Admin > **Gerenciamento de acesso** da propriedade.
- Adicione a Service Account como **Viewer**.
- Pegue o **Property ID** (Admin > Configuracoes da propriedade).

3) No Supabase (secrets):
```bash
supabase secrets set \
  GA4_PROPERTY_ID="SEU_PROPERTY_ID" \
  GA4_CLIENT_EMAIL="SEU_CLIENT_EMAIL" \
  GA4_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE\n-----END PRIVATE KEY-----" \
  ADMIN_EMAIL="miticoprofissional@gmail.com"
```

4) Publicar a function:
```bash
supabase functions deploy ga4-dashboard
```

Pronto. O dashboard vai buscar os dados reais do GA4.

