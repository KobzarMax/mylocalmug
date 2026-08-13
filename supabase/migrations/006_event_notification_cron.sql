-- Schedules the deployed event notification Edge Functions.
-- Before applying, add Vault secrets named project_url, anon_key, and event_notification_cron_secret.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'dispatch-event-notifications') then
    perform cron.unschedule('dispatch-event-notifications');
  end if;
  if exists (select 1 from cron.job where jobname = 'check-push-receipts') then
    perform cron.unschedule('check-push-receipts');
  end if;
end;
$$;

select cron.schedule(
  'dispatch-event-notifications',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/dispatch-event-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key'),
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'event_notification_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);

select cron.schedule(
  'check-push-receipts',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/check-push-receipts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key'),
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'event_notification_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
