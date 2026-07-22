select set_config(
  'request.jwt.claim.sub',
  (
    select id::text
    from auth.users
    where lower(email) = lower('olenamelnyk@gmail.com')
    limit 1
  ),
  false
);

with response as (
  select public.get_task_analytics(
    (
      (now() at time zone 'Europe/Kyiv')::date
      - (extract(isodow from now() at time zone 'Europe/Kyiv')::integer - 1)
    ),
    (
      (now() at time zone 'Europe/Kyiv')::date
      - (extract(isodow from now() at time zone 'Europe/Kyiv')::integer - 1)
      + 6
    ),
    'Europe/Kyiv'
  ) as payload
)
select jsonb_build_object(
  'period', payload -> 'period',
  'summary', payload -> 'summary',
  'categories', payload -> 'categories',
  'insights', payload -> 'insights'
) as analytics_verification
from response;
