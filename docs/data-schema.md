# Структура данных - Tilda Analytics

## 📊 Обзор

Система использует **трехуровневую модель данных**:

1. **Users** - уникальные посетители
2. **Sessions** - визиты пользователей
3. **Events** - поток событий (клики, скроллы, формы)

```
users (1) ──────< sessions (N) ──────< events (N)
  │                  │                     │
  └─ Идентификация  └─ Контекст визита   └─ Детализация действий
```

---

## 🗂️ Таблица: `users`

### Назначение
Хранение уникальных посетителей с возможностью обогащения контактными данными.

### Структура

```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_fingerprint TEXT UNIQUE NOT NULL,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    prediction_score FLOAT DEFAULT NULL,
    contact_data JSONB DEFAULT '{}'::jsonb,
    total_sessions INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Описание полей

| Поле | Тип | Обязательно | Описание | Пример |
|------|-----|-------------|----------|--------|
| `user_id` | UUID | ✅ | Уникальный идентификатор пользователя | `550e8400-e29b-41d4-a716-446655440000` |
| `device_fingerprint` | TEXT | ✅ | Хеш фингерпринта устройства (FingerprintJS) | `a1b2c3d4e5f6g7h8` |
| `first_seen_at` | TIMESTAMPTZ | ✅ | Первый визит пользователя | `2025-12-22 10:00:00+00` |
| `last_seen_at` | TIMESTAMPTZ | ✅ | Последний визит пользователя | `2025-12-25 14:30:00+00` |
| `prediction_score` | FLOAT | ❌ | ML-оценка вероятности конверсии (0-1) | `0.85` |
| `contact_data` | JSONB | ❌ | Контактные данные из форм | `{"email": "user@example.com", "phone": "+79991234567"}` |
| `total_sessions` | INTEGER | ✅ | Количество сессий (обновляется триггером) | `15` |
| `created_at` | TIMESTAMPTZ | ✅ | Время создания записи | `2025-12-22 10:00:00+00` |
| `updated_at` | TIMESTAMPTZ | ✅ | Время последнего обновления | `2025-12-25 14:30:00+00` |

### Формат `contact_data` (JSONB)

```json
{
  "email": "user@example.com",
  "phone": "+79991234567",
  "name": "Иван Иванов",
  "company": "ООО Рога и Копыта",
  "source": "landing_form_1",
  "updated_at": "2025-12-22T10:30:00Z"
}
```

### Индексы

```sql
CREATE UNIQUE INDEX idx_users_fingerprint ON users(device_fingerprint);
CREATE INDEX idx_users_email ON users USING GIN ((contact_data->'email'));
CREATE INDEX idx_users_prediction ON users(prediction_score) WHERE prediction_score IS NOT NULL;
```

### Примеры запросов

```sql
-- Найти пользователя по email
SELECT * FROM users 
WHERE contact_data->>'email' = 'user@example.com';

-- Топ пользователей по количеству сессий
SELECT user_id, total_sessions, contact_data->>'email' as email
FROM users
ORDER BY total_sessions DESC
LIMIT 10;

-- Пользователи с высоким prediction_score, но без конверсии
SELECT user_id, prediction_score, contact_data
FROM users
WHERE prediction_score > 0.7
  AND contact_data = '{}'::jsonb;
```

---

## 🗂️ Таблица: `sessions`

### Назначение
Хранение данных о каждом визите пользователя с полным контекстом источника.

### Структура

```sql
CREATE TABLE sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- UTM метки
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    
    -- Click IDs
    yclid TEXT,
    gclid TEXT,
    fbclid TEXT,
    
    -- Источник трафика
    referrer TEXT,
    entry_url TEXT NOT NULL,
    
    -- Технические данные
    user_agent TEXT,
    ip_address INET,
    
    -- Устройство
    device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
    os TEXT,
    browser TEXT,
    screen_resolution TEXT,
    viewport_size TEXT,
    
    -- Локализация
    language TEXT,
    timezone TEXT,
    
    -- Метрики сессии
    session_duration INTEGER DEFAULT 0,
    pages_viewed INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);
```

### Описание полей

| Поле | Тип | Описание | Пример |
|------|-----|----------|--------|
| `session_id` | UUID | Уникальный ID сессии | `7c9e6794-b5a1-11eb-8529-0242ac130003` |
| `user_id` | UUID | FK к таблице users | `550e8400-...` |
| `utm_source` | TEXT | Источник трафика | `google`, `yandex`, `facebook` |
| `utm_medium` | TEXT | Канал | `cpc`, `email`, `social` |
| `utm_campaign` | TEXT | Кампания | `winter_sale_2025` |
| `utm_content` | TEXT | Содержание объявления | `banner_blue` |
| `utm_term` | TEXT | Ключевое слово | `купить+товар+москва` |
| `yclid` | TEXT | Yandex Click ID | `123456789012345678` |
| `gclid` | TEXT | Google Click ID | `EAIaIQobChMI...` |
| `fbclid` | TEXT | Facebook Click ID | `IwAR1x...` |
| `referrer` | TEXT | Откуда пришел | `https://google.com/search?q=...` |
| `entry_url` | TEXT | URL первой страницы сессии | `https://site.com/promo?utm_source=google` |
| `user_agent` | TEXT | User-Agent браузера | `Mozilla/5.0 (Windows NT 10.0; Win64; x64)...` |
| `ip_address` | INET | IP адрес (если доступен) | `192.168.1.1` |
| `device_type` | TEXT | Тип устройства | `desktop`, `mobile`, `tablet` |
| `os` | TEXT | Операционная система | `Windows 11`, `macOS 14.2`, `Android 13` |
| `browser` | TEXT | Браузер | `Chrome 120`, `Safari 17`, `Firefox 121` |
| `screen_resolution` | TEXT | Разрешение экрана | `1920x1080` |
| `viewport_size` | TEXT | Размер видимой области | `1600x900` |
| `language` | TEXT | Язык браузера | `ru-RU`, `en-US` |
| `timezone` | TEXT | Часовой пояс | `Europe/Moscow`, `America/New_York` |
| `session_duration` | INTEGER | Длительность сессии (секунды) | `450` (7.5 минут) |
| `pages_viewed` | INTEGER | Просмотрено страниц | `5` |
| `created_at` | TIMESTAMPTZ | Начало сессии | `2025-12-22 10:00:00+00` |
| `ended_at` | TIMESTAMPTZ | Конец сессии | `2025-12-22 10:07:30+00` |

### Индексы

```sql
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX idx_sessions_utm ON sessions(utm_source, utm_medium, utm_campaign);
CREATE INDEX idx_sessions_device ON sessions(device_type);
CREATE INDEX idx_sessions_gclid ON sessions(gclid) WHERE gclid IS NOT NULL;
CREATE INDEX idx_sessions_yclid ON sessions(yclid) WHERE yclid IS NOT NULL;
```

### Примеры запросов

```sql
-- Сессии из платного трафика
SELECT 
  utm_source,
  utm_campaign,
  COUNT(*) as sessions,
  AVG(session_duration) as avg_duration,
  AVG(pages_viewed) as avg_pages
FROM sessions
WHERE utm_medium = 'cpc'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY utm_source, utm_campaign
ORDER BY sessions DESC;

-- Конверсия по устройствам
SELECT 
  device_type,
  COUNT(DISTINCT s.session_id) as total_sessions,
  COUNT(DISTINCT u.user_id) FILTER (WHERE u.contact_data != '{}'::jsonb) as conversions,
  ROUND(100.0 * COUNT(DISTINCT u.user_id) FILTER (WHERE u.contact_data != '{}'::jsonb) / COUNT(DISTINCT s.session_id), 2) as conversion_rate
FROM sessions s
JOIN users u ON u.user_id = s.user_id
WHERE s.created_at > NOW() - INTERVAL '7 days'
GROUP BY device_type;
```

---

## 🗂️ Таблица: `events`

### Назначение
Хранение потока всех событий пользователей в формате time-series.

### Структура (с партиционированием)

```sql
CREATE TABLE events (
    id BIGSERIAL,
    session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    page_url TEXT NOT NULL,
    
    -- Детали элемента
    target_element TEXT,
    target_text TEXT,
    target_href TEXT,
    target_classes TEXT[],
    target_id TEXT,
    
    -- Вложенные данные (КЛЮЧЕВОЕ ПОЛЕ)
    payload JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Автоматическое создание партиций
CREATE TABLE events_2025_12 PARTITION OF events
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');
```

### Типы событий (`event_type`)

| Тип | Описание | Частота | Критичность |
|-----|----------|---------|-------------|
| `page_view` | Просмотр страницы | 1 раз при загрузке | Средняя |
| `click` | Клик по элементу | Много | Высокая |
| `scroll` | Достижение порога скролла | 5-6 раз на страницу | Низкая |
| `form_submit` | Отправка формы | Редко | **Критичная** |
| `form_focus` | Фокус на поле формы | Средне | Средняя |
| `mouse_hover` | Наведение мыши | Много (если включено) | Низкая |
| `page_exit` | Закрытие страницы | 1 раз | Средняя |
| `custom_goal` | Кастомное событие | По необходимости | Высокая |

### Структура `payload` (JSONB)

#### Для `event_type = 'click'`

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
    "shiftKey": false,
    "altKey": false
  },
  "timing": {
    "timeOnPage": 45000,
    "timeSinceLastEvent": 2340,
    "eventTimestamp": 1703253465789
  },
  "viewport": {
    "width": 1920,
    "height": 1080,
    "scrollX": 0,
    "scrollY": 1240
  }
}
```

#### Для `event_type = 'scroll'`

```json
{
  "scroll": {
    "scrollY": 1240,
    "scrollX": 0,
    "scrollPercent": 75,
    "scrollDepth": "75%",
    "docHeight": 1653,
    "viewportHeight": 800,
    "scrollSpeed": 120
  },
  "timing": {
    "timeOnPage": 60000
  }
}
```

#### Для `event_type = 'form_submit'`

```json
{
  "form": {
    "formId": "form123456",
    "formName": "Contact Form",
    "formAction": "https://forms.tildacdn.com/procces/",
    "fieldCount": 4,
    "fields": {
      "name": "Иван Иванов",
      "email": "ivan@example.com",
      "phone": "+79991234567",
      "message": "Интересует ваш продукт"
    },
    "validationErrors": [],
    "attemptNumber": 1,
    "formValid": true
  },
  "timing": {
    "timeOnPage": 120000,
    "formFillTime": 45000
  }
}
```

#### Для `event_type = 'page_view'`

```json
{
  "performance": {
    "loadTime": 1234,
    "domReady": 890,
    "firstPaint": 456,
    "memoryUsed": 123456789,
    "hardwareConcurrency": 8,
    "connectionType": "4g",
    "effectiveType": "4g",
    "downlink": 10
  },
  "viewport": {
    "width": 1920,
    "height": 1080
  },
  "document": {
    "title": "Главная страница",
    "docHeight": 3500,
    "wordCount": 1250
  }
}
```

#### Для `event_type = 'custom_goal'`

```json
{
  "custom": {
    "goalName": "download_whitepaper",
    "goalValue": 100,
    "goalCategory": "lead_generation",
    "metadata": {
      "fileType": "pdf",
      "fileName": "whitepaper_2025.pdf"
    }
  }
}
```

### Индексы

```sql
-- Базовые индексы
CREATE INDEX idx_events_session_id ON events(session_id, created_at DESC);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_created_at ON events(created_at DESC);

-- GIN индекс для JSONB
CREATE INDEX idx_events_payload_gin ON events USING GIN (payload);

-- Частичные индексы для критичных событий
CREATE INDEX idx_events_conversions ON events(session_id, created_at)
WHERE event_type IN ('form_submit', 'custom_goal');

-- Expression индексы для частых аналитических запросов
CREATE INDEX idx_events_scroll_depth 
ON events ((payload->'scroll'->>'scrollPercent')::int)
WHERE event_type = 'scroll';
```

### Примеры запросов

```sql
-- Топ кликов по кнопкам
SELECT 
  target_text,
  target_element,
  COUNT(*) as clicks,
  COUNT(DISTINCT session_id) as unique_users
FROM events
WHERE event_type = 'click'
  AND target_text IS NOT NULL
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY target_text, target_element
ORDER BY clicks DESC
LIMIT 20;

-- Средняя глубина скролла по страницам
SELECT 
  page_url,
  AVG((payload->'scroll'->>'scrollPercent')::float) as avg_scroll,
  MAX((payload->'scroll'->>'scrollPercent')::int) as max_scroll,
  COUNT(*) as scroll_events
FROM events
WHERE event_type = 'scroll'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY page_url
ORDER BY avg_scroll DESC;

-- Воронка конверсии
WITH funnel AS (
  SELECT 
    session_id,
    MAX(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) as step1_viewed,
    MAX(CASE WHEN event_type = 'click' AND target_text ILIKE '%заказать%' THEN 1 ELSE 0 END) as step2_clicked,
    MAX(CASE WHEN event_type = 'form_focus' THEN 1 ELSE 0 END) as step3_started_form,
    MAX(CASE WHEN event_type = 'form_submit' THEN 1 ELSE 0 END) as step4_submitted
  FROM events
  WHERE created_at > NOW() - INTERVAL '7 days'
  GROUP BY session_id
)
SELECT 
  SUM(step1_viewed) as total_views,
  SUM(step2_clicked) as clicked_order,
  SUM(step3_started_form) as started_form,
  SUM(step4_submitted) as submitted,
  ROUND(100.0 * SUM(step2_clicked) / NULLIF(SUM(step1_viewed), 0), 2) as click_rate,
  ROUND(100.0 * SUM(step3_started_form) / NULLIF(SUM(step2_clicked), 0), 2) as form_start_rate,
  ROUND(100.0 * SUM(step4_submitted) / NULLIF(SUM(step3_started_form), 0), 2) as form_completion_rate,
  ROUND(100.0 * SUM(step4_submitted) / NULLIF(SUM(step1_viewed), 0), 2) as overall_conversion_rate
FROM funnel;
```

---

## 🔗 Связи между таблицами

```sql
-- users ← sessions (один ко многим)
ALTER TABLE sessions
ADD CONSTRAINT fk_sessions_user
FOREIGN KEY (user_id) 
REFERENCES users(user_id) 
ON DELETE CASCADE;

-- sessions ← events (один ко многим)
ALTER TABLE events
ADD CONSTRAINT fk_events_session
FOREIGN KEY (session_id)
REFERENCES sessions(session_id)
ON DELETE CASCADE;
```

### Каскадное удаление

```sql
-- При удалении пользователя удаляются ВСЕ связанные данные
DELETE FROM users WHERE user_id = '550e8400...';
-- Удалит:
-- 1. Все сессии этого пользователя
-- 2. Все события из этих сессий
```

---

## 📏 Объемы данных (прогноз)

### Для сайта с 1000 уникальных посетителей/день

| Таблица | Записей/день | Записей/месяц | Размер/месяц |
|---------|-------------|---------------|--------------|
| `users` | ~200 новых | ~6,000 | ~1 MB |
| `sessions` | ~1,500 | ~45,000 | ~50 MB |
| `events` | ~75,000 | ~2,250,000 | ~2 GB |

**Итого**: ~2 GB/месяц, ~24 GB/год

### Стратегия масштабирования

1. **Партиционирование `events`** по месяцам (уже реализовано)
2. **Архивация** партиций старше 6 месяцев в S3
3. **Материализованные представления** для дашбордов
4. **Connection pooling** для высоконагруженных проектов

---

## 🔑 Ключевые ограничения (Constraints)

```sql
-- CHECK constraints для валидации
ALTER TABLE sessions
ADD CONSTRAINT check_device_type 
CHECK (device_type IN ('desktop', 'mobile', 'tablet'));

ALTER TABLE events
ADD CONSTRAINT check_event_type
CHECK (event_type IN ('page_view', 'click', 'scroll', 'form_submit', 
                       'form_focus', 'mouse_hover', 'page_exit', 'custom_goal'));

-- Валидация payload для критичных событий
ALTER TABLE events
ADD CONSTRAINT check_form_submit_payload
CHECK (
  event_type != 'form_submit' OR 
  (payload ? 'form' AND payload->'form'->>'formId' IS NOT NULL)
);
```

---

## 🔐 Безопасность данных

### Row Level Security (RLS)

```sql
-- Включение RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Политики описаны в database/rls_policies.sql
```

### Шифрование чувствительных данных

```sql
-- Для production: шифрование email/phone в contact_data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Функция для шифрования
CREATE OR REPLACE FUNCTION encrypt_contact_data(data JSONB)
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'email_encrypted', encode(pgp_sym_encrypt(data->>'email', current_setting('app.encryption_key')), 'base64'),
    'phone_encrypted', encode(pgp_sym_encrypt(data->>'phone', current_setting('app.encryption_key')), 'base64')
  );
END;
$$ LANGUAGE plpgsql;
```

---

**Версия**: 1.0.0  
**Последнее обновление**: 2025-12-22
