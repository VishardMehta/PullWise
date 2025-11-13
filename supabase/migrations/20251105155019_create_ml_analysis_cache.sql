-- Create the ml_analysis_cache table to store cached ML analysis results
create table ml_analysis_cache (
  id uuid primary key default uuid_generate_v4(),
  request_hash text not null,
  result jsonb not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Create an index on request_hash for faster lookups
create index ml_analysis_cache_request_hash_idx on ml_analysis_cache(request_hash);

-- Add RLS policies
alter table ml_analysis_cache enable row level security;

create policy "Cache results are viewable by all authenticated users"
  on ml_analysis_cache for select
  using (auth.role() = 'authenticated');

create policy "Cache results can be created by authenticated users"
  on ml_analysis_cache for insert
  with check (auth.role() = 'authenticated');

-- Set up updated_at trigger
create trigger set_ml_analysis_cache_updated_at
  before update on ml_analysis_cache
  for each row
  execute procedure moddatetime (updated_at);