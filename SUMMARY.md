# 📋 СТРУКТУРА И ПЛАН ПРОЕКТА - Tilda Analytics (Behavioral Data Collector)

**Дата создания**: 2025-12-22  
**Статус**: ✅ Планирование завершено  
**Следующий этап**: Разработка SQL схемы и JavaScript коллектора

---

## 🎯 Краткое описание проекта

**Система сбора поведенческих данных** для сайтов на Tilda с бэкендом на Supabase (PostgreSQL).

### Ключевые компоненты:
1. **Frontend**: Vanilla JavaScript коллектор для вставки в `<head>` Tilda
2. **Backend**: Supabase (PostgreSQL) с Row Level Security
3. **Analytics**: Retool/JetAdmin для визуализации + MindsDB для ML

---

## 📁 Структура проекта (создана)

```
tilda-analytics/
│
├── 📄 README.md                           # ✅ Главная документация
├── 📄 PROJECT_PLAN.md                     # ✅ Детальный план разработки (8 фаз)
├── 📄 ARCHITECTURE.md                     # ✅ Техническая архитектура + диаграммы
│
├── 📂 database/                           # ⏳ SQL скрипты (следующий этап)
│   ├── schema.sql                         # TODO: Схема БД (users, sessions, events)
│   ├── rls_policies.sql                   # TODO: Политики безопасности
│   ├── indexes.sql                        # TODO: Индексы для оптимизации
│   └── functions.sql                      # TODO: PostgreSQL функции (опционально)
│
├── 📂 frontend/                           # ⏳ JavaScript коллектор
│   ├── collector.js                       # TODO: Основной скрипт сборщика
│   ├── config.example.js                  # ✅ Пример конфигурации
│   └── tilda-integration-guide.md         # ✅ Инструкция по интеграции
│
└── 📂 docs/                               # 📖 Документация
    ├── data-schema.md                     # ✅ Описание структуры данных
    ├── deployment.md                      # TODO: Руководство по развертыванию
    └── analytics-queries.md               # TODO: Примеры SQL запросов
```

---

## 🗄️ Архитектура базы данных

### Таблица 1: `users`
**Назначение**: Уникальные посетители

| Поле | Тип | Описание |
|------|-----|----------|
| `user_id` | UUID (PK) | Уникальный ID пользователя |
| `device_fingerprint` | TEXT | Фингерпринт устройства (FingerprintJS) |
| `first_seen_at` | TIMESTAMPTZ | Первый визит |
| `last_seen_at` | TIMESTAMPTZ | Последний визит |
| `prediction_score` | FLOAT | ML-оценка вероятности конверсии |
| `contact_data` | JSONB | Email/телефон из форм |
| `total_sessions` | INTEGER | Количество сессий |

**Особенности**:
- GDPR-compliant удаление через CASCADE
- JSONB индексы для быстрого поиска по email/phone
- Автоматическое обновление `last_seen_at` через триггер

---

### Таблица 2: `sessions`
**Назначение**: Визиты пользователей

| Поле | Тип | Описание |
|------|-----|----------|
| `session_id` | UUID (PK) | Уникальный ID сессии |
| `user_id` | UUID (FK) | Связь с users |
| `utm_source`, `utm_medium`, etc. | TEXT | UTM метки |
| `yclid`, `gclid`, `fbclid` | TEXT | Click IDs рекламных систем |
| `referrer`, `entry_url` | TEXT | Источник перехода |
| `device_type`, `os`, `browser` | TEXT | Технические данные |
| `session_duration`, `pages_viewed` | INTEGER | Метрики сессии |

**Особенности**:
- Автоматическое создание при новом визите (> 30 мин или смена источника)
- Composite индексы на `(utm_source, utm_medium, utm_campaign)`
- Партиционирование по `created_at` (опционально)

---

### Таблица 3: `events`
**Назначение**: Поток событий (time-series)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | BIGSERIAL (PK) | Автоинкремент |
| `session_id` | UUID (FK) | Связь с sessions |
| `event_type` | TEXT | `click`, `scroll`, `form_submit`, etc. |
| `page_url` | TEXT | URL страницы |
| `target_element`, `target_text` | TEXT | Детали элемента |
| **`payload`** | **JSONB** | **КЛЮЧЕВОЕ ПОЛЕ - "100 метрик"** |
| `created_at` | TIMESTAMPTZ | Timestamp события |

**Типы событий**:
- `page_view` - просмотр страницы
- `click` - клик по элементу
- `scroll` - достижение порога скролла (25%, 50%, 75%, 90%, 100%)
- `form_submit` - отправка формы (КРИТИЧНО)
- `form_focus` - фокус на поле формы
- `custom_goal` - кастомное событие

**Структура `payload` (пример для `click`)**:
```json
{
  "click": {
    "x": 450, "y": 320,
    "button": 0,
    "ctrlKey": false
  },
  "timing": {
    "timeOnPage": 45000,
    "timeSinceLastEvent": 2340
  },
  "viewport": {
    "width": 1920,
    "height": 1080
  }
}
```

**Особенности**:
- **Партиционирование по месяцам** (обязательно!)
- GIN индексы на `payload` для JSONB запросов
- Автоархивация партиций старше 6 месяцев

---

## 📊 JavaScript Collector - Модульная архитектура

### Модуль 1: Initialization
```javascript
// Подключение Supabase через CDN
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(URL, ANON_KEY)
```

### Модуль 2: Identity Management
```javascript
// FingerprintJS + localStorage UUID
const userId = await getOrCreateUserId()
const sessionId = getOrCreateSessionId()
```

### Модуль 3: UTM & Source Tracking
```javascript
// Парсинг URL: utm_*, yclid, gclid, referrer
const utmParams = parseUTM(window.location.href)
```

### Модуль 4: Device Detection
```javascript
// User-Agent parsing
const deviceInfo = {
  type: 'desktop', // mobile, tablet
  os: 'Windows 11',
  browser: 'Chrome 120'
}
```

### Модуль 5: Performance Metrics
```javascript
// navigator API
const perfMetrics = {
  memory: navigator.deviceMemory,
  cores: navigator.hardwareConcurrency,
  connection: navigator.connection.effectiveType
}
```

### Модуль 6: Event Listeners

#### 6.1 Click Tracker
```javascript
// Event delegation на document.body
document.body.addEventListener('click', (e) => {
  const data = {
    selector: getCSSPath(e.target),
    text: e.target.innerText,
    href: e.target.href,
    x: e.clientX,
    y: e.clientY
  }
  eventBatcher.push('click', data)
})
```

#### 6.2 Scroll Tracker
```javascript
// Debounced scroll tracking
const trackScroll = debounce(() => {
  const percent = calculateScrollPercent()
  if (thresholds.includes(percent)) {
    eventBatcher.push('scroll', { scrollPercent: percent })
  }
}, 200)
```

#### 6.3 Form Interceptor (Tilda специфика)
```javascript
// Перехват Tilda Ajax форм
$(document).on('tildaform:aftersuccess', (e, form) => {
  const contactData = extractContactData(form)
  // UPDATE users SET contact_data = ...
  updateUserContactData(contactData)
})
```

### Модуль 7: Event Batching
```javascript
class EventBatcher {
  constructor() {
    this.buffer = []
    this.maxSize = 10
    this.interval = 5000
    setInterval(() => this.flush(), this.interval)
  }
  
  push(eventType, data) {
    this.buffer.push({ event_type: eventType, payload: data })
    if (this.buffer.length >= this.maxSize) {
      this.flush()
    }
  }
  
  async flush() {
    if (this.buffer.length === 0) return
    await supabase.from('events').insert(this.buffer)
    this.buffer = []
  }
}
```

---

## 🔒 Row Level Security (RLS)

### Матрица доступа

| Таблица | anon (public) | authenticated | service_role |
|---------|---------------|---------------|--------------|
| users   | INSERT only   | SELECT, UPDATE| ALL          |
| sessions| INSERT only   | SELECT        | ALL          |
| events  | INSERT only   | SELECT        | ALL          |

### Принципы:
1. ✅ **anon ключ** в JavaScript (публичный) → только INSERT
2. ✅ **authenticated** ключ для дашбордов → SELECT, UPDATE
3. ✅ **service_role** для админки → FULL ACCESS
4. ❌ **Публика НЕ МОЖЕТ** читать данные (защита от конкурентов)

---

## 🚀 Поэтапный план реализации (8 фаз)

### ✅ Фаза 0: Планирование (ЗАВЕРШЕНА)
- [x] Создана структура проекта
- [x] Написана архитектурная документация
- [x] Описана структура данных
- [x] Подготовлен пример конфигурации

---

### ⏳ Фаза 1: Database Setup (День 1)
**Ответственность**: Backend Developer

**Задачи**:
- [ ] Создать SQL схему (`database/schema.sql`)
  - Таблицы: `users`, `sessions`, `events`
  - Партиционирование `events` по месяцам
  - Триггеры для автообновления `updated_at`, `last_seen_at`
  
- [ ] Создать RLS политики (`database/rls_policies.sql`)
  - anon: INSERT only
  - authenticated: SELECT, UPDATE
  - service_role: BYPASS RLS
  
- [ ] Создать индексы (`database/indexes.sql`)
  - B-Tree: `user_id`, `session_id`, `created_at`
  - GIN: `payload`, `contact_data`
  - Composite: `(utm_source, utm_medium, utm_campaign)`
  
- [ ] Протестировать INSERT через Supabase Dashboard
- [ ] Настроить партиционирование (автоматическое создание)

**Критерии приемки**:
- ✅ Таблицы созданы без ошибок
- ✅ RLS политики работают (anon не может SELECT)
- ✅ Партиции создаются автоматически
- ✅ Тестовые INSERT успешны

---

### ⏳ Фаза 2: Core JavaScript Development (День 2-3)
**Ответственность**: Frontend Developer

**Задачи**:
- [ ] Модуль инициализации Supabase
  ```javascript
  TildaAnalytics.init({ supabaseUrl, supabaseKey })
  ```
  
- [ ] Identity Management
  - FingerprintJS интеграция
  - localStorage UUID fallback
  - Session ID генерация (30 мин таймаут)
  
- [ ] UTM Parser
  - Парсинг всех UTM меток
  - Извлечение yclid, gclid, fbclid
  - Сохранение в sessionStorage
  
- [ ] Device Detection
  - User-Agent parsing (library: UAParser.js)
  - Определение device type (desktop/mobile/tablet)
  - OS и Browser detection
  
- [ ] Performance Metrics
  - navigator.deviceMemory
  - navigator.hardwareConcurrency
  - navigator.connection
  - Performance API (loadTime, TTFB)

**Критерии приемки**:
- ✅ Коллектор инициализируется без ошибок
- ✅ user_id и session_id генерируются корректно
- ✅ UTM метки парсятся и сохраняются
- ✅ Определяется device type, os, browser

---

### ⏳ Фаза 3: Event Tracking (День 4-5)
**Ответственность**: Frontend Developer

**Задачи**:
- [ ] Click Tracker
  - Event delegation на `document.body`
  - Извлечение CSS selector, text, href
  - Сохранение координат (x, y, pageX, pageY)
  
- [ ] Scroll Tracker
  - Debounce (200ms)
  - Пороги: 25%, 50%, 75%, 90%, 100%
  - Расчет scroll speed
  
- [ ] Form Interceptor для Tilda
  - Перехват `tildaform:aftersuccess`
  - Извлечение email, phone из полей
  - UPDATE `users.contact_data`
  
- [ ] Page Visibility API
  - Отслеживание переключений табов
  - Расчет активного времени
  
- [ ] Mouse Movement (базовая версия)
  - Опциональный трекинг
  - Debounce (500ms)

**Критерии приемки**:
- ✅ Клики отслеживаются и сохраняются
- ✅ Scroll события отправляются на порогах
- ✅ Формы перехватываются, contact_data обновляется
- ✅ Page visibility корректно работает

---

### ⏳ Фаза 4: Optimization & Batching (День 6)
**Ответственность**: Frontend Developer

**Задачи**:
- [ ] Event Batching
  - Буфер событий (массив)
  - Batch отправка каждые 5 секунд
  - Немедленная отправка критичных событий (`form_submit`)
  
- [ ] navigator.sendBeacon
  - Использовать для `beforeunload` событий
  - Fallback на `fetch` с `keepalive: true`
  
- [ ] Retry Logic
  - При ошибке сети → повтор через 5 сек
  - Максимум 3 попытки
  - Сохранение в localStorage при неудаче
  
- [ ] Оптимизация payload
  - Сжатие данных (удаление пустых полей)
  - Ограничение размера (макс 10 KB)

**Критерии приемки**:
- ✅ События отправляются пакетами
- ✅ sendBeacon работает при закрытии страницы
- ✅ Retry logic обрабатывает ошибки сети
- ✅ Размер payload оптимизирован

---

### ⏳ Фаза 5: Testing & Integration (День 7)
**Ответственность**: QA Engineer + Frontend Developer

**Задачи**:
- [ ] Тестирование на тестовом Tilda сайте
  - Создать тестовую страницу на Tilda
  - Интегрировать коллектор
  - Проверить все типы событий
  
- [ ] Проверка RLS политик
  - Попытка SELECT через anon ключ (должна провалиться)
  - Проверка INSERT через anon ключ (должна пройти)
  
- [ ] Валидация данных
  - Проверить корректность payload
  - Проверить типы данных полей
  - Проверить партиционирование
  
- [ ] Создание инструкции по интеграции
  - Шаг за шагом для Tilda
  - Примеры кода
  - Troubleshooting секция

**Критерии приемки**:
- ✅ Все события корректно записываются
- ✅ RLS политики работают как ожидается
- ✅ Данные валидны и структурированы
- ✅ Инструкция написана и протестирована

---

### ⏳ Фаза 6: Documentation (День 8)
**Ответственность**: Technical Writer + Developer

**Задачи**:
- [ ] `README.md`
  - Quick start guide
  - Примеры использования
  - Ссылки на документацию
  
- [ ] `docs/deployment.md`
  - Развертывание на Supabase
  - Хостинг JavaScript файла
  - Настройка CDN (опционально)
  
- [ ] `docs/analytics-queries.md`
  - Примеры SQL запросов
  - Дашборды для Retool
  - Интеграция с MindsDB
  
- [ ] Inline комментарии в коде
  - JSDoc для функций
  - Комментарии для сложной логики

**Критерии приемки**:
- ✅ Документация полная и актуальная
- ✅ Примеры кода рабочие
- ✅ SQL запросы протестированы

---

### ⏳ Фаза 7: Advanced Features (Неделя 2)
**Опциональные улучшения**

**Возможные задачи**:
- [ ] Session Replay (запись DOM mutations)
- [ ] Heatmaps (визуализация кликов)
- [ ] A/B Testing встроенная платформа
- [ ] Real-time alerts через Supabase Realtime
- [ ] Custom Events API (расширенный)
- [ ] Data Warehouse экспорт (BigQuery/Snowflake)

---

## 📈 Примеры использования

### 1. Конверсия по источникам трафика
```sql
SELECT 
  utm_source,
  COUNT(DISTINCT s.session_id) as sessions,
  COUNT(DISTINCT u.user_id) FILTER (WHERE u.contact_data != '{}'::jsonb) as conversions,
  ROUND(100.0 * 
    COUNT(DISTINCT u.user_id) FILTER (WHERE u.contact_data != '{}'::jsonb) / 
    COUNT(DISTINCT s.session_id), 2
  ) as conversion_rate
FROM sessions s
JOIN users u ON u.user_id = s.user_id
WHERE s.created_at > NOW() - INTERVAL '30 days'
GROUP BY utm_source
ORDER BY conversion_rate DESC;
```

### 2. Воронка конверсии
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

### 3. ML-прогнозирование (MindsDB)
```sql
-- Создание модели
CREATE PREDICTOR user_conversion_predictor
FROM supabase_integration
  (SELECT 
    u.user_id,
    u.total_sessions,
    COUNT(e.id) FILTER (WHERE e.event_type = 'click') as total_clicks,
    AVG((e.payload->'scroll'->>'scrollPercent')::float) as avg_scroll_depth,
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
1. ✅ Используйте только **anon-key** в JavaScript
2. ✅ **RLS политики** обязательны для защиты данных
3. ✅ Валидация payload через **CHECK constraints**
4. ❌ **НИКОГДА** не отправляйте пароли или данные карт

### Производительность
1. ✅ **Партиционирование `events`** - критично!
2. ✅ **Batch отправка** - не более 1 запроса в 5 сек
3. ✅ **Debounce** на scroll/mousemove (200-500ms)
4. ✅ **Индексы** на всех FK и часто используемых полях

### GDPR & Privacy
1. ⚖️ **Cookie consent** - добавить проверку перед инициализацией
2. ⚖️ **Right to be forgotten** - механизм удаления через CASCADE
3. ⚖️ **IP адреса** - опционально, требует согласия
4. ⚖️ **Anonymization** - хеширование contact_data (опционально)

---

## 📊 Метрики успеха

### Технические метрики:
- ✅ Время инициализации < 100ms
- ✅ Потеря событий < 1%
- ✅ Размер скрипта < 50 KB (minified)
- ✅ Время отправки batch < 200ms

### Бизнес метрики:
- 📈 Конверсия форм (отслеживается)
- 📈 Глубина скролла (вовлеченность)
- 📈 Топ источники трафика (ROI рекламы)
- 📈 ML prediction accuracy > 80%

---

## 🎓 Обучающие ресурсы

### Для Frontend разработчиков:
- [Supabase JS Client Documentation](https://supabase.com/docs/reference/javascript)
- [FingerprintJS Documentation](https://dev.fingerprintjs.com/)
- [Event Delegation Best Practices](https://javascript.info/event-delegation)

### Для Backend разработчиков:
- [PostgreSQL Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [JSONB Performance Tips](https://www.postgresql.org/docs/current/datatype-json.html)

### Для аналитиков:
- [SQL Window Functions](https://www.postgresql.org/docs/current/tutorial-window.html)
- [MindsDB Integration](https://docs.mindsdb.com/)
- [Funnel Analysis in SQL](https://mode.com/sql-tutorial/sql-funnel-analysis/)

---

## ✅ Следующие шаги

### Немедленные действия:
1. ⏳ **Создать проект в Supabase** (5 минут)
2. ⏳ **Написать SQL схему** (Фаза 1, День 1)
3. ⏳ **Разработать JavaScript коллектор** (Фаза 2-3, День 2-5)

### Документы для изучения:
1. 📖 `PROJECT_PLAN.md` - детальный план на 8 фаз
2. 🏗️ `ARCHITECTURE.md` - техническая архитектура + диаграммы
3. 📊 `docs/data-schema.md` - полное описание структуры БД
4. 🔧 `frontend/tilda-integration-guide.md` - интеграция в Tilda

---

## 🤝 Контакты

**Вопросы по проекту**: Создайте Issue в репозитории  
**Техническая поддержка**: Изучите документацию в `/docs`  
**Контрибьюция**: PR приветствуются!

---

**Статус**: 🚧 Планирование завершено, переход к разработке  
**Текущая фаза**: Фаза 0 → Фаза 1  
**Версия**: 0.1.0-alpha  
**Последнее обновление**: 2025-12-22
