-- Dance Flowers: email notifications through Resend, sent from inside Postgres.
-- Paste into the SQL editor and run. Safe to re-run.
--
-- How it works: a trigger on orders fires after an insert (new order) and after an update that
-- sets status to payment_sent. It builds the email and POSTs it to Resend with pg_net, using the
-- API key stored in Supabase Vault. Nothing here is reachable from the public page.
--
-- One-time steps after running this file:
--   1. Store the Resend key (never paste it anywhere else):
--        select vault.create_secret('re_xxxxxxxx', 'resend_api_key');
--   2. Recipients live in the settings table below; change with plain updates, no code changes.

create extension if not exists pg_net;

create table if not exists public.settings (
  key   text primary key,
  value text not null
);
alter table public.settings enable row level security;
revoke all on public.settings from anon;
grant select, update on public.settings to authenticated;
drop policy if exists "staff read settings"   on public.settings;
drop policy if exists "staff update settings" on public.settings;
create policy "staff read settings"   on public.settings for select to authenticated using (true);
create policy "staff update settings" on public.settings for update to authenticated using (true) with check (true);

insert into public.settings (key, value) values
  ('notify_to',       'leah3401@gmail.com'),                                   -- Leah
  ('notify_cc',       ''),                                                     -- optional second address, blank = none
  ('from_address',    'Dance Flowers <flowers@shawnandersonapps.com>'),
  ('reply_to',        'leah3401@gmail.com'),
  ('admin_url',       'https://shawnandersonapps.com/danceflowers/admin/'),
  ('venmo_user',      'Leah-Anderson-58'),
  ('customer_emails', 'true')                                                  -- send the customer a copy if they gave an email
on conflict (key) do nothing;

create or replace function public.setting(p_key text) returns text
language sql stable security definer set search_path = public as
$$ select value from public.settings where key = p_key $$;

-- Send one email through Resend. Returns the pg_net request id, or null if no key is stored.
create or replace function public.send_email(p_to text[], p_subject text, p_html text, p_cc text[] default null, p_reply_to text default null)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key  text;
  v_body jsonb;
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key' limit 1;
  if v_key is null then
    raise warning 'send_email: no resend_api_key in vault, skipping "%"', p_subject;
    return null;
  end if;
  v_body := jsonb_build_object(
    'from',    public.setting('from_address'),
    'to',      to_jsonb(p_to),
    'subject', p_subject,
    'html',    p_html
  );
  if p_cc is not null and array_length(p_cc, 1) > 0 then v_body := v_body || jsonb_build_object('cc', to_jsonb(p_cc)); end if;
  if p_reply_to is not null and p_reply_to <> '' then v_body := v_body || jsonb_build_object('reply_to', p_reply_to); end if;
  return net.http_post(
    url     := 'https://api.resend.com/emails',
    body    := v_body,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    timeout_milliseconds := 8000
  );
end $$;
revoke all on function public.send_email(text[], text, text, text[], text) from public;

-- Helpers for the email bodies.
create or replace function public.order_items_html(p_items jsonb) returns text
language sql stable set search_path = public as $$
  select coalesce(string_agg(
           format('<tr><td style="padding:4px 12px 4px 0">%s × %s</td><td style="padding:4px 0;text-align:right">$%s</td></tr>',
                  (p_items->>p.key)::int, p.label, to_char((p_items->>p.key)::int * p.price, 'FM9999990.00')),
           '' order by p.sort), '')
  from public.products p
  where coalesce((p_items->>p.key)::int, 0) > 0
$$;

create or replace function public.esc(t text) returns text
language sql immutable as $$
  select replace(replace(replace(coalesce(t, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;')
$$;

-- The email Leah gets.
create or replace function public.staff_order_email(o public.orders, p_kind text) returns text
language plpgsql stable set search_path = public as $$
declare
  v_lead text;
begin
  v_lead := case p_kind
    when 'new'          then 'New order just came in.'
    when 'payment_sent' then format('%s says they sent $%s on Venmo. Check Venmo, then mark it Paid.', esc(o.name), to_char(o.total, 'FM9999990.00'))
    else '' end;
  return format($h$
<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:#2B2320;max-width:560px">
  <p style="margin:0 0 14px">%s</p>
  <h2 style="margin:0 0 4px;font-size:22px">Order #%s · %s</h2>
  <p style="margin:0 0 14px;color:#5C514C"><b>%s</b> on %s (%s)</p>
  <table style="border-collapse:collapse;font-size:16px;margin:0 0 6px">%s
    <tr><td style="padding:8px 12px 0 0;border-top:1px solid #E6DCD3"><b>Total</b></td><td style="padding:8px 0 0;border-top:1px solid #E6DCD3;text-align:right"><b>$%s</b></td></tr>
  </table>
  <p style="margin:14px 0 4px"><b>Contact</b><br>%s<br><a href="sms:%s">Text %s</a> · <a href="tel:%s">Call</a>%s</p>
  %s%s
  <p style="margin:18px 0 0"><a href="%s" style="display:inline-block;background:#B2495C;color:#fff;text-decoration:none;font-weight:600;padding:10px 16px;border-radius:4px">Open the order list</a></p>
</div>$h$,
    v_lead,
    o.order_number, esc(o.name),
    esc(o.event_type), to_char(o.event_date, 'Dy Mon FMDD'), case when o.event_date - current_date = 0 then 'today' when o.event_date - current_date = 1 then 'tomorrow' else 'in ' || (o.event_date - current_date) || ' days' end,
    order_items_html(o.items), to_char(o.total, 'FM9999990.00'),
    esc(o.name), regexp_replace(o.phone, '[^0-9+]', '', 'g'), esc(o.phone), regexp_replace(o.phone, '[^0-9+]', '', 'g'),
    case when o.email is not null then ' · <a href="mailto:' || esc(o.email) || '">' || esc(o.email) || '</a>' else '' end,
    case when coalesce(o.colors, '') <> '' then '<p style="margin:10px 0 0"><b>Colors</b><br>' || esc(o.colors) || '</p>' else '' end,
    case when coalesce(o.notes, '')  <> '' then '<p style="margin:10px 0 0"><b>Their notes</b><br>' || esc(o.notes) || '</p>' else '' end,
    setting('admin_url')
  );
end $$;

-- The email the customer gets (only if they gave an email address).
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
  <p style="margin:18px 0 6px"><b>Next step: payment.</b> Venmo is easiest, and this button fills in the amount and your order number. Cash at pickup is fine too.</p>
  <p style="margin:0 0 18px"><a href="%s" style="display:inline-block;background:#B2495C;color:#fff;text-decoration:none;font-weight:600;padding:10px 16px;border-radius:4px">Pay $%s on Venmo (@%s)</a></p>
  <p style="margin:0;color:#5C514C;font-size:14px">If plans change, text me at 208-403-7323 as early as you can. I buy fresh flowers a few days before the dance.</p>
  <p style="margin:14px 0 0;color:#5C514C;font-size:14px">Leah · Dance Flowers · Idaho Falls</p>
</div>$h$,
    esc(split_part(o.name, ' ', 1)), o.order_number, esc(o.phone),
    order_items_html(o.items), to_char(o.total, 'FM9999990.00'),
    v_venmo, to_char(o.total, 'FM9999990.00'), setting('venmo_user')
  );
end $$;

-- The trigger.
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
        format('Dance Flowers order #%s, next step is payment', new.order_number),
        customer_order_email(new), null, setting('reply_to'));
    end if;
  elsif tg_op = 'UPDATE' and new.status = 'payment_sent' and old.status is distinct from 'payment_sent' then
    perform send_email(v_to,
      format('Payment sent for order #%s, %s, $%s', new.order_number, new.name, to_char(new.total, 'FM9999990')),
      staff_order_email(new, 'payment_sent'), v_cc, new.email);
  end if;
  return new;
end $$;

drop trigger if exists orders_notify on public.orders;
create trigger orders_notify after insert or update of status on public.orders
  for each row execute function public.orders_notify();
