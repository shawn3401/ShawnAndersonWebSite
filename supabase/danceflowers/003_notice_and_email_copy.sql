-- Dance Flowers: 5-day minimum notice, and softer wording in the customer email.
-- Paste into the SQL editor and run. Safe to re-run.

-- place_order: same as before plus the date rule. Idaho time so a late-night order counts the right day.
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

  insert into public.orders (items, total, event_type, event_date, colors, name, phone, email, notes, page, ua)
  values (
    v_items, v_total,
    left(trim(payload->>'event_type'), 60),
    (payload->>'event_date')::date,
    left(payload->>'colors', 2000),
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

-- Customer email: the Venmo button is a backup, not a request.
create or replace function public.customer_order_email(o public.orders) returns text
language plpgsql stable set search_path = public as $$
declare
  v_venmo text := format('https://venmo.com/%s?txn=pay&amount=%s&note=%s', setting('venmo_user'), to_char(o.total, 'FM9999990.00'), 'Dance%20Flowers%20order%20%23' || o.order_number);
begin
  return format($h$
<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:#2B2320;max-width:560px">
  <p style="margin:0 0 14px">Got it, %s. You're order #%s. I'll text you at %s within a day to confirm the details and set a pickup time.</p>
  <table style="border-collapse:collapse;font-size:16px;margin:0 0 6px">%s
    <tr><td style="padding:8px 12px 0 0;border-top:1px solid #E6DCD3"><b>Total</b></td><td style="padding:8px 0 0;border-top:1px solid #E6DCD3;text-align:right"><b>$%s</b></td></tr>
  </table>
  <p style="margin:18px 0 6px"><b>Payment.</b> If you already sent it on Venmo from the order page, you're all set and can ignore the button below. If you haven't yet, it's here whenever you're ready, and cash at pickup is fine too.</p>
  <p style="margin:0 0 18px"><a href="%s" style="display:inline-block;background:#B2495C;color:#fff;text-decoration:none;font-weight:600;padding:10px 16px;border-radius:4px">Pay $%s on Venmo (@%s)</a></p>
  <p style="margin:0;color:#5C514C;font-size:14px">If plans change, text me at 208-403-7323 as early as you can. I buy fresh flowers a few days before the dance.</p>
  <p style="margin:14px 0 0;color:#5C514C;font-size:14px">Leah · Dance Flowers · Idaho Falls</p>
</div>$h$,
    esc(split_part(o.name, ' ', 1)), o.order_number, esc(o.phone),
    order_items_html(o.items), to_char(o.total, 'FM9999990.00'),
    v_venmo, to_char(o.total, 'FM9999990.00'), setting('venmo_user')
  );
end $$;

-- Customer email subject: neutral, no "next step is payment".
create or replace function public.orders_notify() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_to   text[] := array[setting('notify_to')];
  v_cc   text[] := case when coalesce(setting('notify_cc'), '') <> '' then array[setting('notify_cc')] else null end;
  v_when text   := to_char(new.event_date, 'Mon FMDD');
begin
  if tg_op = 'INSERT' then
    perform send_email(v_to,
      format('New order #%s from %s, %s %s, $%s', new.order_number, new.name, new.event_type, v_when, to_char(new.total, 'FM9999990')),
      staff_order_email(new, 'new'), v_cc, new.email);
    if setting('customer_emails') = 'true' and new.email is not null then
      perform send_email(array[new.email],
        format('Your Dance Flowers order #%s is in', new.order_number),
        customer_order_email(new), null, setting('reply_to'));
    end if;
  elsif tg_op = 'UPDATE' and new.status = 'payment_sent' and old.status is distinct from 'payment_sent' then
    perform send_email(v_to,
      format('Payment sent for order #%s, %s, $%s', new.order_number, new.name, to_char(new.total, 'FM9999990')),
      staff_order_email(new, 'payment_sent'), v_cc, new.email);
  end if;
  return new;
end $$;
