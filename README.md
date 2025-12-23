# Tilda Analytics - Система сбора данных и поведенческой аналитики
> **Behavioral Data Collector** для сайтов на Tilda с бэкендом на Supabase
[![Status](https://img.shields.io/badge/status-in_development-yellow)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue)]()
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)]()
---
## 🚀 Быстрый старт
### 1. Подготовка Supabase
```bash
# 1. Создайте проект на supabase.com
# 2. Скопируйте URL и anon-key из Project Settings > API
# 3. Выполните SQL из файла database/schema.sql в SQL Editor
```
### 2. Интеграция в Tilda
```html
<!-- Вставьте в настройки сайта Tilda: Site Settings > Advanced > Code before </head> -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="https://cdn.jsdelivr.net/npm/@fingerprintjs/fingerprintjs@3"></script>
<script src="https://your-domain.com/collector.js"></script>
<script>
  TildaAnalytics.init({
    supabaseUrl: 'https://xxxxx.supabase.co',
    supabaseKey: 'your-anon-key-here'
  });
</script>
```
### 3. Проверка работы
Откройте Supabase > Table Editor > events  
Обновите страницу сайта → должны появиться события `page_view`, `click`, `scroll`
---
## 📁 Структура проекта
```
tilda-analytics/
├── 📄 README.md                    # Этот файл
├── 📄 PROJECT_PLAN.md              # Детальный план разработки
├── 📄 ARCHITECTURE.md              # Техническая архитектура
├── 📂 database/
│   ├── schema.sql                  # SQL схема (users, sessions, events)
│   ├── rls_policies.sql            # Политики безопасности
│   └── indexes.sql                 # Индексы для производительности
├── 📂 frontend/
│   ├── collector.js                # Основной скрипт сборщика
│   ├── config.example.js           # Пример конфигурации
│   └── tilda-integration-guide.md  # Инструкция для Tilda
└── 📂 docs/
    ├── deployment.md               # Руководство по развертыванию
    ├── data-schema.md              # Описание структуры данных
    └── analytics-queries.md        # SQL запросы для аналитики
```
---
## 🎯 Возможности
### Сбор данных
- ✅ **Уникальные посетители** - через FingerprintJS
- ✅ **Сессии** - автоматическое определение новых визитов
- ✅ **UTM метки** - полный парсинг источников трафика
- ✅ **События клика** - все взаимодействия с кнопками и ссылками
- ✅ **Глубина скролла** - отслеживание вовлеченности
- ✅ **Отправка форм** - автоматический перехват Tilda форм
- ✅ **Поведенческие метрики** - время на странице, скорость скролла, и др.
### Аналитика
- 📊 **Real-time дашборды** - через Retool/JetAdmin
- 🤖 **ML прогнозирование** - интеграция с MindsDB
- 🔍 **SQL запросы** - прямой доступ к PostgreSQL
- 📈 **Воронки конверсии** - анализ пути пользователя
- 🎯 **Сегментация** - по источникам, устройствам, поведению
### Безопасность
- 🔒 **Row Level Security** - защита данных через RLS политики
- 🚫 **Публичный доступ** - только INSERT, SELECT запрещен
- ✅ **Валидация данных** - через CHECK constraints
- 🛡️ **Rate limiting** - защита от спама
---
## 📊 Пример данных
### Таблица `users`
```sql
user_id              | device_fingerprint | first_seen_at       | contact_data
---------------------|-------------------|---------------------|------------------------
550e8400-e29b-...   | a1b2c3d4e5f6      | 2025-12-22 10:00   | {"email": "user@.com"}
```
### Таблица `sessions`
```sql
session_id | user_id | utm_source | utm_campaign | device_type | created_at
-----------|---------|-----------|--------------|-------------|-------------------
abc-123... | 550e... | google    | winter-sale  | desktop     | 2025-12-22 10:00
```
### Таблица `events`
```sql
id  | session_id | event_type | target_text    | payload
----|-----------|-----------|----------------|----------------------------------
1   | abc-123   | click     | Купить сейчас  | {"click": {"x": 450, "y": 320}}
2   | abc-123   | scroll    | null           | {"scroll": {"scrollPercent": 75}}
3   | abc-123   | form_submit| null          | {"form": {"email": "test@.com"}}
```
---
## 📈 Примеры аналитических запросов
### Конверсия по источникам трафика
```sql
SELECT 
  utm_source,
  COUNT(DISTINCT s.session_id) as sessions,
  COUNT(DISTINCT e.id) FILTER (WHERE e.event_type = 'form_submit') as conversions,
  ROUND(100.0 * 
    COUNT(DISTINCT e.id) FILTER (WHERE e.event_type = 'form_submit') / 
    COUNT(DISTINCT s.session_id), 2
  ) as conversion_rate
FROM sessions s
LEFT JOIN events e ON e.session_id = s.session_id
WHERE s.created_at > NOW() - INTERVAL '30 days'
GROUP BY utm_source
ORDER BY conversion_rate DESC;
```
### Средняя глубина скролла
```sql
SELECT 
  page_url,
  AVG((payload->'scroll'->>'scrollPercent')::float) as avg_scroll_depth,
  COUNT(*) as scroll_events
FROM events
WHERE event_type = 'scroll'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY page_url
ORDER BY avg_scroll_depth DESC;
```
### Топ кликов по элементам
```sql
SELECT 
  target_element,
  target_text,
  COUNT(*) as clicks,
  COUNT(DISTINCT session_id) as unique_users
FROM events
WHERE event_type = 'click'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY target_element, target_text
ORDER BY clicks DESC
LIMIT 20;
```
---
## 🔮 Интеграция с MindsDB
### Прогнозирование конверсии
```sql
-- Создание ML модели
CREATE PREDICTOR user_conversion_predictor
FROM supabase_integration
  (SELECT 
    u.user_id,
    u.total_sessions,
    COUNT(e.id) as total_events,
    COUNT(e.id) FILTER (WHERE e.event_type = 'click') as total_clicks,
    AVG((e.payload->'scroll'->>'scrollPercent')::float) as avg_scroll_depth,
    MAX(CASE WHEN e.event_type = 'form_submit' THEN 1 ELSE 0 END) as converted
  FROM users u
  LEFT JOIN sessions s ON s.user_id = u.user_id
  LEFT JOIN events e ON e.session_id = s.session_id
  GROUP BY u.user_id)
PREDICT converted;
-- Использование модели
SELECT 
  user_id,
  converted as prediction,
  confidence
FROM user_conversion_predictor
WHERE user_id = '550e8400-e29b-...';
```
---
## 🛠️ Технические детали
### Требования
- **Supabase**: Free tier (до 500 MB БД)
- **Tilda**: Любой тарифный план с доступом к `<head>`
- **Браузеры**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
### Производительность
- **Batch отправка**: События отправляются пакетами раз в 5 секунд
- **Debouncing**: Scroll/mousemove с задержкой 200ms
- **Beacon API**: Гарантированная доставка при закрытии страницы
- **Партиционирование**: Автоматические месячные партиции для `events`
### Ограничения
- Максимум 10 событий в буфере
- Максимум 10 KB на payload
- Rate limit: 100 событий/минуту с одного IP
---
## 📖 Документация
- 📄 [Детальный план проекта](./PROJECT_PLAN.md)
- 🏗️ [Архитектура системы](./ARCHITECTURE.md)
- 🚀 [Руководство по развертыванию](./docs/deployment.md) *(в разработке)*
- 📊 [Описание структуры данных](./docs/data-schema.md) *(в разработке)*
- 🔍 [Аналитические запросы](./docs/analytics-queries.md) *(в разработке)*
---
## 🗺️ Roadmap
### ✅ Фаза 1: MVP (Неделя 1)
- [x] Планирование и архитектура
- [ ] SQL схема базы данных
- [ ] RLS политики
- [ ] JavaScript collector (базовая версия)
### 🔄 Фаза 2: Основной функционал (Неделя 2)
- [ ] Click tracking
- [ ] Scroll tracking
- [ ] Form interceptor для Tilda
- [ ] UTM парсер
- [ ] Device detection
### 🔜 Фаза 3: Оптимизация (Неделя 3)
- [ ] Event batching
- [ ] Performance optimization
- [ ] Error handling
- [ ] Тестирование на реальном сайте
### 💡 Фаза 4: Advanced Features (Будущее)
- [ ] Session replay
- [ ] Heatmaps
- [ ] A/B testing
- [ ] Real-time alerts
- [ ] Custom events API
---
## 🤝 Контрибьюция
Проект находится в активной разработке. Контрибьюции приветствуются!
1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request
---
## 📝 Лицензия
MIT License - смотрите файл [LICENSE](./LICENSE)
---
## 👨‍💻 Автор
**Senior Fullstack Developer & Data Architect**
- Специализация: Event-driven архитектура, PostgreSQL, Behavioral Analytics
- Стек: JavaScript (ES6+), PostgreSQL, Supabase, MindsDB
---
## 📞 Поддержка
Если у вас возникли вопросы или проблемы:
1. Проверьте [документацию](./docs/)
2. Изучите [примеры запросов](./docs/analytics-queries.md)
3. Создайте [Issue](../../issues)
---
**Статус**: 🚧 В разработке  
**Версия**: 0.1.0-alpha  
**Последнее обновление**: 2025-12-22
