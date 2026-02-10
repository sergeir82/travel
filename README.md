# AI‑Гид СПб и Ленобласти (demo)

Небольшой demo‑проект туристического портала:

- Next.js (App Router) + Tailwind UI
- Gemini через `@google/generative-ai`
- POI (СПб/ЛО) встроены в проект (без БД)
- Результат: **таймлайн маршрута + карта с пинами (Яндекс.Карты)**

## Локальный запуск

1) Установить зависимости:

```bash
npm i
```

2) Создать `.env.local` (можно скопировать из `.env.example`) и добавить ключ:

```bash
cp .env.example .env.local
```

В `.env.local`:

```bash
GEMINI_API_KEY=...
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=...
```

3) Запустить:

```bash
npm run dev
```

Открыть `http://localhost:3000`.

## Запуск в Docker

Вариант A (переменные окружения из `.env.local` при старте):

1) Убедитесь, что есть `.env.local` и там заданы GEMINI_API_KEY и NEXT_PUBLIC_YANDEX_MAPS_API_KEY.

2) Запуск:

```bash
docker compose up --build
```

Открыть `http://localhost:3000`.

Примечание: `NEXT_PUBLIC_YANDEX_MAPS_API_KEY` нужен в браузере, поэтому в контейнере он инжектится на старте в `/public/env.js` (не требует пересборки образа при смене ключа).

## Деплой на Vercel

- Сделайте форк данного репозитория
- Импортируйте репозиторий в Vercel
- В настройках проекта добавьте Environment Variable:
  - `GEMINI_API_KEY` — ключ Gemini
  - `NEXT_PUBLIC_YANDEX_MAPS_API_KEY` - ключ для Яндекс карт
- Нажмите Deploy

## Где “AI”

- UI отправляет параметры в `POST /api/itinerary`
- Сервер передаёт Gemini список разрешённых POI и просит вернуть **строгий JSON**
- UI отображает план и карту; точки не “придумываются” вне датасета

