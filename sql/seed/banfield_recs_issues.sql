-- Seed: Banfield recommendations + issues
-- Run after banfield_project.sql.
-- fix_steps is jsonb → use to_jsonb(array[...])
-- resolves_issue_ids is uuid[] → pass uuid vars directly

do $$
declare
  v_project_id uuid := 'a0000000-0000-0000-0000-000000000001';
  v_issue_csr  uuid := 'b0000000-0000-0000-0000-000000000001';
  v_issue_404  uuid := 'b0000000-0000-0000-0000-000000000002';
  v_issue_bot  uuid := 'b0000000-0000-0000-0000-000000000003';
begin

  -- ─── Issues ────────────────────────────────────────────────────────────────

  insert into issues (id, project_id, category, severity, title, user_sees, ai_sees, pages, source, status)
  values (
    v_issue_csr,
    v_project_id,
    'seo_technical',
    'high',
    'Client-Side Rendering blocks search indexing',
    'Job listings load correctly in the browser.',
    'Googlebot and AI crawlers receive empty HTML shells — job content is invisible.',
    array['https://jobs.banfield.com/', 'https://jobs.banfield.com/search'],
    'screaming_frog',
    'open'
  ),
  (
    v_issue_404,
    v_project_id,
    'seo_technical',
    'high',
    'Expired job listings returning 200 instead of 404/410',
    'Candidates land on a page showing "This job is no longer available."',
    'Crawlers re-index expired URLs, wasting crawl budget and diluting freshness signals.',
    array[
      'https://jobs.banfield.com/job/associate-veterinarian-12345',
      'https://jobs.banfield.com/job/vet-tech-senior-22221',
      'https://jobs.banfield.com/job/practice-manager-88910'
    ],
    'gsc',
    'open'
  ),
  (
    v_issue_bot,
    v_project_id,
    'seo_technical',
    'medium',
    'AI-bot crawlers blocked in robots.txt',
    'Site loads normally for human visitors.',
    'GPTBot, ClaudeBot, and PerplexityBot are disallowed — Banfield cannot appear in AI-generated answers.',
    array['https://jobs.banfield.com/robots.txt'],
    'screaming_frog',
    'open'
  )
  on conflict (id) do nothing;

  -- ─── Wave 1 — Technical Foundation ─────────────────────────────────────────

  insert into recommendations (
    id, project_id, wave_number, kind, title, page_url,
    impact_text, impact_score, effort, status, fix_steps, resolves_issue_ids
  ) values
  (
    'c0000000-0000-0000-0000-000000000001',
    v_project_id, 1, 'technical',
    'Enable Server-Side Rendering for job listing pages',
    'https://jobs.banfield.com/',
    'SSR ensures Googlebot and AI crawlers receive fully-rendered HTML, unlocking indexation for all job listings.',
    92, 'L', 'open',
    to_jsonb(array[
      'Audit the current React/JS framework in use (likely React SPA via SmartSearch or Phenom).',
      'Enable Next.js SSR or request the ATS vendor to provide a server-rendered HTML feed.',
      'Validate with Google Rich Results Test that job schema is present in the HTML response.',
      'Re-submit sitemap after deployment and monitor coverage report in GSC.'
    ]),
    array[v_issue_csr]
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    v_project_id, 1, 'technical',
    'Return 404/410 for expired job listings',
    'https://jobs.banfield.com/job/',
    'Proper status codes free crawl budget and send freshness signals — can recover 15–20% of lost organic visits.',
    78, 'M', 'open',
    to_jsonb(array[
      'Add a scheduled job that checks ATS for expired requisitions daily.',
      'Configure the web server or edge function to return 410 Gone for known-expired URLs.',
      'Add a canonical redirect from the expired URL to the relevant role hub page.',
      'Update the XML sitemap to exclude expired URLs within 24 hours of expiry.'
    ]),
    array[v_issue_404]
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    v_project_id, 1, 'technical',
    'Allow AI-bot crawlers in robots.txt',
    'https://jobs.banfield.com/robots.txt',
    'Unblocking GPTBot, ClaudeBot, and PerplexityBot allows Banfield to appear in AI-generated job answers.',
    70, 'XS', 'open',
    to_jsonb(array[
      'Edit robots.txt to remove or comment out the GPTBot, ClaudeBot, and PerplexityBot Disallow rules.',
      'Add explicit Allow: / for each AI crawler agent.',
      'Verify the change is live by fetching robots.txt from a browser and confirming no Disallow applies.'
    ]),
    array[v_issue_bot]
  ),
  (
    'c0000000-0000-0000-0000-000000000004',
    v_project_id, 1, 'technical',
    'Improve Core Web Vitals — reduce LCP to under 2.5s',
    'https://jobs.banfield.com/',
    'LCP above 4s on mobile costs ranking positions — fixing images and render-blocking JS can add 5–8% traffic.',
    65, 'M', 'open',
    to_jsonb(array[
      'Run PageSpeed Insights on the homepage and top 5 job pages.',
      'Compress and lazy-load hero images; serve WebP format.',
      'Defer non-critical JavaScript bundles.',
      'Enable Vercel Edge Caching or a CDN in front of the origin.'
    ]),
    null
  ),

  -- ─── Wave 2 — Content Expansion ─────────────────────────────────────────

  (
    'c0000000-0000-0000-0000-000000000005',
    v_project_id, 2, 'content',
    'Create Role Hub Pages for Veterinarian and Vet Tech',
    null,
    'Dedicated hub pages targeting "veterinarian jobs" and "vet tech jobs" can capture 30k+ monthly unbranded searches.',
    88, 'L', 'open',
    to_jsonb(array[
      'Create /careers/veterinarian with H1 "Veterinarian Jobs at Banfield", schema markup, and a filtered job list.',
      'Create /careers/veterinary-technician with equivalent copy and filtered list.',
      'Add internal links from the homepage hero and from relevant job listings.',
      'Submit the new URLs to GSC for indexing and monitor impressions weekly.'
    ]),
    null
  ),
  (
    'c0000000-0000-0000-0000-000000000006',
    v_project_id, 2, 'content',
    'Build Location Hub Pages for top 10 metro markets',
    null,
    'Location pages rank for "vet jobs [city]" queries — top 10 metros account for ~40% of vet hiring volume.',
    82, 'L', 'open',
    to_jsonb(array[
      'Identify top 10 hiring metros from GSC location data and ATS requisition volume.',
      'Create /careers/[city]-[state] pages with localized copy, schema, and job list.',
      'Build a Locations index page linking to all city hubs.',
      'Add schema markup (JobPosting + BreadcrumbList) to each hub page.'
    ]),
    null
  ),
  (
    'c0000000-0000-0000-0000-000000000007',
    v_project_id, 2, 'content',
    'Publish Salary and Day-in-the-Life content for key roles',
    null,
    'Salary and "what does a vet tech do" queries have high click intent — content pages can drive 2–5k monthly visits.',
    74, 'M', 'open',
    to_jsonb(array[
      'Write a "Veterinary Technician Salary at Banfield" page using ATS compensation data.',
      'Write a "Day in the Life of a Banfield Veterinarian" narrative page.',
      'Publish both as blog/editorial pages, link from the relevant role hub pages.',
      'Add FAQ schema to address the top 5 questions from Google''s "People Also Ask" for each role.'
    ]),
    null
  ),
  (
    'c0000000-0000-0000-0000-000000000008',
    v_project_id, 2, 'content',
    'Add AI-Answer / FAQ schema to role hub pages',
    null,
    'FAQ schema on hub pages increases likelihood of appearing in AI Overviews and featured snippets.',
    61, 'S', 'open',
    to_jsonb(array[
      'Identify top 10 FAQ questions per role from "People Also Ask" in SERPs.',
      'Add FAQ schema (JSON-LD) to the Veterinarian and Vet Tech hub pages.',
      'Validate schema with Google''s Rich Results Test.',
      'Monitor GSC for FAQ-rich-result impressions after deployment.'
    ]),
    null
  ),

  -- ─── Wave 3 — Off-Page Authority ────────────────────────────────────────

  (
    'c0000000-0000-0000-0000-000000000009',
    v_project_id, 3, 'off_page',
    'Optimise Glassdoor employer profile for veterinary keywords',
    'https://www.glassdoor.com/Overview/Working-at-Banfield-Pet-Hospital',
    'A keyword-rich Glassdoor profile appears in AI citations for employer reputation queries.',
    58, 'S', 'open',
    to_jsonb(array[
      'Update "About the Company" section with role-specific keyword phrases.',
      'Add veterinary benefits and career growth language to the Overview.',
      'Respond to the top 10 recent reviews to improve engagement signals.',
      'Add a direct link from jobs.banfield.com/about to the Glassdoor profile.'
    ]),
    null
  ),
  (
    'c0000000-0000-0000-0000-000000000010',
    v_project_id, 3, 'off_page',
    'Establish Wikipedia presence for Banfield Pet Hospital careers',
    null,
    'Wikipedia is cited frequently by LLMs — a structured employer section improves AI brand visibility.',
    45, 'M', 'open',
    to_jsonb(array[
      'Review the existing Banfield Wikipedia article for careers/employment coverage.',
      'Add or expand the "Employment" section with factual data (employee count, roles, benefits).',
      'Ensure all claims are cited with publicly available sources.',
      'Monitor AI citation tracking in Rankscale for Wikipedia as a source.'
    ]),
    null
  ),
  (
    'c0000000-0000-0000-0000-000000000011',
    v_project_id, 3, 'off_page',
    'Build LinkedIn company page authority for employer branding',
    'https://www.linkedin.com/company/banfield-pet-hospital',
    'LinkedIn authority boosts off-page signals and is a top citation source for AI employer queries.',
    42, 'S', 'open',
    to_jsonb(array[
      'Ensure LinkedIn company page has complete "Life" and "Jobs" tabs populated.',
      'Post 2–4 employee story articles per month targeting veterinary career queries.',
      'Cross-link LinkedIn "Life" articles to the Day-in-the-Life pages on jobs.banfield.com.',
      'Encourage team members to list Banfield and link to the company page.'
    ]),
    null
  )
  on conflict (id) do nothing;

end;
$$;
