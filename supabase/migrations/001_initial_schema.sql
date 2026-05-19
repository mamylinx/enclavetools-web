-- Tools table for Enclavetools directory
create table tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text not null,
  tag text,
  url text not null,
  category text[] not null,
  license text,
  language text[],
  hardware text[],
  deployment text[],
  model_format text[],
  maturity text,
  date_added date not null,
  last_updated date,
  featured boolean default false,
  popularity_score int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- GIN indexes for array column filtering (supports && overlap operator)
create index idx_tools_category on tools using gin (category);
create index idx_tools_language on tools using gin (language);
create index idx_tools_hardware on tools using gin (hardware);
create index idx_tools_deployment on tools using gin (deployment);
create index idx_tools_model_format on tools using gin (model_format);

-- Scalar column indexes
create index idx_tools_license on tools (license);
create index idx_tools_maturity on tools (maturity);
create index idx_tools_last_updated on tools (last_updated);
create index idx_tools_slug on tools (slug);
create index idx_tools_date_added on tools (date_added);
create index idx_tools_popularity on tools (popularity_score);

-- Row Level Security: public read access
alter table tools enable row level security;
create policy "public read" on tools for select using (true);
