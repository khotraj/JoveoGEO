-- Seed: Banfield Pet Hospital project row + initial waves
-- Run after 0001_init.sql and after the first operator user signs in.
-- The tenant_id is resolved by name since there's only one Joveo tenant.

do $$
declare
  v_tenant_id uuid;
  v_project_id uuid := 'a0000000-0000-0000-0000-000000000001'; -- stable UUID for Banfield
begin
  select id into v_tenant_id from tenants where name = 'Joveo' limit 1;

  if v_tenant_id is null then
    raise exception 'Joveo tenant not found — run the migration and sign in first';
  end if;

  insert into projects (
    id, tenant_id, slug, display_name, root_url, mode,
    company_name, country_code, sector, language_codes
  ) values (
    v_project_id,
    v_tenant_id,
    'banfield',
    'Banfield Pet Hospital',
    'https://jobs.banfield.com',
    'live',
    'Banfield Pet Hospital',
    'US',
    'Veterinary',
    array['en','es']
  )
  on conflict (slug) do nothing;

  -- Initial wave rows (grades will be updated after first SF crawl + GSC sync)
  insert into waves (project_id, wave_number, grade, blocks)
  values
    (v_project_id, 1, 'B', '[
      {"label":"Sitemap & Schema","shaded":false,"color":"green"},
      {"label":"Robots & Crawlability","shaded":false,"color":"green"},
      {"label":"Core Web Vitals","shaded":true,"color":"amber"},
      {"label":"Internal Link Depth","shaded":true,"color":"amber"},
      {"label":"Expired Job Cleanup","shaded":false,"color":"red"},
      {"label":"AI-Bot Allowlist","shaded":false,"color":"red"}
    ]'::jsonb),
    (v_project_id, 2, 'C+', '[
      {"label":"Role Hub Pages","shaded":false,"color":"amber"},
      {"label":"Location Hub Pages","shaded":false,"color":"amber"},
      {"label":"Salary / Day-in-Life","shaded":true,"color":"gray"},
      {"label":"EVP Landing Pages","shaded":true,"color":"gray"},
      {"label":"AI-Answer / FAQ","shaded":true,"color":"gray"}
    ]'::jsonb),
    (v_project_id, 3, 'C', '[
      {"label":"Glassdoor Optimization","shaded":true,"color":"gray"},
      {"label":"Wikipedia Presence","shaded":true,"color":"gray"},
      {"label":"Reddit Community","shaded":true,"color":"gray"},
      {"label":"LinkedIn Authority","shaded":true,"color":"gray"},
      {"label":"Industry Citations","shaded":true,"color":"gray"}
    ]'::jsonb)
  on conflict (project_id, wave_number) do nothing;
end;
$$;
