-- Create users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  nome text,
  email text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create queries table
create table public.queries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  lista_texto text,
  ocr_image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create products table
create table public.products (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  preco decimal(10,2) not null,
  mercado text not null,
  marca text,
  link text,
  query_id uuid references public.queries(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create comparisons table
create table public.comparisons (
  id uuid default gen_random_uuid() primary key,
  query_id uuid references public.queries(id) on delete cascade not null,
  item text not null,
  preco_atacadao decimal(10,2),
  preco_tenda decimal(10,2),
  melhor_opcao text,
  economia decimal(10,2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better performance
create index queries_user_id_idx on public.queries(user_id);
create index queries_created_at_idx on public.queries(created_at desc);
create index products_query_id_idx on public.products(query_id);
create index comparisons_query_id_idx on public.comparisons(query_id);

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.queries enable row level security;
alter table public.products enable row level security;
alter table public.comparisons enable row level security;

-- RLS Policies for users table
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- RLS Policies for queries table
create policy "Users can view own queries"
  on public.queries for select
  using (auth.uid() = user_id);

create policy "Users can insert own queries"
  on public.queries for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own queries"
  on public.queries for delete
  using (auth.uid() = user_id);

-- RLS Policies for products table
create policy "Users can view products from own queries"
  on public.products for select
  using (
    exists (
      select 1 from public.queries
      where queries.id = products.query_id
      and queries.user_id = auth.uid()
    )
  );

create policy "Users can insert products for own queries"
  on public.products for insert
  with check (
    exists (
      select 1 from public.queries
      where queries.id = products.query_id
      and queries.user_id = auth.uid()
    )
  );

-- RLS Policies for comparisons table
create policy "Users can view comparisons from own queries"
  on public.comparisons for select
  using (
    exists (
      select 1 from public.queries
      where queries.id = comparisons.query_id
      and queries.user_id = auth.uid()
    )
  );

create policy "Users can insert comparisons for own queries"
  on public.comparisons for insert
  with check (
    exists (
      select 1 from public.queries
      where queries.id = comparisons.query_id
      and queries.user_id = auth.uid()
    )
  );

-- Function to create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, nome)
  values (new.id, new.email, new.raw_user_meta_data->>'nome');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create user profile automatically
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

