-- Fjerner demo-dataene fra sql/demo_overview_seed.sql (slug 'demo-fjellhytta').
delete from public.cleaning_tasks
  where property_id in (select id from public.properties where slug = 'demo-fjellhytta');
delete from public.bookings
  where property_id in (select id from public.properties where slug = 'demo-fjellhytta');
delete from public.properties where slug = 'demo-fjellhytta';
