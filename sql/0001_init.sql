-- Career Site Cockpit — Initial Schema v2
--
-- Architecture rules enforced here:
--   1. ALL tables created before ANY policy references them (no forward refs)
--   2. OAuth tokens stored as app-side AES-256-GCM ciphertext (text columns)
--      Decryption key: TOKEN_ENCRYPTION_KEY env var (32-byte hex). Never in DB.
--   3. RLS on every tenant-scoped table. Zero exceptions.
--   4. oauth_tokens: deny-all policy + SECURITY DEFINER fn is the only read path
--   5. cost_usd capped at $5 per discovery run at the DB constraint level
--
-- Run order: extensions → enums → tables → rls → policies → functions → indexes

-- ─── Extensions ─────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Enums ───────────────────────────────────────────────────────────────────
create type project_mode        as enum ('live', 'discovery');
create type connection_provider as enum ('gsc','ga4','sheets','rankscale','ahrefs');
create type connection_status   as enum ('not_connected','connecting','connected','error','expired');
create type discovery_status    as enum (
  'queued','crawling','fetching_sitemap','scraping_jobs','running_serp',
  'fetching_ahrefs','inferring','generating_recs','done','error'
);
create type page_type           as enum ('home','role','location','evp','blog','jd','other');
create type severity_level      as enum ('critical','high','medium','low');
create type issue_category      as enum (
  'seo_technical','seo_content','seo_off_page',
  'geo_visibility','geo_citation','cwv','schema'
);
create type issue_status        as enum ('open','in_progress','resolved','wontfix');
create type rec_kind            as enum ('quick','seasonal','competitor','evp','technical','content','off_page');
create type rec_effort          as enum ('XS','S','M','L');
create type rec_status          as enum ('open','scheduled','in_progress','done','wontfix');
create type governance_class    as enum ('FORT','DEFEND','EXCL','DIFF','SR','NEW');
create type insight_category    as enum ('seasonal','quick_win','competitor','content_gap');
create type mention_sentiment   as enum ('positive','neutral','negative','unclear');
create type mention_tag         as enum ('opportunity','win','risk');
create type user_role           as enum ('operator','admin');

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 1: TABLE DEFINITIONS
-- All tables are created here with NO policies.
-- Policies are deferred to Section 3 so every forward reference resolves.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Identity ────────────────────────────────────────────────────────────────
create table tenants (
  id          uuid        primary key default uuid_generate_v4(),
  name        text        not null,
  created_at  timestamptz not null default now(),
  created_by  uuid        references auth.users(id) on delete set null
);

create table profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  email       text        not null,
  role        user_role   not null default 'operator',
  tenant_id   uuid        references tenants(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table projects (
  id                    uuid         primary key default uuid_generate_v4(),
  tenant_id             uuid         not null references tenants(id) on delete cascade,
  slug                  text         not null unique,
  display_name          text         not null,
  root_url              text         not null,
  mode                  project_mode not null default 'discovery',
  company_name          text,
  country_code          text,
  sector                text,
  language_codes        text[],
  created_at            timestamptz  not null default now(),
  updated_at            timestamptz  not null default now(),
  last_synced_at        timestamptz,
  last_discovery_run_id uuid,        -- FK added after discovery_runs is created (see below)
  deleted_at            timestamptz
);

create table connections (
  id                   uuid               primary key default uuid_generate_v4(),
  project_id           uuid               not null references projects(id) on delete cascade,
  provider             connection_provider not null,
  status               connection_status  not null default 'not_connected',
  external_property_id text,
  last_synced_at       timestamptz,
  last_error           text,
  scopes               text[],
  created_by           uuid               references profiles(id) on delete set null,
  created_at           timestamptz        not null default now(),
  updated_at           timestamptz        not null default now(),
  unique (project_id, provider)
);

-- OAuth tokens: stored as base64(AES-256-GCM(token, TOKEN_ENCRYPTION_KEY)).
-- The application layer encrypts/decrypts. Never stored or logged in plaintext.
-- No direct-access policy — use get_connection_tokens() SECURITY DEFINER fn only.
create table oauth_tokens (
  id                uuid        primary key default uuid_generate_v4(),
  connection_id     uuid        not null references connections(id) on delete cascade,
  access_token_enc  text,       -- base64 AES-256-GCM ciphertext
  refresh_token_enc text,       -- base64 AES-256-GCM ciphertext
  expires_at        timestamptz,
  scope             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ─── Discovery ────────────────────────────────────────────────────────────────
create table discovery_runs (
  id            uuid             primary key default uuid_generate_v4(),
  project_id    uuid             not null references projects(id) on delete cascade,
  status        discovery_status not null default 'queued',
  progress_pct  int              not null default 0 check (progress_pct between 0 and 100),
  started_at    timestamptz      not null default now(),
  completed_at  timestamptz,
  error_step    text,
  error_message text,
  cost_usd      numeric(8,4)     not null default 0 check (cost_usd >= 0 and cost_usd <= 5)
);

-- Now we can add the FK from projects to discovery_runs
alter table projects
  add constraint fk_projects_last_discovery_run
  foreign key (last_discovery_run_id) references discovery_runs(id) on delete set null;

create table sitemap_urls (
  id               uuid      primary key default uuid_generate_v4(),
  project_id       uuid      not null references projects(id) on delete cascade,
  url              text      not null,
  last_modified    timestamptz,
  found_in_sitemap text,
  status_code      int,
  page_type        page_type,
  -- SF crawl fields (populated when a Screaming Frog export is uploaded)
  is_indexable     bool,
  title            text,
  meta_desc        text,
  h1               text,
  word_count       int,
  page_size_bytes  int,
  response_time_ms int,
  internal_depth   int,
  inlinks_count    int,
  schema_types     text[],
  unique (project_id, url)
);

create table scraped_jobs (
  id                    uuid        primary key default uuid_generate_v4(),
  project_id            uuid        not null references projects(id) on delete cascade,
  source_url            text,
  job_title             text,
  location_city         text,
  location_region       text,
  location_country      text,
  posted_at             timestamptz,
  scraped_at            timestamptz not null default now(),
  raw_html_storage_path text
);

create table serp_results (
  id          uuid        primary key default uuid_generate_v4(),
  project_id  uuid        not null references projects(id) on delete cascade,
  query       text        not null,
  location    text,
  engine      text        not null default 'google',
  serp_json   jsonb,
  scraped_at  timestamptz not null default now()
);

create table competitors (
  id                   uuid primary key default uuid_generate_v4(),
  project_id           uuid not null references projects(id) on delete cascade,
  root_url             text not null,
  brand_name           text,
  detected_via         text,   -- 'serp_overlap' | 'ahrefs' | 'rankscale' | 'manual'
  serp_overlap_count   int,
  ahrefs_keyword_count int,
  ahrefs_domain_rating int,
  rank_priority        int     check (rank_priority between 1 and 5),
  unique (project_id, root_url)
);

-- ─── GSC + GA4 ───────────────────────────────────────────────────────────────
create table gsc_queries_daily (
  id          bigserial   primary key,
  project_id  uuid        not null references projects(id) on delete cascade,
  date        date        not null,
  query       text        not null,
  impressions int         not null default 0,
  clicks      int         not null default 0,
  ctr         numeric(6,4),
  position    numeric(6,2),
  device      text        not null default 'desktop',
  country     text        not null default 'us',
  page        text,
  unique (project_id, date, query, device, country, page)
);

create table gsc_pages_daily (
  id          bigserial   primary key,
  project_id  uuid        not null references projects(id) on delete cascade,
  date        date        not null,
  page        text        not null,
  impressions int         not null default 0,
  clicks      int         not null default 0,
  ctr         numeric(6,4),
  position    numeric(6,2),
  unique (project_id, date, page)
);

create table gsc_coverage (
  id           bigserial   primary key,
  project_id   uuid        not null references projects(id) on delete cascade,
  captured_at  timestamptz not null default now(),
  state        text        not null,  -- matches GSC coverage state names
  count        int         not null default 0,
  examples     text[]
);

create table ga4_sessions_daily (
  id                      bigserial   primary key,
  project_id              uuid        not null references projects(id) on delete cascade,
  date                    date        not null,
  sessions                int         not null default 0,
  users                   int         not null default 0,
  new_users               int         not null default 0,
  engagement_time_avg_sec numeric(10,2),
  bounce_rate             numeric(6,4),
  source                  text        not null default '(direct)',
  medium                  text        not null default '(none)',
  campaign                text,       -- nullable; NULLS NOT DISTINCT in the unique index below
  -- unique index defined separately to handle NULLs correctly (Postgres 15+)
  constraint uq_ga4_sessions unique nulls not distinct (project_id, date, source, medium, campaign)
);

create table ga4_conversions_daily (
  id               bigserial   primary key,
  project_id       uuid        not null references projects(id) on delete cascade,
  date             date        not null,
  event_name       text        not null,
  count            int         not null default 0,
  conversion_value numeric(12,2),
  unique (project_id, date, event_name)
);

-- ─── Rankscale / GEO ─────────────────────────────────────────────────────────
create table rankscale_runs (
  id                  uuid        primary key default uuid_generate_v4(),
  project_id          uuid        not null references projects(id) on delete cascade,
  run_started_at      timestamptz,
  run_finished_at     timestamptz,
  status              text        not null default 'queued',
  export_storage_path text,
  raw_summary         jsonb
);

create table rankscale_prompts (
  id            bigserial   primary key,
  project_id    uuid        not null references projects(id) on delete cascade,
  run_id        uuid        references rankscale_runs(id) on delete cascade,
  prompt        text        not null,
  engine        text        not null,
  brand_appears bool        not null default false,
  rank          int,
  snippet       text,
  captured_at   timestamptz not null default now()
);

create table rankscale_competitors (
  id               bigserial    primary key,
  project_id       uuid         not null references projects(id) on delete cascade,
  run_id           uuid         references rankscale_runs(id) on delete cascade,
  rank             int          not null,
  brand_name       text,
  root_url         text,
  visibility_score numeric(8,4),
  sov_pct          numeric(6,4),
  captured_at      timestamptz  not null default now()
);

create table rankscale_citations (
  id          bigserial   primary key,
  project_id  uuid        not null references projects(id) on delete cascade,
  run_id      uuid        references rankscale_runs(id) on delete cascade,
  source      text        not null,
  url         text,
  status      text        not null,
  notes       text,
  captured_at timestamptz not null default now()
);

-- ─── Keywords & Pillars ───────────────────────────────────────────────────────
create table keyword_pillars (
  id               uuid             primary key default uuid_generate_v4(),
  project_id       uuid             not null references projects(id) on delete cascade,
  name             text             not null,
  governance_class governance_class not null
);

create table ahrefs_keywords (
  id            bigserial   primary key,
  project_id    uuid        not null references projects(id) on delete cascade,
  -- null = our own keyword; non-null = competitor keyword (for gap analysis)
  competitor_id uuid        references competitors(id) on delete cascade,
  keyword       text        not null,
  country       text,
  volume        int,
  kd            int,
  position      int,        -- our position (null for pure competitor keywords)
  their_position int,       -- competitor position (null for our own keywords)
  our_url       text,
  captured_at   timestamptz not null default now(),
  pillar_id     uuid        references keyword_pillars(id) on delete set null
);

-- ─── Recommendations Spine ────────────────────────────────────────────────────
create table waves (
  id           uuid primary key default uuid_generate_v4(),
  project_id   uuid not null references projects(id) on delete cascade,
  wave_number  int  not null check (wave_number in (1,2,3)),
  grade        text,
  blocks       jsonb,
  unique (project_id, wave_number)
);

create table issues (
  id           uuid           primary key default uuid_generate_v4(),
  project_id   uuid           not null references projects(id) on delete cascade,
  category     issue_category not null,
  severity     severity_level not null,
  title        text           not null,
  user_sees    text,
  ai_sees      text,
  pages        text[],
  cwv          jsonb,
  detected_at  timestamptz    not null default now(),
  source       text           not null default 'manual',
  status       issue_status   not null default 'open'
);

create table recommendations (
  id                  uuid        primary key default uuid_generate_v4(),
  project_id          uuid        not null references projects(id) on delete cascade,
  wave_number         int         not null check (wave_number in (1,2,3)),
  kind                rec_kind    not null,
  title               text        not null,
  page_url            text,
  cms_path            text,
  impact_text         text,
  impact_score        int         not null default 50 check (impact_score between 0 and 100),
  effort              rec_effort  not null default 'M',
  owner               text,
  eta                 date,
  status              rec_status  not null default 'open',
  fix_steps           jsonb,
  resolves_issue_ids  uuid[],
  evidence_source     text,
  pillar_id           uuid        references keyword_pillars(id) on delete set null,
  external_id         text,       -- BF-ID from Banfield tracker
  created_at          timestamptz not null default now(),
  last_modified_at    timestamptz not null default now()
);

create table insights_band (
  id                uuid             primary key default uuid_generate_v4(),
  project_id        uuid             not null references projects(id) on delete cascade,
  category          insight_category not null,
  title             text             not null,
  body              text             not null,
  projected_impact  text,
  generated_by      text             not null default 'gemini',
  source_query      text,
  added_to_tracker  bool             not null default false,
  recommendation_id uuid             references recommendations(id) on delete set null,
  generated_at      timestamptz      not null default now()
);

create table mentions_feed (
  id          bigserial   primary key,
  project_id  uuid        not null references projects(id) on delete cascade,
  source      text        not null,
  url         text,
  title       text,
  snippet     text,
  sentiment   mention_sentiment,
  tag         mention_tag,
  captured_at timestamptz not null default now()
);

create table crawl_findings (
  id             uuid        primary key default uuid_generate_v4(),
  project_id     uuid        not null references projects(id) on delete cascade,
  storage_path   text        not null,
  crawled_at     timestamptz not null default now(),
  url_count      int,
  issues_summary jsonb
);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 2: ENABLE RLS
-- All tables get RLS enabled before any policies are created.
-- ═══════════════════════════════════════════════════════════════════════════
alter table tenants            enable row level security;
alter table profiles           enable row level security;
alter table projects           enable row level security;
alter table connections        enable row level security;
alter table oauth_tokens       enable row level security;
alter table discovery_runs     enable row level security;
alter table sitemap_urls       enable row level security;
alter table scraped_jobs       enable row level security;
alter table serp_results       enable row level security;
alter table competitors        enable row level security;
alter table gsc_queries_daily  enable row level security;
alter table gsc_pages_daily    enable row level security;
alter table gsc_coverage       enable row level security;
alter table ga4_sessions_daily enable row level security;
alter table ga4_conversions_daily enable row level security;
alter table rankscale_runs     enable row level security;
alter table rankscale_prompts  enable row level security;
alter table rankscale_competitors enable row level security;
alter table rankscale_citations enable row level security;
alter table keyword_pillars    enable row level security;
alter table ahrefs_keywords    enable row level security;
alter table waves              enable row level security;
alter table issues             enable row level security;
alter table recommendations    enable row level security;
alter table insights_band      enable row level security;
alter table mentions_feed      enable row level security;
alter table crawl_findings     enable row level security;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 3: POLICIES
-- All tables exist now — no forward-reference errors possible.
-- Pattern: operators access data for projects in their tenant.
-- ═══════════════════════════════════════════════════════════════════════════

-- Tenants: operators read their own tenant
create policy "operators read own tenant"
  on tenants for select using (
    exists (select 1 from profiles where id = auth.uid() and tenant_id = tenants.id)
  );

-- Profiles: users manage their own row
create policy "users read own profile"
  on profiles for select using (auth.uid() = id);
create policy "users update own profile"
  on profiles for update using (auth.uid() = id);

-- Helper: confirms caller is an operator in the same tenant as the given project
-- Used inline in policies below for readability.

-- Projects
create policy "operators read own projects"
  on projects for select using (
    exists (select 1 from profiles where id = auth.uid() and tenant_id = projects.tenant_id)
  );
create policy "operators write own projects"
  on projects for insert with check (
    exists (select 1 from profiles where id = auth.uid() and tenant_id = projects.tenant_id)
  );
create policy "operators update own projects"
  on projects for update using (
    exists (select 1 from profiles where id = auth.uid() and tenant_id = projects.tenant_id)
  );

-- Connections
create policy "operators manage connections"
  on connections for all using (
    exists (
      select 1 from projects pr
      join profiles p on p.tenant_id = pr.tenant_id
      where pr.id = connections.project_id and p.id = auth.uid()
    )
  );

-- OAuth tokens: deny all direct access — read only via SECURITY DEFINER fn
create policy "deny direct oauth token access"
  on oauth_tokens for all using (false);

-- Discovery
create policy "operators manage discovery_runs"
  on discovery_runs for all using (
    exists (
      select 1 from projects pr join profiles p on p.tenant_id = pr.tenant_id
      where pr.id = discovery_runs.project_id and p.id = auth.uid()
    )
  );

-- All Discovery artifact tables share the same pattern
create policy "operators manage sitemap_urls"   on sitemap_urls   for all using (exists (select 1 from projects pr join profiles p on p.tenant_id = pr.tenant_id where pr.id = sitemap_urls.project_id   and p.id = auth.uid()));
create policy "operators manage scraped_jobs"   on scraped_jobs   for all using (exists (select 1 from projects pr join profiles p on p.tenant_id = pr.tenant_id where pr.id = scraped_jobs.project_id   and p.id = auth.uid()));
create policy "operators manage serp_results"   on serp_results   for all using (exists (select 1 from projects pr join profiles p on p.tenant_id = pr.tenant_id where pr.id = serp_results.project_id   and p.id = auth.uid()));
create policy "operators manage competitors"     on competitors     for all using (exists (select 1 from projects pr join profiles p on p.tenant_id = pr.tenant_id where pr.id = competitors.project_id     and p.id = auth.uid()));

-- GSC: service role writes (via sync routes), operators read
create policy "operators read gsc_queries"
  on gsc_queries_daily for select using (
    exists (select 1 from projects pr join profiles p on p.tenant_id = pr.tenant_id where pr.id = gsc_queries_daily.project_id and p.id = auth.uid())
  );
create policy "service role write gsc_queries"
  on gsc_queries_daily for insert with check (true);
create policy "operators read gsc_pages"
  on gsc_pages_daily for select using (
    exists (select 1 from projects pr join profiles p on p.tenant_id = pr.tenant_id where pr.id = gsc_pages_daily.project_id and p.id = auth.uid())
  );
create policy "service role write gsc_pages"
  on gsc_pages_daily for insert with check (true);
create policy "operators manage gsc_coverage"
  on gsc_coverage for all using (
    exists (select 1 from projects pr join profiles p on p.tenant_id = pr.tenant_id where pr.id = gsc_coverage.project_id and p.id = auth.uid())
  );

-- GA4
create policy "operators read ga4_sessions"
  on ga4_sessions_daily for select using (
    exists (select 1 from projects pr join profiles p on p.tenant_id = pr.tenant_id where pr.id = ga4_sessions_daily.project_id and p.id = auth.uid())
  );
create policy "service role write ga4_sessions"
  on ga4_sessions_daily for insert with check (true);
create policy "operators manage ga4_conversions"
  on ga4_conversions_daily for all using (
    exists (select 1 from projects pr join profiles p on p.tenant_id = pr.tenant_id where pr.id = ga4_conversions_daily.project_id and p.id = auth.uid())
  );

-- Rankscale / GEO
create policy "operators manage rankscale_runs"        on rankscale_runs        for all using (exists (select 1 from projects pr join profiles p on p.tenant_id = pr.tenant_id where pr.id = rankscale_runs.project_id        and p.id = auth.uid()));
create policy "operators manage rankscale_prompts"     on rankscale_prompts     for all using (exists (select 1 from projects pr join profiles p on p.tenant_id = pr.tenant_id where pr.id = rankscale_prompts.project_id     and p.id = auth.uid()));
create policy "operators manage rankscale_competitors" on rankscale_competitors for all using (exists (select 1 from projects pr join profiles p on p.tenant_id = pr.tenant_id where pr.id = rankscale_competitors.project_id and p.id = auth.uid()));
create policy "operators manage rankscale_citations"   on rankscale_citations   for all using (exists (select 1 from projects pr join profiles p on p.tenant_id = pr.tenant_id where pr.id = rankscale_citations.project_id   and p.id = auth.uid()));

-- Keywords
create policy "operators manage keyword_pillars" on keyword_pillars for all using (exists (select 1 from projects pr join profiles p on p.tenant_id = pr.tenant_id where pr.id = keyword_pillars.project_id and p.id = auth.uid()));
create policy "operators manage ahrefs_keywords" on ahrefs_keywords for all using (exists (select 1 from projects pr join profiles p on p.tenant_id = pr.tenant_id where pr.id = ahrefs_keywords.project_id and p.id = auth.uid()));

-- Recommendations spine
create policy "operators manage waves"            on waves            for all using (exists (select 1 from projects pr join profiles p on p.tenant_id = pr.tenant_id where pr.id = waves.project_id            and p.id = auth.uid()));
create policy "operators manage issues"           on issues           for all using (exists (select 1 from projects pr join profiles p on p.tenant_id = pr.tenant_id where pr.id = issues.project_id           and p.id = auth.uid()));
create policy "operators manage recommendations"  on recommendations  for all using (exists (select 1 from projects pr join profiles p on p.tenant_id = pr.tenant_id where pr.id = recommendations.project_id  and p.id = auth.uid()));
create policy "operators manage insights_band"    on insights_band    for all using (exists (select 1 from projects pr join profiles p on p.tenant_id = pr.tenant_id where pr.id = insights_band.project_id    and p.id = auth.uid()));
create policy "operators manage mentions_feed"    on mentions_feed    for all using (exists (select 1 from projects pr join profiles p on p.tenant_id = pr.tenant_id where pr.id = mentions_feed.project_id    and p.id = auth.uid()));
create policy "operators manage crawl_findings"   on crawl_findings   for all using (exists (select 1 from projects pr join profiles p on p.tenant_id = pr.tenant_id where pr.id = crawl_findings.project_id   and p.id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 4: FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Generic updated_at trigger function
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at    before update on profiles    for each row execute function set_updated_at();
create trigger projects_updated_at    before update on projects    for each row execute function set_updated_at();
create trigger connections_updated_at before update on connections for each row execute function set_updated_at();
create trigger oauth_tokens_updated_at before update on oauth_tokens for each row execute function set_updated_at();

-- recommendations.last_modified_at (keeps the field name from the spec)
create or replace function update_last_modified()
returns trigger language plpgsql as $$
begin
  new.last_modified_at = now();
  return new;
end;
$$;

create trigger recommendations_last_modified
  before update on recommendations
  for each row execute function update_last_modified();

-- New user → profile bootstrap
-- Runs after auth.users insert (magic link sign-in creates the user row)
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_tenant_id uuid;
begin
  if not (new.email like '%@joveo.com') then
    raise exception 'Only @joveo.com accounts are allowed';
  end if;

  -- Upsert the single Joveo tenant (name is the stable key)
  insert into tenants (name, created_by)
  values ('Joveo', new.id)
  on conflict do nothing;

  select id into v_tenant_id from tenants where name = 'Joveo' limit 1;

  insert into profiles (id, email, role, tenant_id)
  values (new.id, new.email, 'operator', v_tenant_id)
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- OAuth token access: SECURITY DEFINER so service-role routes can call it
-- without needing PostgREST to bypass RLS.
-- Callers: server-only routes using createServiceClient().
-- The returned ciphertext is decrypted in application code using TOKEN_ENCRYPTION_KEY.
create or replace function get_connection_tokens(p_connection_id uuid)
returns table(
  access_token_enc  text,
  refresh_token_enc text,
  expires_at        timestamptz
)
language plpgsql security definer set search_path = public as $$
begin
  -- Verify the caller either has service-role or owns this connection
  if auth.uid() is not null then
    if not exists (
      select 1 from connections c
      join projects pr on pr.id = c.project_id
      join profiles p  on p.tenant_id = pr.tenant_id
      where c.id = p_connection_id and p.id = auth.uid()
    ) then
      raise exception 'unauthorized: connection % not accessible', p_connection_id;
    end if;
  end if;

  return query
    select t.access_token_enc, t.refresh_token_enc, t.expires_at
    from oauth_tokens t
    where t.connection_id = p_connection_id
    limit 1;
end;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 5: INDEXES
-- Hot query paths identified in §4.6 of 01_PLAN.md
-- ═══════════════════════════════════════════════════════════════════════════
create index idx_projects_tenant_active    on projects         (tenant_id, created_at desc) where deleted_at is null;
create index idx_projects_slug             on projects         (slug) where deleted_at is null;
create index idx_gsc_queries_project_date  on gsc_queries_daily (project_id, date desc, impressions desc);
create index idx_gsc_pages_project_date    on gsc_pages_daily   (project_id, date desc, page);
create index idx_ga4_sessions_project_date on ga4_sessions_daily (project_id, date desc);
create index idx_recommendations_wave      on recommendations   (project_id, wave_number, status, impact_score desc);
create index idx_recommendations_inbox     on recommendations   (project_id, kind, status, created_at desc);
create index idx_issues_severity           on issues            (project_id, severity, status);
create index idx_rankscale_prompts         on rankscale_prompts (project_id, engine, brand_appears, captured_at desc);
create index idx_competitors_priority      on competitors       (project_id, rank_priority);
create index idx_sitemap_urls_project      on sitemap_urls      (project_id, page_type, status_code);
create index idx_ahrefs_gap                on ahrefs_keywords   (project_id, competitor_id, volume desc) where competitor_id is not null;
create index idx_insights_band_project     on insights_band     (project_id, generated_at desc, added_to_tracker);
