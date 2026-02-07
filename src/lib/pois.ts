export type PoiTag =
  | "classic"
  | "history"
  | "art"
  | "architecture"
  | "walk"
  | "views"
  | "food"
  | "coffee"
  | "night"
  | "nature"
  | "kids"
  | "daytrip"
  | "budget"
  | "rain_ok";

export type Region = "spb" | "lenobl";

export type Poi = {
  id: string;
  name: string;
  region: Region;
  lat: number;
  lon: number;
  tags: PoiTag[];
  short: string;
};

// Small curated demo dataset (kept intentionally compact for easy setup).
export const POIS: Poi[] = [
  {
    id: "hermitage",
    name: "Эрмитаж (Зимний дворец)",
    region: "spb",
    lat: 59.939832,
    lon: 30.31456,
    tags: ["classic", "art", "history", "rain_ok"],
    short: "Главный музей города: искусство и история в центре.",
  },
  {
    id: "palace-square",
    name: "Дворцовая площадь",
    region: "spb",
    lat: 59.939095,
    lon: 30.315868,
    tags: ["classic", "walk", "architecture", "views", "budget"],
    short: "Сердце исторического центра, рядом ключевые достопримечательности.",
  },
  {
    id: "isaac",
    name: "Исаакиевский собор",
    region: "spb",
    lat: 59.934158,
    lon: 30.306096,
    tags: ["classic", "architecture", "views", "history", "rain_ok"],
    short: "Монументальный собор с отличными видами с колоннады.",
  },
  {
    id: "church-savior",
    name: "Спас на Крови",
    region: "spb",
    lat: 59.940075,
    lon: 30.328657,
    tags: ["classic", "architecture", "history", "rain_ok"],
    short: "Один из самых узнаваемых храмов с мозаиками внутри.",
  },
  {
    id: "russian-museum",
    name: "Русский музей (Михайловский дворец)",
    region: "spb",
    lat: 59.9389,
    lon: 30.3326,
    tags: ["art", "classic", "rain_ok"],
    short: "Большая коллекция русского искусства в красивом дворце.",
  },
  {
    id: "summer-garden",
    name: "Летний сад",
    region: "spb",
    lat: 59.9499,
    lon: 30.3315,
    tags: ["walk", "classic", "views", "budget"],
    short: "Прогулка среди скульптур и аллей — идеально для передышки.",
  },
  {
    id: "nevsky",
    name: "Невский проспект (прогулка)",
    region: "spb",
    lat: 59.9323,
    lon: 30.344,
    tags: ["walk", "classic", "food", "coffee", "budget"],
    short: "Главная улица города: архитектура, витрины, кафе, атмосфера.",
  },
  {
    id: "new-holland",
    name: "Новая Голландия",
    region: "spb",
    lat: 59.9319,
    lon: 30.2916,
    tags: ["walk", "food", "coffee", "kids", "budget"],
    short: "Остров‑парк с кафе, площадками и атмосферой современного СПб.",
  },
  {
    id: "sevkabel",
    name: "Севкабель Порт",
    region: "spb",
    lat: 59.9259,
    lon: 30.2395,
    tags: ["views", "food", "coffee", "walk", "night", "budget"],
    short: "Набережная Финского залива, закаты, фуд‑корты, события.",
  },
  {
    id: "petropavlovka",
    name: "Петропавловская крепость",
    region: "spb",
    lat: 59.9506,
    lon: 30.3162,
    tags: ["classic", "history", "walk", "views", "budget"],
    short: "Истоки города, прогулки вдоль стен и виды на Неву.",
  },
  {
    id: "vsm",
    name: "Кунсткамера",
    region: "spb",
    lat: 59.9413,
    lon: 30.3076,
    tags: ["history", "rain_ok"],
    short: "Старинный музей с необычными экспозициями и историей науки.",
  },
  {
    id: "strelka",
    name: "Стрелка Васильевского острова",
    region: "spb",
    lat: 59.9434,
    lon: 30.3062,
    tags: ["views", "walk", "classic", "budget"],
    short: "Открыточные виды на Неву и центр, особенно на закате.",
  },
  {
    id: "kazansky",
    name: "Казанский собор",
    region: "spb",
    lat: 59.9342,
    lon: 30.3246,
    tags: ["architecture", "classic", "history", "rain_ok", "budget"],
    short: "Имперская архитектура и большая колоннада в центре Невского.",
  },
  {
    id: "faberge",
    name: "Музей Фаберже",
    region: "spb",
    lat: 59.9295,
    lon: 30.3467,
    tags: ["art", "rain_ok"],
    short: "Эстетичный музей с императорскими яйцами и ювелирным искусством.",
  },
  {
    id: "loft-etagi",
    name: "Лофт Проект ЭТАЖИ",
    region: "spb",
    lat: 59.9166,
    lon: 30.3492,
    tags: ["views", "coffee", "rain_ok", "budget"],
    short: "Современное пространство и смотровая крыша (если открыта).",
  },
  {
    id: "planetarium",
    name: "Планетарий №1",
    region: "spb",
    lat: 59.9215,
    lon: 30.3082,
    tags: ["rain_ok", "kids"],
    short: "Иммерсивные программы — отличный вариант на вечер и в дождь.",
  },
  {
    id: "zoo",
    name: "Ленинградский зоопарк",
    region: "spb",
    lat: 59.9526,
    lon: 30.3084,
    tags: ["kids", "walk"],
    short: "Классическая семейная активность рядом с Петроградкой.",
  },
  {
    id: "peterhof",
    name: "Петергоф (фонтаны и парки)",
    region: "spb",
    lat: 59.8845,
    lon: 29.9169,
    tags: ["classic", "daytrip", "nature", "walk", "views"],
    short: "Дворцы и парки у залива; лучший вариант на полдня/день.",
  },
  {
    id: "tsarskoye",
    name: "Царское Село (Пушкин)",
    region: "spb",
    lat: 59.716,
    lon: 30.396,
    tags: ["classic", "daytrip", "history", "architecture"],
    short: "Дворцово‑парковый ансамбль; хорош для однодневной поездки.",
  },
  {
    id: "kronstadt",
    name: "Кронштадт",
    region: "spb",
    lat: 59.9936,
    lon: 29.7667,
    tags: ["daytrip", "history", "views", "walk", "budget"],
    short: "Морская история, дамба, виды и спокойный темп.",
  },
  {
    id: "vyborg",
    name: "Выборг (старый город)",
    region: "lenobl",
    lat: 60.7133,
    lon: 28.7328,
    tags: ["daytrip", "history", "walk", "views"],
    short: "Сканди‑атмосфера, узкие улочки и средневековые мотивы.",
  },
  {
    id: "vyborg-castle",
    name: "Выборгский замок",
    region: "lenobl",
    lat: 60.7164,
    lon: 28.7292,
    tags: ["daytrip", "history", "views", "rain_ok"],
    short: "Символ Выборга; музей и виды (по режиму работы).",
  },
  {
    id: "monrepo",
    name: "Парк Монрепо (Выборг)",
    region: "lenobl",
    lat: 60.7366,
    lon: 28.7156,
    tags: ["daytrip", "nature", "walk", "views"],
    short: "Скалы, тропы и залив — лучший природный спот Выборга.",
  },
  {
    id: "oreshek",
    name: "Крепость Орешек (Шлиссельбург)",
    region: "lenobl",
    lat: 59.9567,
    lon: 31.0333,
    tags: ["daytrip", "history", "views"],
    short: "Островная крепость на истоке Невы, насыщенная история.",
  },
  {
    id: "gatchina",
    name: "Гатчина (дворец и парк)",
    region: "lenobl",
    lat: 59.5673,
    lon: 30.1315,
    tags: ["daytrip", "classic", "walk", "nature", "history", "rain_ok"],
    short: "Большой парк + дворец, удобная однодневная поездка.",
  },
  {
    id: "priyutino",
    name: "Усадьба Приютино",
    region: "lenobl",
    lat: 60.0197,
    lon: 30.6757,
    tags: ["daytrip", "history", "rain_ok", "budget"],
    short: "Небольшой музей‑усадьба недалеко от города (спокойный формат).",
  },
  {
    id: "lindulovskaya",
    name: "Линдуловская роща (Рощино)",
    region: "lenobl",
    lat: 60.243,
    lon: 29.602,
    tags: ["daytrip", "nature", "walk", "budget"],
    short: "Маршрут по природе и свежему воздуху — отличный анти‑город.",
  },
  {
    id: "repino",
    name: "Репино (побережье и прогулка)",
    region: "lenobl",
    lat: 60.172,
    lon: 29.87,
    tags: ["daytrip", "nature", "walk", "views", "budget"],
    short: "Залив, сосны, лёгкая прогулка — работает почти в любую погоду.",
  },
  {
    id: "sestroretsk",
    name: "Сестрорецк (парк/пляж/залив)",
    region: "spb",
    lat: 60.092,
    lon: 29.956,
    tags: ["nature", "walk", "views", "budget"],
    short: "Природный отдых у воды в пределах города.",
  },
];

export const POI_BY_ID: Record<string, Poi> = Object.fromEntries(
  POIS.map((p) => [p.id, p]),
);

export const ALL_TAGS: { tag: PoiTag; label: string }[] = [
  { tag: "classic", label: "Классика" },
  { tag: "history", label: "История" },
  { tag: "art", label: "Искусство" },
  { tag: "architecture", label: "Архитектура" },
  { tag: "walk", label: "Прогулки" },
  { tag: "views", label: "Виды" },
  { tag: "food", label: "Еда" },
  { tag: "coffee", label: "Кофе" },
  { tag: "kids", label: "С детьми" },
  { tag: "nature", label: "Природа" },
  { tag: "daytrip", label: "Однодневки" },
  { tag: "budget", label: "Бюджетно" },
  { tag: "rain_ok", label: "В дождь" },
];

