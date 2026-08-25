-- Bucket de fotos. Privat: les fotos ensenyen l'interior de casa i el que hi ha
-- de valor a dins. S'hi accedeix sempre amb URL signada de durada curta.
--
-- Convenció de ruta:  <household_id>/items/<uuid>.webp
--                     <household_id>/locations/<uuid>.webp
-- La primera carpeta és el household_id, i és el que verifiquen les polítiques.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fotos', 'fotos', false,
  5242880,                                                   -- 5 MB
  array['image/webp', 'image/jpeg', 'image/png', 'image/heic']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy fotos_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = (select private.current_household_id())::text
  );

create policy fotos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = (select private.current_household_id())::text
  );

create policy fotos_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = (select private.current_household_id())::text
  );

create policy fotos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = (select private.current_household_id())::text
  );

-- storage.objects viu a l'esquema storage, on private.* no és al search_path per
-- defecte del rol authenticated; per això la crida va sempre qualificada.
grant usage on schema private to authenticated;
