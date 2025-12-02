-- ABC Learning App - Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Progress for each letter per user
create table if not exists card_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  letter_id text not null,
  level int default 0,
  next_review timestamptz default now(),
  review_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, letter_id)
);

-- User stats
create table if not exists user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_stars int default 0,
  current_streak int default 0,
  last_played_at timestamptz
);

-- Achievements earned
create table if not exists user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  achievement_key text not null,
  unlocked_at timestamptz default now(),
  unique(user_id, achievement_key)
);

-- Enable Row Level Security
alter table card_progress enable row level security;
alter table user_stats enable row level security;
alter table user_achievements enable row level security;

-- RLS Policies: Users can only access their own data
create policy "Users can view own progress"
  on card_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on card_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on card_progress for update
  using (auth.uid() = user_id);

create policy "Users can view own stats"
  on user_stats for select
  using (auth.uid() = user_id);

create policy "Users can insert own stats"
  on user_stats for insert
  with check (auth.uid() = user_id);

create policy "Users can update own stats"
  on user_stats for update
  using (auth.uid() = user_id);

create policy "Users can view own achievements"
  on user_achievements for select
  using (auth.uid() = user_id);

create policy "Users can insert own achievements"
  on user_achievements for insert
  with check (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists idx_card_progress_user on card_progress(user_id);
create index if not exists idx_card_progress_next_review on card_progress(user_id, next_review);
create index if not exists idx_user_achievements_user on user_achievements(user_id);
