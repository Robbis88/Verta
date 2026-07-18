-- DIAGNOSE: hvorfor vises ikke «mangler gjestelenke»-påminnelsen?
-- Viser alle bookinger for robert@kelsarbil.no og om hver rad matcher
-- kriteriene påminnelsen bruker (alle fire må være true).

select
  b.guest_name,
  b.source,
  b.status,
  b.check_in,
  b.check_out,
  b.guest_token,
  b.guest_link_sent,
  -- Kriteriene påminnelsen krever:
  (b.guest_link_sent = false)                               as ok_ikke_sendt,
  (b.guest_token is not null)                               as ok_har_token,
  (b.status not in ('cancelled','requested'))               as ok_status,
  (b.check_out >= current_date)                             as ok_kommende,
  -- Alle fire = vises i påminnelsen:
  (b.guest_link_sent = false
    and b.guest_token is not null
    and b.status not in ('cancelled','requested')
    and b.check_out >= current_date)                        as vises_i_paaminnelse
from public.bookings b
join public.properties p on p.id = b.property_id
join public.users u on u.id = p.user_id
where u.email = 'robert@kelsarbil.no'
order by b.check_in;
