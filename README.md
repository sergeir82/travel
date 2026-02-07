# AI‑Гид СПб и Ленобласти (demo)

Небольшой demo‑проект туристического портала для инвест‑презентации:

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

## Деплой на Vercel

- Импортируйте репозиторий в Vercel
- В настройках проекта добавьте Environment Variable:
  - `GEMINI_API_KEY` — ключ Gemini
  - (опционально) `GEMINI_MODEL` — по умолчанию `gemini-1.5-flash`
- Нажмите Deploy

## Где “AI”

- UI отправляет параметры в `POST /api/itinerary`
- Сервер передаёт Gemini список разрешённых POI и просит вернуть **строгий JSON**
- UI отображает план и карту; точки не “придумываются” вне датасета

## Материалы для презентации

- `PITCH.md` — готовый текст 8–10 слайдов под инвестора

