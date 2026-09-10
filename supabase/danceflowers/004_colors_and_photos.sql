-- Dance Flowers: color picks and dress/tie photos on orders.
-- Paste into the SQL editor and run. Safe to re-run.

-- 1. Columns.
alter table public.orders add column if not exists color_picks text[] not null default '{}';
alter table public.orders add column if not exists photos      text[] not null default '{}';   -- storage paths in bucket order-photos

-- 2. Storage bucket. Public read at unguessable paths (uploads/<uuid>/<uuid>.jpg) so the email links work
--    without a login. Nobody can list the bucket. 8 MB cap, images only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('order-photos', 'order-photos', true, 8388608, array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "anon upload order photos"   on storage.objects;
drop policy if exists "staff read order photos"    on storage.objects;
drop policy if exists "staff delete order photos"  on storage.objects;
create policy "anon upload order photos" on storage.objects for insert to anon
  with check (bucket_id = 'order-photos' and (storage.foldername(name))[1] = 'uploads');
create policy "staff read order photos" on storage.objects for select to authenticated
  using (bucket_id = 'order-photos');
create policy "staff delete order photos" on storage.objects for delete to authenticated
  using (bucket_id = 'order-photos');

-- 3. Allowed color names. Must match COLORS in danceflowers/index.html.
create or replace function public.allowed_colors() returns text[]
language sql immutable as $$
  select array['White','Ivory','Blush','Pink','Hot pink','Red','Burgundy','Coral','Peach','Orange','Yellow','Lavender',
               'Purple','Light blue','Dusty blue','Royal blue','Navy','Emerald','Sage','Teal','Black','Silver','Gold']
$$;

-- 4. place_order with the two new fields.
create or replace function public.place_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_items   jsonb := coalesce(payload->'items', '{}'::jsonb);
  v_total   numeric(8,2) := 0;
  v_count   int := 0;
  r         record;
  v_qty     int;
  v_row     public.orders;
  v_today   date := (now() at time zone 'America/Boise')::date;
  v_min     date := v_today + 5;
  v_colors  text[] := '{}';
  v_photos  text[] := '{}';
  v_s       text;
begin
  for r in select key, price from public.products where active loop
    v_qty := coalesce((v_items->>r.key)::int, 0);
    if v_qty < 0 or v_qty > 50 then raise exception 'Quantity out of range for %', r.key; end if;
    v_total := v_total + v_qty * r.price;
    v_count := v_count + v_qty;
  end loop;
  if v_count = 0 then raise exception 'Add at least one item'; end if;

  if coalesce(trim(payload->>'name'), '')       = '' then raise exception 'Name is required'; end if;
  if coalesce(trim(payload->>'phone'), '')      = '' then raise exception 'Phone is required'; end if;
  if coalesce(trim(payload->>'event_type'), '') = '' then raise exception 'Event is required'; end if;
  if (payload->>'event_date') is null              then raise exception 'Event date is required'; end if;
  if (payload->>'event_date')::date < v_min then
    raise exception 'I need at least 5 days'' notice. The earliest date I can take is %.', to_char(v_min, 'FMDay, FMMonth FMDD');
  end if;

  -- Colors: only names from the list, no duplicates, at most 8.
  if jsonb_typeof(payload->'color_picks') = 'array' then
    for v_s in select distinct value from jsonb_array_elements_text(payload->'color_picks') loop
      if v_s = any(allowed_colors()) then v_colors := v_colors || v_s; end if;
    end loop;
    v_colors := v_colors[1:8];
  end if;

  -- Photos: storage paths the page just uploaded, at most 3, shape checked.
  if jsonb_typeof(payload->'photos') = 'array' then
    for v_s in select value from jsonb_array_elements_text(payload->'photos') loop
      if v_s ~ '^uploads/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$' then v_photos := v_photos || v_s; end if;
    end loop;
    v_photos := v_photos[1:3];
  end if;

  insert into public.orders (items, total, event_type, event_date, colors, color_picks, photos, name, phone, email, notes, page, ua)
  values (
    v_items, v_total,
    left(trim(payload->>'event_type'), 60),
    (payload->>'event_date')::date,
    left(payload->>'colors', 2000),
    v_colors, v_photos,
    left(trim(payload->>'name'), 120),
    left(trim(payload->>'phone'), 40),
    nullif(left(trim(payload->>'email'), 200), ''),
    left(payload->>'notes', 2000),
    left(payload->>'page', 300),
    left(payload->>'ua', 400)
  )
  returning * into v_row;

  return jsonb_build_object(
    'order_number', v_row.order_number,
    'token',        v_row.public_token,
    'total',        v_row.total,
    'name',         v_row.name
  );
end $$;

-- 5. Public URL for a stored photo.
create or replace function public.photo_url(p_path text) returns text
language sql stable as $$
  select 'https://mmxgxnrovxfpcsfzdzfn.supabase.co/storage/v1/object/public/order-photos/' || p_path
$$;

-- 6. Leah's email now shows the color picks and photo thumbnails.
create or replace function public.staff_order_email(o public.orders, p_kind text) returns text
language plpgsql stable set search_path = public as $$
declare
  v_lead   text;
  v_colors text := '';
  v_photos text := '';
begin
  v_lead := case p_kind
    when 'new'          then 'New order just came in.'
    when 'payment_sent' then format('%s says they sent $%s on Venmo. Check Venmo, then mark it Paid.', esc(o.name), to_char(o.total, 'FM9999990.00'))
    else '' end;
  if array_length(o.color_picks, 1) > 0 then
    v_colors := '<p style="margin:10px 0 0"><b>Colors picked</b><br>' || esc(array_to_string(o.color_picks, ', ')) || '</p>';
  end if;
  if array_length(o.photos, 1) > 0 then
    select '<p style="margin:10px 0 4px"><b>Photos</b></p><p style="margin:0">' ||
           string_agg(format('<a href="%s"><img src="%s" width="140" style="width:140px;height:140px;object-fit:cover;border-radius:4px;border:1px solid #E6DCD3;margin:0 8px 8px 0" alt="photo"></a>', photo_url(ph), photo_url(ph)), '') || '</p>'
      into v_photos
      from unnest(o.photos) as ph;
  end if;
  return format($h$
<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:#2B2320;max-width:560px">
  <p style="margin:0 0 14px">%s</p>
  <h2 style="margin:0 0 4px;font-size:22px">Order #%s · %s</h2>
  <p style="margin:0 0 14px;color:#5C514C"><b>%s</b> on %s (%s)</p>
  <table style="border-collapse:collapse;font-size:16px;margin:0 0 6px">%s
    <tr><td style="padding:8px 12px 0 0;border-top:1px solid #E6DCD3"><b>Total</b></td><td style="padding:8px 0 0;border-top:1px solid #E6DCD3;text-align:right"><b>$%s</b></td></tr>
  </table>
  <p style="margin:14px 0 4px"><b>Contact</b><br>%s<br><a href="sms:%s">Text %s</a> · <a href="tel:%s">Call</a>%s</p>
  %s%s%s%s
  <p style="margin:18px 0 0"><a href="%s" style="display:inline-block;background:#B2495C;color:#fff;text-decoration:none;font-weight:600;padding:10px 16px;border-radius:4px">Open the order list</a></p>
</div>$h$,
    v_lead,
    o.order_number, esc(o.name),
    esc(o.event_type), to_char(o.event_date, 'Dy Mon FMDD'), case when o.event_date - current_date = 0 then 'today' when o.event_date - current_date = 1 then 'tomorrow' else 'in ' || (o.event_date - current_date) || ' days' end,
    order_items_html(o.items), to_char(o.total, 'FM9999990.00'),
    esc(o.name), regexp_replace(o.phone, '[^0-9+]', '', 'g'), esc(o.phone), regexp_replace(o.phone, '[^0-9+]', '', 'g'),
    case when o.email is not null then ' · <a href="mailto:' || esc(o.email) || '">' || esc(o.email) || '</a>' else '' end,
    v_colors,
    v_photos,
    case when coalesce(o.colors, '') <> '' then '<p style="margin:10px 0 0"><b>About colors</b><br>' || esc(o.colors) || '</p>' else '' end,
    case when coalesce(o.notes, '')  <> '' then '<p style="margin:10px 0 0"><b>Their notes</b><br>' || esc(o.notes) || '</p>' else '' end,
    setting('admin_url')
  );
end $$;
