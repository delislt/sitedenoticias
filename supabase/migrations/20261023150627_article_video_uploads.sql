-- Add MP4 to the existing private editorial-media bucket. No article rows,
-- ownership rules, visibility policies, or existing files are changed.
update storage.buckets
set allowed_mime_types = array_append(allowed_mime_types, 'video/mp4')
where id = 'sis-images'
  and not allowed_mime_types @> array['video/mp4'];
