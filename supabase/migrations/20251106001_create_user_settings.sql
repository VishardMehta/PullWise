-- Create user_settings table
create table user_settings (
  id uuid references auth.users on delete cascade not null primary key,
  gemini_api_key text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS policies
alter table user_settings enable row level security;

create policy "Users can view their own settings"
  on user_settings for select
  using ( auth.uid() = id );

create policy "Users can update their own settings"
  on user_settings for update
  using ( auth.uid() = id );

create policy "Users can insert their own settings"
  on user_settings for insert
  with check ( auth.uid() = id );

-- Create updated_at trigger
create or replace function handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create trigger handle_updated_at
  before update on user_settings
  for each row
  execute function handle_updated_at();

-- Set up automatic user_settings creation
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.user_settings (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();