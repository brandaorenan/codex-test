-- Create storage bucket for shopping list images
insert into storage.buckets (id, name, public)
values ('lista-compras', 'lista-compras', false);

-- RLS Policies for storage
create policy "Users can upload own images"
  on storage.objects for insert
  with check (
    bucket_id = 'lista-compras' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view own images"
  on storage.objects for select
  using (
    bucket_id = 'lista-compras' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own images"
  on storage.objects for delete
  using (
    bucket_id = 'lista-compras' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

