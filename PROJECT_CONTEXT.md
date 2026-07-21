# Контекст проєкту "Voice Todo" — для передачі в новий чат

> Опис відображає РЕАЛЬНИЙ стан коду на диску станом на зараз.

## Що це за продукт
Mobile-first застосунок-планер (тип Todoist) українською. Користувач пише або
говорить вільним текстом (напр. «сьогодні до лікаря на 3 а завтра купити
телефон»), AI розбирає це на окремі структуровані задачі з датою/часом і додає
в планер. Мова інтерфейсу — українська (розбір UA + EN).

## Стек
- **Фронтенд:** React Native + Expo (SDK 52), TypeScript. Розробка й тестування
  зараз у **браузері** (`npx expo start --web`) на Windows; цільовий пристрій —
  **iPhone 16 Pro** (сітка 402×874 pt, safe area 62/34).
- **Бекенд:** Supabase — Postgres, Auth (email+пароль), Realtime, Edge Functions.
- **AI-розбір:** Supabase Edge Function `parse-task` (Deno) → Claude Haiku API,
  вихід валідується Zod, при помилці — graceful fallback (повертає сирий текст
  як одну задачу з needs_confirmation).
- **Навігація:** React Navigation (native-stack).

## Supabase (розгорнуто, живе — НЕ залежить від локальних файлів)
- Проєкт ref: `xovftrynmljtkzjbbsqe`, регіон eu-west-1. Підключений через конектор
  Supabase MCP.
- Таблиці `tasks` і `projects` з RLS (кожен бачить лише свої дані), realtime на
  `tasks`. `tasks.user_id` має `default auth.uid()`.
- Колонки `tasks`: id, user_id, project_id, title, description, due_date,
  due_time, is_all_day, needs_confirmation, status(pending/done), category,
  important, source_text, created_at, updated_at.
  (УВАГА: `category` та `important` є в БД, але поточний тип `Task` у коді їх
  НЕ містить — вони лишились після відкоченого редизайну.)
- Edge Function `parse-task` задеплоєна (ACTIVE, verify_jwt=true), секрет
  `ANTHROPIC_API_KEY` заданий у Supabase secrets.
- `.env` у корені містить EXPO_PUBLIC_SUPABASE_URL і ANON_KEY (publishable).
  Ключ Anthropic — тільки серверний секрет.

## ПОТОЧНИЙ UI (світла тема — базовий MVP)
Раніше в чаті будувався темний редизайн "Task Manager v3", але його ПОВНІСТЮ
ВІДКОЧЕНО. Зараз на диску — попередній світлий MVP.

Наявні екрани (`app/screens/`):
- **AuthScreen** — вхід/реєстрація (email+пароль).
- **CaptureScreen** — поле вводу тексту + кнопка мікрофона; надсилає в parse-task,
  веде на Confirm.
- **ConfirmScreen** — превʼю розібраних задач, редагування назви, збереження.
- **TaskListScreen** — список, згрупований Today/Tomorrow/дата(ДД-ММ-РРРР)/Без
  дати; чекбокс виконання, видалення з Undo (5с відкладене), realtime.
- **EditTaskScreen** — редагування назви/опису/дати(ДД-ММ-РРРР)/часу, статус,
  видалення.

Компоненти (`app/components/`): MicButton (web STT через Web Speech API, uk-UA),
TaskRow (рядок задачі: чекбокс, назва, час, видалення, відкриття), UndoBar.

Тема — світла (`app/theme.ts`): фон #fff, акцент #2563eb. Токени під сітку
iPhone 16 Pro (spacing 8pt, touch мін. 44pt, hairline, safe-area).

## Реалізовані функції
- Реєстрація/вхід, гейт навігації, вихід.
- Захоплення тексту й голосу (web STT) → AI-розбір → Confirm → збереження.
- Список з realtime, групування за днями.
- Виконати/повернути, редагувати, видалити з Undo, перенести (у Edit).
- Дата ДД-ММ-РРРР; час добудовується («15» → «15:00») — `app/lib/dateTime.ts`.

## Структура файлів (поточна)
```
index.js                     # entry (registerRootComponent)
app/
  App.tsx                    # auth-гейт → Capture/Confirm/TaskList + Edit(modal)
  theme.ts                   # СВІТЛА тема, токени під iPhone 16 Pro
  types.ts                   # Task, ParsedTask, RootStackParamList
  lib/supabase.ts            # клієнт + persist сесії (AsyncStorage)
  lib/useAuth.ts             # session hook + signOut
  lib/dateTime.ts            # формати дати/часу
  lib/taskActions.ts         # update/delete/status/restore
  lib/offlineCache.ts        # кеш + черга (in-memory)
  screens/AuthScreen, CaptureScreen, ConfirmScreen, TaskListScreen, EditTaskScreen
  components/MicButton, TaskRow, UndoBar
supabase/
  migrations/0001_init.sql
  functions/parse-task/      # prompt.ts, schema.ts, index.ts, eval, tests
e2e/                         # Detox
```

## Дизайн v3 (відкочений, але доступний)
Темний макет лежить у `D:\Claude project\design\Task Manager App v3.dc.html`
(є також v2 і v1). Якщо захочете повернути редизайн — там повний макет: темна
тема, нижня навігація (Головна/Список/Календар/Профіль), картки зі свайпом,
голосовий overlay, bottom-sheet превʼю, категорії/важливість.
Іконки для навігації: `D:\Claude project\TODOIST\app\assets\icons\`
(profile.png, todo.png, calendar.png).

## Як запустити
```
cd "D:\Claude project\TODOIST"
npm install
npx expo start --web        # у DevTools F12 → Ctrl+Shift+M → 402×874
```
Тестовий акаунт: dyminskyydenis@gmail.com (email-підтвердження вимкнено вручну
через SQL для розробки).

## Відомі нюанси / наступні кроки
- Голос працює лише у web (Chrome/Edge). На реальному iPhone — dev build з
  нативним STT (expo-speech-recognition); контракт onTranscript не зміниться.
- БД має category/important, а код (Task type) — ще ні: при поверненні цих полів
  у UI синхронізувати тип.
- Проєкт ще НЕ запушено на GitHub (репо github.com/bestsilk251/todoist порожнє).
- Незакритий пункт безпеки: відкликати ключ Anthropic, що засвітився в чаті.
- Sandbox (bash) у сесії часто недоступний — команди виконує користувач у
  терміналі VS Code.

## Стиль співпраці
Відповідати українською, стисло. Перед великими змінами — уточнювати. Файли
проєкту в `D:\Claude project\TODOIST`, дизайни в `D:\Claude project\design`.
