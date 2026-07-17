-- DEMO-SEED for oversikts-video (robert@kelsarbil.no)
-- Oppretter én realistisk hytte + et helt år (2026) med bookinger, så dashbord-
-- oversikten ser etablert ut: inntektsgraf, beleggsgrad, kommende bookinger,
-- bookinger per kilde og rengjøringsoppgaver.
--
-- Trygt å kjøre flere ganger — den nullstiller egen demo-data først (slug
-- 'demo-fjellhytta'). FJERN alt igjen med sql/demo_overview_cleanup.sql.

do $$
declare
  uid uuid;
  pid uuid;
begin
  select id into uid from public.users where email = 'robert@kelsarbil.no';
  if uid is null then
    raise exception 'Fant ingen bruker robert@kelsarbil.no';
  end if;

  -- Nullstill tidligere demo (idempotent).
  delete from public.cleaning_tasks
    where property_id in (select id from public.properties where slug = 'demo-fjellhytta');
  delete from public.bookings
    where property_id in (select id from public.properties where slug = 'demo-fjellhytta');
  delete from public.properties where slug = 'demo-fjellhytta';

  -- Hytta.
  insert into public.properties
    (user_id, name, slug, address, description, bedrooms, bathrooms, max_guests,
     base_nightly_rate, cleaning_fee, booking_mode, listed)
  values
    (uid, 'Fjellhytta på Beitostølen', 'demo-fjellhytta',
     'Beitostølen, 2953 Beitostølen',
     'Lun tømmerhytte med ski in/ut, badstue og boblebad. 8 sengeplasser og fantastisk utsikt mot Bitihorn.',
     3, 1, 8, 2200, 800, 'instant', false)
  returning id into pid;

  -- Bookinger gjennom 2026 (ingen datooverlapp). status=confirmed, betalt.
  insert into public.bookings
    (property_id, guest_name, guest_email, check_in, check_out, nights,
     total_price, amount_total, source, status, payment_status)
  values
    (pid,'Familien Berg','demo1@demo.verta.no','2026-01-05','2026-01-09',4, 8800, 8800,'airbnb','confirmed','paid'),
    (pid,'Hansen','demo2@demo.verta.no','2026-01-18','2026-01-21',3, 6000, 6000,'booking','confirmed','paid'),
    (pid,'Larsen','demo3@demo.verta.no','2026-02-08','2026-02-15',7,18200,18200,'airbnb','confirmed','paid'),
    (pid,'Ås','demo4@demo.verta.no','2026-02-20','2026-02-23',3, 6600, 6600,'verta_direct','confirmed','paid'),
    (pid,'Nilsen','demo5@demo.verta.no','2026-03-07','2026-03-11',4, 8000, 8000,'airbnb','confirmed','paid'),
    (pid,'Kristiansen','demo6@demo.verta.no','2026-03-21','2026-03-24',3, 5700, 5700,'booking','confirmed','paid'),
    (pid,'Johansen','demo7@demo.verta.no','2026-04-03','2026-04-09',6,15600,15600,'airbnb','confirmed','paid'),
    (pid,'Ruud','demo8@demo.verta.no','2026-04-18','2026-04-20',2, 3600, 3600,'verta_instagram','confirmed','paid'),
    (pid,'Solberg','demo9@demo.verta.no','2026-05-16','2026-05-19',3, 5400, 5400,'booking','confirmed','paid'),
    (pid,'Pedersen','demo10@demo.verta.no','2026-06-06','2026-06-10',4, 8000, 8000,'airbnb','confirmed','paid'),
    (pid,'Dahl','demo11@demo.verta.no','2026-06-20','2026-06-27',7,16800,16800,'airbnb','confirmed','paid'),
    (pid,'Moen','demo12@demo.verta.no','2026-07-04','2026-07-11',7,17500,17500,'booking','confirmed','paid'),
    (pid,'Bakke','demo13@demo.verta.no','2026-07-12','2026-07-16',4, 9200, 9200,'verta_direct','confirmed','paid'),
    (pid,'Halvorsen','demo14@demo.verta.no','2026-07-19','2026-07-26',7,17500,17500,'airbnb','confirmed','paid'),
    (pid,'Eriksen','demo15@demo.verta.no','2026-07-28','2026-08-02',5,11500,11500,'booking','confirmed','paid'),
    (pid,'Strand','demo16@demo.verta.no','2026-08-08','2026-08-15',7,17500,17500,'airbnb','confirmed','paid'),
    (pid,'Lie','demo17@demo.verta.no','2026-08-22','2026-08-26',4, 8400, 8400,'verta_direct','confirmed','paid'),
    (pid,'Haugen','demo18@demo.verta.no','2026-09-12','2026-09-15',3, 5700, 5700,'booking','confirmed','paid'),
    (pid,'Iversen','demo19@demo.verta.no','2026-10-03','2026-10-10',7,16100,16100,'airbnb','confirmed','paid'),
    (pid,'Vik','demo20@demo.verta.no','2026-10-24','2026-10-27',3, 5700, 5700,'verta_facebook','confirmed','paid'),
    (pid,'Andersen','demo21@demo.verta.no','2026-11-14','2026-11-17',3, 5700, 5700,'booking','confirmed','paid'),
    (pid,'Familien Ek','demo22@demo.verta.no','2026-12-19','2026-12-27',8,21600,21600,'airbnb','confirmed','paid'),
    (pid,'Sørensen','demo23@demo.verta.no','2026-12-28','2027-01-02',5,13000,13000,'verta_direct','confirmed','paid');

  -- Noen kommende rengjøringsoppgaver (fyller «Oppgaver»-panelet).
  insert into public.cleaning_tasks (property_id, task_date, type, status)
  values
    (pid,'2026-07-26','turnover','pending'),
    (pid,'2026-08-02','turnover','pending'),
    (pid,'2026-08-15','turnover','pending'),
    (pid,'2026-08-26','turnover','pending');
end $$;
