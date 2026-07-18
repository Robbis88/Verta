-- KOMPLETT DEMO for Fjellhytta på Beitostølen (robert@kelsarbil.no).
-- Fyller ut hele boligen + tar i bruk ALLE funksjoner, så hele flyten kan testes:
-- markedsplass → /bo → booking → gjesteguide (AI, leie ski, tjenester) →
-- gjesteside (adgangskode, kjøp sen utsjekk, anmeldelse).
--
-- KREVER at sql/demo_overview_seed.sql er kjørt først (oppretter hytta).
-- Idempotent: rydder egne demo-rader og kjøres trygt på nytt.
-- Faste lenker settes (se bunnen av denne fila).

do $$
declare
  uid uuid;
  pid uuid;
begin
  select id into uid from public.users where email = 'robert@kelsarbil.no';
  if uid is null then raise exception 'Fant ingen bruker robert@kelsarbil.no'; end if;
  select id into pid from public.properties where slug = 'demo-fjellhytta';
  if pid is null then
    raise exception 'Fant ikke demo-hytta. Kjør sql/demo_overview_seed.sql først.';
  end if;

  -- Aktivt abonnement, så den offentlige booking-flyten behandler hytta som aktiv.
  update public.users set plan = 'premium' where id = uid;

  -- Fyll ut hele eiendommen.
  update public.properties set
    listed = true,
    lat = 61.2510, lng = 8.9050,
    base_nightly_rate = 2200, cleaning_fee = 800,
    late_checkout_price = 400, early_checkin_price = 400,
    booking_mode = 'instant',
    bedrooms = 3, bathrooms = 1, max_guests = 8, beds = 6,
    check_in_time = '16:00', check_out_time = '12:00',
    wifi_name = 'Fjellhytta_5G', wifi_password = 'Bitihorn2026',
    guide_token = 'a0000000-0000-0000-0000-000000000001',
    access_info = 'Nøkkelboks til høyre for inngangsdøren. Koden får du på gjestesiden din. Parkering rett utenfor.',
    house_rules = 'Ingen røyking innendørs. Kjæledyr er velkomne. Ro etter kl. 23. Rydd og kast søppel før utsjekk.',
    checkout_info = 'Kast søppel i containeren ved parkeringen. Skru varmen ned til 15°C. Lås døren og legg nøkkelen tilbake i boksen.',
    appliances_info = 'Varmepumpe: fjernkontroll på veggen i stua, «Heat» + 22°C. Badstue: skru på bryteren i gangen 30 min før bruk. TV: velg kilde HDMI 1 for strømming.',
    sleeping_arrangements = 'Soverom 1: dobbeltseng. Soverom 2: to enkeltsenger. Soverom 3: køyeseng. Stue: sovesofa.',
    public_listing = 'Lun tømmerhytte midt i Beitostølen med ski in/ut, egen badstue og boblebad på terrassen. Åtte sengeplasser fordelt på tre soverom — perfekt for familien eller vennegjengen. Nyt utsikten mot Bitihorn fra stua, eller gå rett ut i løypenettet. Kort vei til sentrum, alpinanlegg og butikker.',
    area_description = 'Beitostølen er en av Norges mest komplette fjelldestinasjoner — alpint, langrenn, hundekjøring og turterreng rett utenfor døren. Om sommeren venter fiske, sykling og fjellturer i Jotunheimen. Sentrum har butikker, kafeer og utstyrsutleie.',
    amenities = array['wifi','tv','oppvarming','peis','badstue','boblebad','kjokken','kjoleskap','oppvaskmaskin','komfyr','ovn','mikrobolgeovn','kaffetrakter','vannkoker','servise','spisebord','sengetoy','vaskemaskin','torketrommel','handklaer','varmtvann','harfoner','roykvarsler','brannslukker','forstehjelp','terrasse','utemobler','grill','parkering','gratis_parkering','lademulighet','barnevennlig','kjaeledyr']::text[],
    images = '["https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=1400&q=80","https://images.unsplash.com/photo-1518732714860-b62714ce0c59?w=1400&q=80","https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=80","https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1400&q=80"]'::jsonb
  where id = pid;

  -- Rydd egne demo-feature-rader (idempotent).
  delete from public.rental_items where property_id = pid;
  delete from public.house_equipment where property_id = pid;
  delete from public.property_services where property_id = pid;
  delete from public.property_service_requests where property_id = pid;
  delete from public.property_contacts where property_id = pid;
  delete from public.local_links where property_id = pid;
  delete from public.property_reviews where property_id = pid;
  delete from public.bookings
    where guest_token in ('b0000000-0000-0000-0000-000000000002',
                          'b0000000-0000-0000-0000-000000000003');

  -- Utleie av utstyr (døgnpris + rabatt på ekstra døgn).
  insert into public.rental_items (property_id,name,description,price,price_extra_day,quantity) values
    (pid,'Slalåmski (voksen)','Komplett sett med staver og støvler, str. 40–46',120,80,4),
    (pid,'Langrennsski','Klassisk sett med staver og sko',90,60,4),
    (pid,'Truger','For turer utenfor løypa',60,40,4),
    (pid,'Akebrett / pulk','Moro for hele familien',40,25,3),
    (pid,'Elsykkel (sommer)','Fatbike med god rekkevidde',250,150,2);

  -- Utstyrs-liste (AI forklarer bruken).
  insert into public.house_equipment (property_id,name,category,location,brand,model,note) values
    (pid,'TV i stuen','TV','Stue','Samsung','UE55TU8000','Fjernkontroll i skuffen. Strømming på HDMI 1.'),
    (pid,'Varmepumpe','Klima','Stue','Mitsubishi','MSZ-LN35','Fjernkontroll på veggen. «Heat» + 22°C.'),
    (pid,'Vaskemaskin','Vaskemaskin','Vaskerom','Bosch','WAU28T90','Program 3 = normal 40°C.'),
    (pid,'Kaffemaskin','Kjøkken','Kjøkken','Nespresso','Vertuo','Kapsler i skapet over.'),
    (pid,'Badstuovn','Oppvarming','Badstue','Tylö','Sense','Skru på bryteren i gangen 30 min før bruk.');

  -- Tjenester (fast tidsplan + på bestilling).
  insert into public.property_services (property_id,name,kind,schedule_days,provider_name,provider_phone,provider_email,note) values
    (pid,'Brøyting','scheduled','Ved snøfall, senest kl. 08:00','Beitostølen Brøyting','+4790000001',null,'Innkjørsel og parkering brøytes automatisk.'),
    (pid,'Boblebad-service','scheduled','Onsdag og lørdag','Fjell Spa','+4790000002',null,'Rens og temperatursjekk av boblebadet.'),
    (pid,'Vask underveis','on_demand',null,'Rent & Pent AS','+4790000003',null,'Bestill ekstra rengjøring under oppholdet.'),
    (pid,'Ved-levering','on_demand',null,'Beitostølen Ved','+4790000004',null,'Sekk tørr bjørkeved levert på døren.');

  -- Faste kontakter (kun for eier).
  insert into public.property_contacts (property_id,name,role,phone,email,notes) values
    (pid,'Ola Nordbø','Vaktmester','+4791000001',null,'Ring før kl. 21. Har ekstranøkkel.'),
    (pid,'Kari Rør','Rørlegger','+4791000002',null,'Døgnvakt ved lekkasje.'),
    (pid,'Per Snekker','Snekker','+4791000003','per@snekker.no','Småreparasjoner.');

  -- Lokale lenker (vises i guiden).
  insert into public.local_links (property_id,title,url,description) values
    (pid,'Bunnpris Beitostølen — hjemlevering','https://www.bunnpris.no','Få matvarer levert til hytta.'),
    (pid,'Beitostølen Sport — utleie','https://www.beitostolen.com','Ski, skøyter og utstyr i sentrum.'),
    (pid,'Beitostølen skisenter','https://www.beitostolen.com','Løypekart, heiser og åpningstider.');

  -- Anmeldelser (illustrerende).
  insert into public.property_reviews (property_id,guest_name,rating,comment,owner_reply) values
    (pid,'Familien Berg',5,'Nydelig hytte — ski rett ut i løypa og herlig boblebad etter en dag på fjellet. Kommer tilbake!','Så hyggelig! Velkommen tilbake når som helst 🙌'),
    (pid,'Marius D.',5,'Alt fungerte sømløst: innsjekk med kode, god info i gjesteguiden, og enkelt å leie ski.',null),
    (pid,'Camilla',4,'Koselig og god standard. Litt kaldt første kvelden, men varmepumpen ordnet det raskt.',null);

  -- Gjest A: kommende opphold (test adgangskode, WiFi, kjøp sen utsjekk/tidlig innsjekk).
  insert into public.bookings
    (property_id,guest_name,guest_email,guest_token,check_in,check_out,nights,total_price,amount_total,source,status,payment_status,access_code,remaining_amount,remaining_paid,late_checkout_paid,early_checkin_paid)
  values
    (pid,'Test Gjest','test.gjest@demo.verta.no','b0000000-0000-0000-0000-000000000002','2026-09-20','2026-09-24',4,9600,9600,'verta_direct','confirmed','paid','4271',0,true,false,false);

  -- Gjest B: utsjekket opphold (test: legg igjen anmeldelse).
  insert into public.bookings
    (property_id,guest_name,guest_email,guest_token,check_in,check_out,nights,total_price,amount_total,source,status,payment_status,remaining_amount,remaining_paid)
  values
    (pid,'Anmelder Test','anmelder@demo.verta.no','b0000000-0000-0000-0000-000000000003','2026-05-22','2026-05-25',3,6600,6600,'airbnb','confirmed','paid',0,true);
end $$;
