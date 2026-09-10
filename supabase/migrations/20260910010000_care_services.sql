-- HealNest Bharat — care services (home nursing, injection & IV, wound dressing, catheter care,
-- elderly care, post-operative care, physiotherapy, home lab collection).
--
-- Adds a care_service tag to services and backfills rows seeded before this migration.
-- Then re-run `npm run db:seed` to add the physiotherapist and home-lab-collection categories,
-- their providers, and the new nursing services (IV infusion, catheter care, nursing shifts).

alter table public.services
  add column if not exists care_service text
  check (care_service in (
    'home-nursing', 'injection-iv', 'wound-dressing', 'catheter-care',
    'elderly-care', 'post-operative-care', 'physiotherapy', 'home-lab-collection'
  ));

create index if not exists services_care_service_idx on public.services (care_service);

update public.services set care_service = 'injection-iv'        where care_service is null and name = 'Injection administration';
update public.services set care_service = 'wound-dressing'      where care_service is null and name = 'Wound dressing';
update public.services set care_service = 'home-nursing'        where care_service is null and name = 'Vitals check & monitoring';
update public.services set care_service = 'post-operative-care' where care_service is null and name = 'Post-operative care visit (4 hr)';
update public.services set care_service = 'elderly-care'        where care_service is null and name in (
  'Elderly home check-up',
  'Elder companion care (4 hours)',
  'Mobility & daily-living assistance (2 hours)',
  'Day caregiver (8 hours)'
);
