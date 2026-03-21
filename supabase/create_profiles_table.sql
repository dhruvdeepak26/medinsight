-- Run this in your Supabase SQL editor
-- Creates the profiles table with RLS

create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  date_of_birth date,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);
