-- Execute this SQL in your Supabase SQL Editor to schedule your Edge Functions.
-- IMPORTANT: You must first deploy your functions to your Supabase project:
-- Run this command in your terminal: npx supabase functions deploy

-- 1. Enable the pg_net extension if not already enabled (Required to make HTTP requests from Postgres)
create extension if not exists pg_net;

-- 2. Enable the pg_cron extension
create extension if not exists pg_cron;

-- ==========================================
-- Schedule: Daily Immunization Reminder (H-7)
-- Runs every day at 08:00 AM WIB (01:00 UTC)
-- ==========================================
select cron.schedule(
  'daily-immunization-reminder',
  '0 1 * * *', -- At 01:00 UTC (8 AM WIB)
  $$
  select net.http_post(
      url:='https://your-project-ref.supabase.co/functions/v1/daily-immunization-reminder',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) as request_id;
  $$
);

-- ==========================================
-- Schedule: Urgent Schedule Reminder (Admin Alert)
-- Runs every hour to catch unresponded MENDESAK schedules
-- ==========================================
select cron.schedule(
  'urgent-schedule-reminder',
  '0 * * * *', -- Every hour (e.g. 10:00, 11:00, 12:00)
  $$
  select net.http_post(
      url:='https://your-project-ref.supabase.co/functions/v1/urgent-schedule-reminder',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) as request_id;
  $$
);


-- ==========================================
-- Schedule: Vitamin A & Deworming Reminder
-- Runs at 08:00 AM WIB on the 1st of February and August
-- ==========================================
select cron.schedule(
  'vitamin-a-reminder',
  '0 1 1 2,8 *', -- At 01:00 UTC on the 1st day in Feb and Aug
  $$
  select net.http_post(
      url:='https://your-project-ref.supabase.co/functions/v1/vitamin-a-reminder',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) as request_id;
  $$
);

-- Note: Replace "https://your-project-ref.supabase.co" with your actual project URL.
-- Note: Replace "YOUR_SERVICE_ROLE_KEY" with your actual service_role key.
