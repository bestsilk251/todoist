# Voice Todo — AI-планер з голосовим вводом

Mobile-first застосунок: користувач говорить або пише вільним текстом ("сьогодні до лікаря на 3 а завтра на 4 купити телефон"), AI розбирає це на окремі задачі з датою/часом і додає в планер.

## Стек

| Шар | Технологія |
|-----|-----------|
| Мобільний застосунок | React Native + Expo, TypeScript |
| Навігація | React Navigation (native stack) |
| Бекенд | Supabase — Postgres, Auth, Realtime |
| AI-парсинг | Supabase Edge Function (Deno) → Claude Haiku API |
| Валідація LLM-виходу | Zod |
| Auth | Supabase Auth (email+пароль), сесія в AsyncStorage |
| Голос (web) | Web Speech API (Chrome/Edge, uk-UA) |
| Offline-кеш | expo-sqlite (наразі in-memory за тим самим контрактом) |
| Unit-тести | Jest + @testing-library/react-native |
| Тести Edge Function | Deno test |
| E2E | Detox |

## Перший запуск

### 1. Залежності

```bash
npm install
```

### 2. Env-змінні

Файл `.env` уже налаштований на підключений проєкт Supabase. Для нового оточення скопіюйте `.env.example` → `.env` і заповніть `EXPO_PUBLIC_SUPABASE_URL` та `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

### 3. Запуск

Web (розробка на Windows, у браузері):

```bash
npx expo start --web
```

У DevTools браузера (F12 → Ctrl+Shift+M) увімкніть режим пристрою й задайте розмір 402 × 874 (iPhone 16 Pro).

Реальний iPhone (через Expo Go):

```bash
npx expo start
```

Відскануйте QR-код камерою iPhone.

## Функціонал

- Захоплення задачі текстом або голосом (у web — через Web Speech API).
- AI-розбір однієї фрази на кілька задач з датами й часом (Edge Function `parse-task`).
- Екран підтвердження розібраних задач з можливістю правки перед збереженням.
- Список, згрупований за днями: Today / Tomorrow / конкретна дата (ДД-ММ-РРРР) / Без дати.
- Дії: позначити виконаною (і повернути назад), редагувати (назва, опис, дата ДД-ММ-РРРР, час), видалити з Undo (5 с).
- Realtime-синхронізація між пристроями/вкладками.
- Auth: реєстрація/вхід, гейт навігації, вихід.

## Розмірна сітка (mobile-first)

Основний тестовий пристрій — **iPhone 16 Pro**: 402 × 874 pt, 1206 × 2622 px @3x, safe area 62 pt зверху / 34 pt знизу. Усі токени — у `app/theme.ts`. Не хардкодьте 402; використовуйте flex + `spacing`. Мінімальна зона натискання — 44 pt (закріплено тестом).

## Тести

```bash
npm test                  # unit-тести застосунку (Jest)
npm run typecheck         # перевірка типів
npm run test:functions    # тести Edge Function + eval NLU (Deno)
npm run e2e:test          # E2E на iPhone 16 Pro (Detox, потрібен Mac + білд)
npm run e2e:test:se       # той самий флоу на 375 pt
```

**Правило проєкту:** зміна промпту в `supabase/functions/parse-task/prompt.ts` супроводжується прогоном `npm run test:functions` — eval-набір ловить регресії розбору.

## Структура

```
index.js                     # entry (registerRootComponent)
app/
  App.tsx                    # навігація + auth-гейт + SafeAreaProvider
  theme.ts                   # токени: сітка 8pt, safe area, типографіка, кольори
  types.ts                   # спільні типи
  lib/supabase.ts            # singleton клієнта + persist сесії
  lib/useAuth.ts             # session hook + signOut
  lib/taskActions.ts         # update / delete / status / restore
  lib/dateTime.ts            # формати дати ДД-ММ-РРРР і нормалізація часу
  lib/offlineCache.ts        # кеш + черга відкладених insert
  screens/AuthScreen         # вхід / реєстрація
  screens/CaptureScreen      # поле вводу + мікрофон
  screens/ConfirmScreen      # превʼю розібраних задач
  screens/TaskListScreen     # список + групування + realtime + undo
  screens/EditTaskScreen     # редагування задачі
  components/                # MicButton, TaskRow, UndoBar
supabase/
  migrations/0001_init.sql   # схема + RLS + realtime
  functions/parse-task/      # NLU-промпт, Zod-валідація, хендлер, eval
e2e/                         # Detox
```

## Поза MVP / відомі заглушки

- Голос на реальному iPhone (нативний STT) — потребує dev build; web-варіант уже працює. Контракт `onTranscript` фінальний.
- Push-нагадування, повторювані задачі, проєкти/теги — наступні ітерації (схема вже має `project_id`).

## Безпека

`.env` і ключі не комітяться (`.gitignore`). Секрет `ANTHROPIC_API_KEY` живе тільки на сервері як Supabase secret, ніколи в застосунку.
