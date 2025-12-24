# Система сбора данных: Tilda + Supabase
## Проект: Behavioral Data Collector

---

## 📋 Обзор проекта

**Цель**: Создать систему сквозной аналитики для сбора поведенческих данных с сайта на Tilda с последующим хранением в Supabase (PostgreSQL).

**Стек технологий**:
- Frontend: Vanilla JavaScript (ES6+), вставка через `<head>` в Tilda
- Backend/DB: Supabase (PostgreSQL + Row Level Security)
- Интеграция: FingerprintJS для идентификации пользователей
- Безопасность: RLS политики, публичный anon-key только для INSERT

**Конечное использование данных**:
- No-Code интерфейсы (Retool/JetAdmin)
- ML-прогнозирование (MindsDB)

---

## 🏗️ Архитектура проекта

### Структура файлов

```
tilda-analytics/
├── PROJECT_PLAN.md                    # Этот файл
├── ARCHITECTURE.md                    # Детальная архитектура
├── database/
│   ├── schema.sql                     # SQL схема БД
│   ├── rls_policies.sql               # Row Level Security политики
│   ├── indexes.sql                    # Индексы для оптимизации
│   └── functions.sql                  # PostgreSQL функции (опционально)
├── frontend/
│   ├── collector.js                   # Основной скрипт сборщика
│   ├── config.example.js              # Пример конфигурации
│   └── tilda-integration-guide.md     # Инструкция по интеграции в Tilda
├── docs/
│   ├── deployment.md                  # Руководство по развертыванию
│   ├── data-schema.md                 # Описание структуры данных
│   └── analytics-queries.md           # Примеры аналитических запросов
└── README.md                          # Основная документация

```

---

## 🗄️ Database Architecture

### Таблица 1: `users`
**Назначение**: Хранение уникальных посетителей сайта

| Поле | Тип | Описание |
|------|-----|----------|
| `user_id` | UUID (PK) | Уникальный идентификатор пользователя |
| `device_fingerprint` | TEXT | Хеш фингерпринта устройства (FingerprintJS) |
| `first_seen_at` | TIMESTAMPTZ | Первый визит пользователя |
| `last_seen_at` | TIMESTAMPTZ | Последний визит пользователя |
| `prediction_score` | FLOAT | Оценка ML-модели (MindsDB) |
| `contact_data` | JSONB | Email/телефон из форм Tilda |
| `total_sessions` | INTEGER | Счетчик сессий (триггер) |
| `created_at` | TIMESTAMPTZ | Timestamp создания записи |
| `updated_at` | TIMESTAMPTZ | Timestamp последнего обновления |

**Индексы**:
- `device_fingerprint` (для быстрого поиска)
- `contact_data->>'email'` (GIN индекс для JSONB)

---

### Таблица 2: `sessions`
**Назначение**: Данные о визитах пользователей

| Поле | Тип | Описание |
|------|-----|----------|
| `session_id` | UUID (PK) | Уникальный ID сессии |
| `user_id` | UUID (FK → users) | Связь с пользователем |
| `utm_source` | TEXT | UTM метка: источник |
| `utm_medium` | TEXT | UTM метка: канал |
| `utm_campaign` | TEXT | UTM метка: кампания |
| `utm_content` | TEXT | UTM метка: содержание |
| `utm_term` | TEXT | UTM метка: ключевое слово |
| `yclid` | TEXT | Yandex Click ID |
| `gclid` | TEXT | Google Click ID |
| `referrer` | TEXT | Страница-источник перехода |
| `entry_url` | TEXT | URL первой страницы сессии |
| `user_agent` | TEXT | User-Agent браузера |
| `ip_address` | INET | IP-адрес (если доступен) |
| `device_type` | TEXT | desktop/mobile/tablet |
| `os` | TEXT | Операционная система |
| `browser` | TEXT | Браузер |
| `screen_resolution` | TEXT | Разрешение экрана (WxH) |
| `language` | TEXT | Язык браузера |
| `timezone` | TEXT | Часовой пояс |
| `session_duration` | INTEGER | Длительность сессии (сек) |
| `pages_viewed` | INTEGER | Количество просмотренных страниц |
| `created_at` | TIMESTAMPTZ | Начало сессии |
| `ended_at` | TIMESTAMPTZ | Конец сессии |

**Индексы**:
- `user_id` (FK)
- `created_at` (для временных запросов)
- Composite: `(utm_source, utm_medium, utm_campaign)`

---

### Таблица 3: `events` (Stream Events)
**Назначение**: Поток всех событий пользователей

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | BIGSERIAL (PK) | Автоинкремент ID |
| `session_id` | UUID (FK → sessions) | Связь с сессией |
| `event_type` | TEXT | Тип события: click/scroll/form_submit/hover/page_view/custom |
| `page_url` | TEXT | URL страницы события |
| `target_element` | TEXT | CSS селектор элемента |
| `target_text` | TEXT | Текст кнопки/ссылки |
| `target_href` | TEXT | Атрибут href (для ссылок) |
| `target_classes` | TEXT[] | Массив CSS классов |
| `payload` | JSONB | **КЛЮЧЕВОЕ ПОЛЕ** - все метрики |
| `created_at` | TIMESTAMPTZ | Timestamp события |

**Структура `payload` (JSONB)** - "100 метрик":

```json
{
  "click": {
    "x": 450,
    "y": 320,
    "clientX": 450,
    "clientY": 320,
    "pageX": 450,
    "pageY": 1240,
    "button": 0,
    "ctrlKey": false,
    "shiftKey": false
  },
  "scroll": {
    "scrollY": 1240,
    "scrollX": 0,
    "scrollPercent": 75,
    "scrollDepth": "75%",
    "docHeight": 1653,
    "viewportHeight": 800
  },
  "timing": {
    "timeOnPage": 45000,
    "timeSinceLastEvent": 2340,
    "eventTimestamp": 1703253465789
  },
  "mouse": {
    "movementSpeed": 234,
    "totalDistance": 1523,
    "hoverDuration": 450,
    "idleTime": 15000
  },
  "viewport": {
    "width": 1920,
    "height": 1080,
    "visiblePercent": 100
  },
  "performance": {
    "memoryUsed": 123456789,
    "connectionType": "4g",
    "cores": 8
  },
  "form": {
    "formId": "tilda-form-123",
    "fieldName": "email",
    "fieldValue": "user@example.com",
    "formValid": true,
    "attemptNumber": 1
  },
  "custom": {
    "goalName": "download_whitepaper",
    "goalValue": 100
  }
}
```

**Индексы**:
- `session_id` (FK)
- `created_at` (партиционирование по времени)
- `event_type`
- GIN индекс на `payload` для JSONB запросов

---

## 🔒 Row Level Security (RLS)

### Политики безопасности

```sql
-- Разрешить anon роли только INSERT
-- Запретить SELECT/UPDATE/DELETE для публики
```

**Матрица доступа**:

| Таблица | anon (public) | authenticated | service_role |
|---------|---------------|---------------|--------------|
| users   | INSERT only   | SELECT, UPDATE| ALL          |
| sessions| INSERT only   | SELECT, UPDATE| ALL          |
| events  | INSERT only   | SELECT        | ALL          |

---

## 📊 JavaScript Collector - Модули

### 1. **Initialization Module**
```javascript
// Подключение Supabase через CDN
// Инициализация клиента
// Проверка доступности API
```

### 2. **Identity Management**
```javascript
// FingerprintJS интеграция
// Генерация user_id
// Генерация session_id (30 мин таймаут)
// localStorage управление
```

### 3. **UTM & Source Tracking**
```javascript
// Парсинг URL параметров
// Извлечение UTM меток
// Сохранение *clid (yclid, gclid)
// Определение referrer
```

### 4. **Device & Browser Detection**
```javascript
// User-Agent парсинг
// Определение device_type (desktop/mobile/tablet)
// OS detection (Windows/macOS/Linux/iOS/Android)
// Browser detection (Chrome/Firefox/Safari/Edge)
// Screen resolution, language, timezone
```

### 5. **Performance Metrics**
```javascript
// navigator.deviceMemory
// navigator.hardwareConcurrency
// navigator.connection (type, effectiveType, downlink)
// Performance API (loadTime, TTFB, DOMContentLoaded)
```

### 6. **Event Listeners**

#### 6.1 Click Tracker
```javascript
// Event delegation на document.body
// Сбор координат клика (x, y, pageX, pageY)
// Определение target: selector, text, href, classes
// Учет модификаторов (Ctrl, Shift, Alt)
```

#### 6.2 Scroll Tracker
```javascript
// Отслеживание scroll progress
// Триггеры: 25%, 50%, 75%, 90%, 100%
// Debounce (200ms)
// Расчет scroll speed
```

#### 6.3 Mouse Movement Tracker (optional)
```javascript
// Координаты движения мыши
// Расчет скорости и дистанции
// Heatmap data (simplified)
```

#### 6.4 Form Interceptor
```javascript
// Tilda Forms специфика (Ajax отправка)
// Перехват submit events
// Извлечение email/phone из input[type="email"], input[type="tel"]
// UPDATE contact_data в таблице users
// Валидация данных перед отправкой
```

#### 6.5 Page Visibility Tracker
```javascript
// Page Visibility API
// Отслеживание переключений табов
// Расчет активного времени на странице
```

### 7. **Data Batching & Sending**

```javascript
// Буфер событий (массив)
// Batch отправка раз в 5 секунд
// navigator.sendBeacon для unload events
// Fallback на async fetch
// Retry logic при ошибках сети
```

### 8. **Error Handling & Logging**
```javascript
// Try-catch обертки
// Silent failures (не ломать сайт пользователя)
// Console warnings в dev mode
// Sending error events в отдельную таблицу (опционально)
```

---

## 🚀 Поэтапный план реализации

### **Фаза 1: Database Setup** (День 1)
- [ ] Создать SQL схему (`schema.sql`)
- [ ] Создать RLS политики (`rls_policies.sql`)
- [ ] Создать индексы (`indexes.sql`)
- [ ] Протестировать INSERT через Supabase Dashboard
- [ ] Настроить партиционирование таблицы `events` (опционально)

### **Фаза 2: Core JavaScript Development** (День 2-3)
- [ ] Написать модуль инициализации Supabase
- [ ] Реализовать Identity Management (FingerprintJS)
- [ ] Создать UTM Parser
- [ ] Реализовать Device Detection
- [ ] Добавить Performance Metrics

### **Фаза 3: Event Tracking** (День 4-5)
- [ ] Click Tracker с делегированием
- [ ] Scroll Tracker с debounce
- [ ] Form Interceptor для Tilda
- [ ] Page Visibility API
- [ ] Mouse Movement (базовая версия)

### **Фаза 4: Optimization & Batching** (День 6)
- [ ] Реализовать batch отправку событий
- [ ] navigator.sendBeacon для критичных событий
- [ ] Retry logic при ошибках
- [ ] Оптимизация размера payload

### **Фаза 5: Testing & Integration** (День 7)
- [ ] Тестирование на тестовом Tilda сайте
- [ ] Проверка работы RLS политик
- [ ] Валидация данных в Supabase
- [ ] Создание инструкции по интеграции

### **Фаза 6: Documentation** (День 8)
- [ ] Написать `README.md`
- [ ] Создать `deployment.md`
- [ ] Документировать структуру данных
- [ ] Примеры аналитических SQL запросов

---

## 📈 Примеры аналитических запросов

### 1. Топ источников трафика
```sql
SELECT 
  utm_source,
  utm_medium,
  COUNT(DISTINCT session_id) as sessions,
  COUNT(DISTINCT user_id) as users
FROM sessions
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY utm_source, utm_medium
ORDER BY sessions DESC;
```

### 2. Конверсия по воронке
```sql
WITH funnel AS (
  SELECT 
    session_id,
    MAX(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) as step1,
    MAX(CASE WHEN event_type = 'click' AND target_text ILIKE '%заказать%' THEN 1 ELSE 0 END) as step2,
    MAX(CASE WHEN event_type = 'form_submit' THEN 1 ELSE 0 END) as step3
  FROM events
  WHERE created_at > NOW() - INTERVAL '7 days'
  GROUP BY session_id
)
SELECT 
  SUM(step1) as page_views,
  SUM(step2) as clicked_order,
  SUM(step3) as submitted_form,
  ROUND(100.0 * SUM(step2) / NULLIF(SUM(step1), 0), 2) as click_rate,
  ROUND(100.0 * SUM(step3) / NULLIF(SUM(step2), 0), 2) as conversion_rate
FROM funnel;
```

### 3. Глубина скролла по страницам
```sql
SELECT 
  page_url,
  AVG((payload->'scroll'->>'scrollPercent')::int) as avg_scroll_depth,
  COUNT(*) as scroll_events
FROM events
WHERE event_type = 'scroll'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY page_url
ORDER BY avg_scroll_depth DESC;
```

---

## 🔮 Интеграция с MindsDB

### Пример ML-модели для прогнозирования конверсии

```sql
CREATE PREDICTOR user_conversion_predictor
FROM supabase_integration
  (SELECT 
    u.user_id,
    u.total_sessions,
    EXTRACT(EPOCH FROM (u.last_seen_at - u.first_seen_at)) as lifetime_seconds,
    COUNT(DISTINCT s.session_id) as session_count,
    AVG(s.session_duration) as avg_session_duration,
    COUNT(e.id) FILTER (WHERE e.event_type = 'click') as total_clicks,
    COUNT(e.id) FILTER (WHERE e.event_type = 'scroll') as total_scrolls,
    MAX(CASE WHEN e.event_type = 'form_submit' THEN 1 ELSE 0 END) as converted
  FROM users u
  LEFT JOIN sessions s ON s.user_id = u.user_id
  LEFT JOIN events e ON e.session_id = s.session_id
  GROUP BY u.user_id)
PREDICT converted;
```

---

## ⚠️ Важные замечания

### Безопасность
1. **Никогда не храните секретные ключи** в frontend коде
2. **Используйте только anon key** в JavaScript
3. **RLS политики** - критически важны для защиты данных
4. **Валидация на уровне БД** через CHECK constraints

### Производительность
1. **Партиционирование таблицы events** по created_at (месячные партиции)
2. **Batch отправка** - не более 1 запроса в 5 секунд
3. **Индексы** - обязательны на всех FK и часто используемых полях
4. **Debounce на scroll/mousemove** - критично для производительности

### GDPR & Privacy
1. **IP адреса** - опционально, требует согласия пользователя
2. **Cookie consent** - добавить проверку перед инициализацией
3. **Right to be forgotten** - механизм удаления данных пользователя
4. **Anonymization** - опция для хеширования contact_data

---

## 📝 Следующие шаги

1. ✅ **Создать структуру файлов проекта**
2. ⏳ **Написать SQL схему базы данных**
3. ⏳ **Разработать JavaScript collector**
4. ⏳ **Протестировать интеграцию**
5. ⏳ **Написать документацию**

---

## 🤝 Контрибьюция

Проект находится в разработке. Планируется open-source релиз после завершения MVP.

---

**Автор**: Senior Fullstack Developer & Data Architect  
**Дата создания**: 2025-12-22  
**Версия**: 1.0.0-alpha
