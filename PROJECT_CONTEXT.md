# Контекст проєкту "Voice Todo" — для передачі в новий чат

## Що це за продукт
Mobile-first застосунок-планер (тип Todoist) українською. Користувач пише або
говорить вільним текстом (наприклад «сьогодні до лікаря на 3 а завтра купити
телефон»), AI розбирає це на окремі структуровані задачі з датою/часом і додає
в планер. Основна мова інтерфейсу — українська (UA + EN для розбору).

## Стек
- **Фронтенд:** React Native + Expo (SDK 52), TypeScript. Розробка й тестування
  зараз у **браузері** (`npx expo start --web`) на Windows; цільовий пристрій —
  **iPhone 16 Pro** (сітка 402×874 pt, safe area 62/34).
- **Бекенд:** Supabase — Postgres, Auth (email+пароль), Realtime, Edge Functions.
- **AI-розбір:** Supabase Edge Function `parse-task` (Deno) → Claude Haiku API,
  вихід валідується Zod, при помилці — graceful fallback.
- **Навігація:** React Navigation (native-stack) + власна нижня таб-навігація.

## Supabase (вже розгорнуто, живе)
- Проєкт ref: `xovftrynmljtkzjbbsqe`, регіон eu-west-1.
- Таблиці `tasks` і `projects` з RLS (кожен бачить лише свої дані), realtime на
  `tasks`. `tasks.user_id` має `default auth.uid()`.
- Колонки `tasks`: id, user_id, project_id, title, description, due_date,
  due_time, is_all_day, needs_confirmation, status(pending/done), category,
  important, source_text, created_at, updated_at.
- Edge Function `parse-task` задеплоєна (version 4, ACTIVE, verify_jwt=true),
  секрет `ANTHROPIC_API_KEY` заданий у Supabase secrets.
- `.env` у корені проєкту містить EXPO_PUBLIC_SUPABASE_URL та ANON_KEY
  (publishable). Ключ Anthropic — тільки серверний секрет, не в застосунку.

## Поточний UI — дизайн "Task Manager v3" (темна тема)
Реалізовано за макетом користувача (`D:\Claude project\design\Task Manager App
v3.dc.html`). Темна тема: фон #050506/#0B0B0D, картки #151518, акцент червоний
#E53935, текст #F5F5F5. Токени — у `app/theme.ts`.

Екрани (нижня навігація на 4 вкладки, іконки — намальовані геометричні):
- **Home** — привітання, поле швидкого вводу з мікрофоном і «+», прогрес-бар,
  3 найближчі задачі.
- **List** — задачі згруповані Сьогодні/Завтра/Пізніше, картки зі свайпом
  (вліво — Перенести/Видалити, вправо — виконати), чекбокс, чіпи часу/категорії,
  червона смужка для важливих, чіп «Просрочено».
- **Calendar** — заглушка «у розробці».
- **Profile** — аватар, статистика (виконано — реальна, стрік — заглушка),
  налаштування, вихід.
- **VoiceOverlay** — запис голосу через Web Speech API (uk-UA) з анімованою
  хвилею.
- **PreviewSheet** — bottom-sheet «Перевірте задачі» з розібраними AI задачами,
  чіпами й блоком «Потрібне уточнення».
- **EditTaskScreen** — редагування (назва, опис, дата ДД-ММ-РРРР, час,
  категорія, важливість, статус), видалення.
- **AuthScreen** — вхід/реєстрація.

## Реалізовані функції
- Реєстрація/вхід (Supabase Auth), гейт навігації, вихід.
- Захоплення задач текстом і голосом (web STT), AI-розбір, превʼю, збереження.
- Список з realtime-синхронізацією, групування за днями.
- Виконати/повернути, редагувати, видалити, перенести на день.
- Дата у форматі ДД-ММ-РРРР; час добудовується («15» → «15:00»).
- Категорія та важливість задачі.

## Формати даних (важливо)
- БД: date = "YYYY-MM-DD", time = "HH:MM". UI: date = "ДД-ММ-РРРР". Конвертація —
  у `app/lib/dateTime.ts` (isoToDisplayDate, displayDateToIso, normalizeTime).

## Структура файлів
```
index.js                     # entry (registerRootComponent)
app/
  App.tsx                    # auth-гейт → Main / Auth, Edit як modal
  theme.ts                   # темні токени v3
  types.ts                   # Task, ParsedTask, TabKey, RootStackParamList
  lib/supabase.ts            # клієнт + persist сесії (AsyncStorage)
  lib/useAuth.ts             # session hook + signOut
  lib/useTasks.ts            # завантаження/realtime/групування/прогрес/toggle/delete
  lib/taskActions.ts         # update/delete/status/restore/insertTasks
  lib/dateTime.ts            # формати дати/часу
  lib/offlineCache.ts        # кеш + черга (in-memory, контракт під expo-sqlite)
  screens/MainScreen.tsx     # таб-оболонка + quick-add/voice/preview
  screens/HomeScreen, ListScreen, CalendarScreen, ProfileScreen
  screens/EditTaskScreen, AuthScreen
  components/BottomNav, TaskCard, ProgressBar, VoiceOverlay, PreviewSheet
supabase/
  migrations/0001_init.sql
  functions/parse-task/      # prompt.ts, schema.ts, index.ts, eval, tests
e2e/                         # Detox
```

## Застарілі файли (НЕ використовуються, замінені дизайном v3)
`app/screens/CaptureScreen.tsx`, `ConfirmScreen.tsx`, `TaskListScreen.tsx`,
`app/components/TaskRow.tsx`, `UndoBar.tsx`, `MicButton.tsx` та їхні тести.
Metro їх не збирає, але вони ламатимуть `npm test`/`tsc`. Можна видалити.

## Як запустити
```
cd "D:\Claude project\TODOIST"
npm install
npx expo start --web        # у DevTools F12 → Ctrl+Shift+M → 402×874
```
Тестовий акаунт: dyminskyydenis@gmail.com (email-підтвердження вимкнено вручну
через SQL; у дешборді Confirm email краще лишити для продакшену).

## Відомі нюанси / наступні кроки
- Голос працює лише у web (Chrome/Edge). На реальному iPhone треба dev build з
  нативним STT (expo-speech-recognition); контракт onTranscript не зміниться.
- Категорію при AI-розборі поки ставимо за замовчуванням «Особисте» — можна
  навчити parse-task визначати її з тексту.
- Календар і «днів поспіль» у профілі — заглушки.
- Проєкт ще не запушено на GitHub (репо github.com/bestsilk251/todoist порожнє).
  Незакритий пункт безпеки: відкликати ключ Anthropic, що засвітився в чаті.
- Sandbox для команд (bash) у сесії часто недоступний — команди виконує
  користувач у терміналі VS Code.

## Стиль співпраці
Відповідати українською, стисло. Перед великими змінами — уточнювати. Файли
проєкту в `D:\Claude project\TODOIST`, дизайни в `D:\Claude project\design`.
