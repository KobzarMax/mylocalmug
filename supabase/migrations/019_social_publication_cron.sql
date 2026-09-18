-- Schedule social delivery only after process-social-publications is deployed and secrets exist.
select cron.schedule(
  'dispatch-social-publications-every-minute',
  '* * * * *',
  $$select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='social_publication_worker_url' limit 1),
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='social_cron_secret' limit 1)
    ),
    body := '{}'::jsonb
  )$$
);
