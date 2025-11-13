-- Create the user_settings table to store user-specific settings like API keys
create table if not exists public.user_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  gemini_api_key text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id)
);

-- Add RLS policies
alter table public.user_settings enable row level security;

-- Allow users to view their own settings
create policy "Users can view their own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

-- Allow users to insert their own settings
create policy "Users can insert their own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

-- Allow users to update their own settings
create policy "Users can update their own settings"
  on public.user_settings for update
  using (auth.uid() = user_id);

-- Set up the updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger handle_user_settings_updated_at
  before update on public.user_settings
  for each row
  execute procedure public.handle_updated_at();