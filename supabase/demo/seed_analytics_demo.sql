-- Idempotent analytics demo data for the dedicated demo account only.
-- Re-running this script replaces only rows carrying the exact seed marker.

begin;

do $seed$
declare
  v_user_id uuid;
  v_today date := (now() at time zone 'Europe/Kyiv')::date;
  v_seed_marker constant text := '[demo-analytics-v1]';
  v_deleted integer := 0;
  v_completed integer := 0;
  v_pending integer := 0;
begin
  select u.id
  into v_user_id
  from auth.users u
  where lower(u.email) = lower('olenamelnyk@gmail.com')
  limit 1;

  if v_user_id is null then
    raise exception 'Demo account olenamelnyk@gmail.com was not found';
  end if;

  if (
    select count(*)
    from auth.users u
    where lower(u.email) = lower('olenamelnyk@gmail.com')
  ) <> 1 then
    raise exception 'Expected exactly one demo account for olenamelnyk@gmail.com';
  end if;

  delete from public.tasks
  where user_id = v_user_id
    and source_text = v_seed_marker;
  get diagnostics v_deleted = row_count;

  with candidates as (
    select
      day_offset,
      task_number,
      v_today + day_offset as task_date
    from generate_series(-30, 0) as days(day_offset)
    cross join generate_series(1, 3) as task_numbers(task_number)
    where task_number <= case
        when day_offset >= -1 then 3
        else 1 + mod(abs(day_offset), 3)
      end
      and (day_offset >= -10 or mod(abs(day_offset), 6) <> 0)
  ), shaped as (
    select
      c.*,
      case
        when c.day_offset = -1 then case c.task_number
          when 1 then 'Особисте'
          when 2 then 'Навчання'
          else 'Здоров''я'
        end
        when c.day_offset = 0 then case c.task_number
          when 1 then 'Робота'
          when 2 then ''
          else 'Робота'
        end
        else case mod(abs(c.day_offset) * 3 + c.task_number, 10)
          when 0 then 'Робота'
          when 1 then 'Робота'
          when 2 then 'Робота'
          when 3 then 'Робота'
          when 4 then 'Особисте'
          when 5 then 'Особисте'
          when 6 then 'Навчання'
          when 7 then 'Здоров''я'
          when 8 then 'Навчання'
          else ''
        end
      end as category_name,
      case c.task_number
        when 1 then time '10:00'
        when 2 then time '14:00'
        else time '17:30'
      end as local_due_time,
      case mod(abs(c.day_offset) + c.task_number, 8)
        when 0 then 'urgent'
        when 1 then 'high'
        when 2 then 'high'
        when 3 then 'low'
        else 'medium'
      end as task_priority
    from candidates c
  )
  insert into public.tasks (
    user_id,
    title,
    description,
    due_date,
    due_time,
    is_all_day,
    needs_confirmation,
    status,
    source_text,
    created_at,
    updated_at,
    category,
    important,
    priority,
    completed_at,
    duration_minutes
  )
  select
    v_user_id,
    case s.category_name
      when 'Робота' then case s.task_number
        when 1 then 'Опрацювати пошту й пріоритети'
        when 2 then 'Підготувати матеріали для команди'
        else 'Завершити робочий звіт'
      end
      when 'Особисте' then case s.task_number
        when 1 then 'Спланувати особисті справи'
        when 2 then 'Зателефонувати рідним'
        else 'Навести порядок удома'
      end
      when 'Навчання' then case s.task_number
        when 1 then 'Пройти урок онлайн-курсу'
        when 2 then 'Законспектувати нову тему'
        else 'Практика англійської мови'
      end
      when 'Здоров''я' then case s.task_number
        when 1 then 'Ранкове тренування'
        when 2 then 'Прогулянка на свіжому повітрі'
        else 'Вечірня розтяжка'
      end
      else case s.task_number
        when 1 then 'Розібрати вхідні нотатки'
        when 2 then 'Перевірити список покупок'
        else 'Завершити дрібні справи'
      end
    end || ' · ' || to_char(s.task_date, 'DD.MM'),
    'Демонстраційна завершена задача для перевірки графіків і метрик аналітики.',
    case
      when mod(abs(s.day_offset) + s.task_number, 9) = 0 then null
      else s.task_date
    end,
    case
      when mod(abs(s.day_offset) + s.task_number, 9) = 0 then null
      else s.local_due_time
    end,
    false,
    false,
    'done',
    v_seed_marker,
    ((s.task_date - 2 + time '08:00') at time zone 'Europe/Kyiv'),
    (
      (s.task_date + s.local_due_time)
      + case
          when mod(abs(s.day_offset) * 3 + s.task_number, 5) = 0
            then interval '45 minutes'
          else -interval '35 minutes'
        end
    ) at time zone 'Europe/Kyiv',
    s.category_name,
    s.task_priority in ('urgent', 'high'),
    s.task_priority,
    (
      (s.task_date + s.local_due_time)
      + case
          when mod(abs(s.day_offset) * 3 + s.task_number, 5) = 0
            then interval '45 minutes'
          else -interval '35 minutes'
        end
    ) at time zone 'Europe/Kyiv',
    case mod(abs(s.day_offset) * 2 + s.task_number, 13)
      when 0 then null
      when 1 then 25
      when 2 then 30
      when 3 then 45
      when 4 then 60
      when 5 then 75
      when 6 then 90
      when 7 then 120
      else 50
    end
  from shaped s;
  get diagnostics v_completed = row_count;

  with candidates as (
    select
      day_offset,
      task_number,
      v_today + day_offset as task_date
    from generate_series(-7, 7) as days(day_offset)
    cross join generate_series(1, 2) as task_numbers(task_number)
    where task_number = 1 or day_offset >= 0
  ), shaped as (
    select
      c.*,
      case mod(c.day_offset + 14 + c.task_number, 6)
        when 0 then 'Робота'
        when 1 then 'Особисте'
        when 2 then 'Навчання'
        when 3 then 'Здоров''я'
        when 4 then 'Робота'
        else ''
      end as category_name,
      case
        when c.day_offset = 2 and c.task_number = 1 then time '10:15'
        when c.day_offset = 2 and c.task_number = 2 then time '13:15'
        when c.task_number = 1 then time '11:00'
        else time '18:30'
      end as local_due_time,
      case mod(c.day_offset + 14 + c.task_number, 7)
        when 0 then 'urgent'
        when 1 then 'high'
        when 2 then 'low'
        else 'medium'
      end as task_priority
    from candidates c
  )
  insert into public.tasks (
    user_id,
    title,
    description,
    due_date,
    due_time,
    is_all_day,
    needs_confirmation,
    status,
    source_text,
    created_at,
    updated_at,
    category,
    important,
    priority,
    completed_at,
    duration_minutes
  )
  select
    v_user_id,
    case
      when s.day_offset < 0 then case s.category_name
        when 'Робота' then 'Надіслати прострочені документи'
        when 'Особисте' then 'Завершити відкладену особисту справу'
        when 'Навчання' then 'Надолужити пропущений урок'
        when 'Здоров''я' then 'Перенести пропущене тренування'
        else 'Розібрати прострочені нотатки'
      end
      when s.day_offset = 0 then case s.task_number
        when 1 then 'Підготувати план на сьогодні'
        else 'Підбити підсумки дня'
      end
      when s.day_offset = 2 then case s.task_number
        when 1 then 'Дзвінок із командою перед обідом'
        else 'Підготувати матеріали після вільного вікна'
      end
      else case s.category_name
        when 'Робота' then 'Підготуватися до робочої зустрічі'
        when 'Особисте' then 'Запланувати зустріч із друзями'
        when 'Навчання' then 'Пройти наступний модуль курсу'
        when 'Здоров''я' then 'Тренування за планом'
        else 'Переглянути майбутні справи'
      end
    end || ' · ' || to_char(s.task_date, 'DD.MM'),
    case
      when s.day_offset < 0 then 'Демонстраційна прострочена задача.'
      when s.day_offset = 0 then 'Демонстраційна активна задача на сьогодні.'
      else 'Демонстраційна запланована задача на наступний тиждень.'
    end,
    s.task_date,
    case when mod(s.day_offset + 14 + s.task_number, 5) = 0 then null else s.local_due_time end,
    mod(s.day_offset + 14 + s.task_number, 5) = 0,
    false,
    'pending',
    v_seed_marker,
    ((least(s.task_date, v_today) - 3 + time '09:00') at time zone 'Europe/Kyiv'),
    ((least(s.task_date, v_today) - 1 + time '12:00') at time zone 'Europe/Kyiv'),
    s.category_name,
    s.task_priority in ('urgent', 'high'),
    s.task_priority,
    null,
    case
      when s.day_offset = 2 and s.task_number = 1 then 60
      when s.day_offset = 2 and s.task_number = 2 then 45
      else case mod(s.day_offset + 14 + s.task_number, 8)
      when 0 then null
      when 1 then 30
      when 2 then 45
      when 3 then 60
      when 4 then 90
      else 50
      end
    end
  from shaped s;
  get diagnostics v_pending = row_count;

  raise notice 'Demo analytics seed complete: removed %, inserted % completed and % pending tasks',
    v_deleted,
    v_completed,
    v_pending;
end
$seed$;

commit;
