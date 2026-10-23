-- Increase media limits without changing any article or existing file.
alter table public.media_assets drop constraint media_assets_bytes_check;
alter table public.media_assets add constraint media_assets_bytes_check
  check (bytes between 1 and case
    when mime = 'video/mp4' then 31457280
    when mime = 'image/webp' then 15728640
    else 4194304 end);
update storage.buckets
set file_size_limit = 31457280,
    allowed_mime_types = allowed_mime_types || array['image/jpeg', 'image/png']
where id = 'sis-images';
