# ✅ ГОТОВО К ВСТАВКЕ В TILDA

**Ваш Supabase Project**: https://qqfyjrugrinmdijpsutj.supabase.co  
**API Key**: sb_publishable_KzDns19CaSpI-40YZgPPCg_hCDb-1Iz

---

## 🚀 ПОШАГОВАЯ ИНСТРУКЦИЯ

### ⚠️ ВАЖНО! Сначала создайте таблицы в Supabase

**БЕЗ ЭТОГО СКРИПТ НЕ БУДЕТ РАБОТАТЬ!**

1. Откройте https://app.supabase.com
2. Выберите ваш проект `qqfyjrugrinmdijpsutj`
3. Перейдите в **SQL Editor**
4. Выполните эти SQL скрипты:

#### SQL Скрипт 1: Создание таблиц

```sql
-- Таблица пользователей
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  device_fingerprint TEXT,
  contact_data JSONB,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_fingerprint ON users(device_fingerprint);

-- Таблица сессий
CREATE TABLE sessions (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(user_id),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  yclid TEXT,
  gclid TEXT,
  fbclid TEXT,
  referrer TEXT,
  entry_url TEXT,
  user_agent TEXT,
  device_type TEXT,
  os TEXT,
  browser TEXT,
  screen_resolution TEXT,
  viewport_size TEXT,
  language TEXT,
  timezone TEXT,
  session_duration INTEGER,
  pages_viewed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX idx_sessions_session_id ON sessions(session_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_created_at ON sessions(created_at);

-- Таблица событий
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  page_url TEXT,
  target_element TEXT,
  target_text TEXT,
  target_href TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_session_id ON events(session_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_events_payload ON events USING GIN(payload);
```

#### SQL Скрипт 2: Настройка безопасности (RLS)

```sql
-- Включаем Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Политики для users
CREATE POLICY "anon_users_insert" ON users
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_users_update" ON users
  FOR UPDATE TO anon USING (true);

-- Политики для sessions
CREATE POLICY "anon_sessions_insert" ON sessions
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_sessions_update" ON sessions
  FOR UPDATE TO anon USING (true);

-- Политики для events
CREATE POLICY "anon_events_insert" ON events
  FOR INSERT TO anon WITH CHECK (true);

-- Для авторизованных пользователей (дашборды)
CREATE POLICY "authenticated_full_access_users" ON users
  FOR ALL TO authenticated USING (true);

CREATE POLICY "authenticated_full_access_sessions" ON sessions
  FOR ALL TO authenticated USING (true);

CREATE POLICY "authenticated_full_access_events" ON events
  FOR ALL TO authenticated USING (true);
```

---

## 📝 Теперь вставьте код в Tilda

### Шаг 1: Откройте настройки сайта в Tilda

**Site Settings → Advanced → HTML code for site**

---

### Шаг 2: Вставьте в "Code in &lt;head&gt;"

Скопируйте и вставьте этот код:

```html
<!-- Supabase JS Client -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- FingerprintJS для точной идентификации -->
<script src="https://cdn.jsdelivr.net/npm/@fingerprintjs/fingerprintjs@3"></script>
```

---

### Шаг 3: Вставьте в "Code before &lt;/body&gt;"

**ВАЖНО**: Вам нужно вставить 2 блока кода:

#### Блок А: Основной скрипт (из файла FINAL_SCRIPT.js)

```html
<script>
/**
 * Tilda Analytics Behavioral Data Collector
 * Версия: 2.0.1
 */

// ===== СКОПИРУЙТЕ СЮДА ВЕСЬ КОД ИЗ ФАЙЛА FINAL_SCRIPT.js =====
// Откройте файл: c:\Users\Дмитрий\.gemini\antigravity\playground\tilda-analytics\FINAL_SCRIPT.js
// Скопируйте ВСЁ содержимое (1394 строки)
// Вставьте сюда

</script>
```

#### Блок Б: Инициализация с вашими данными

```html
<script>
  // Инициализация Tilda Analytics с вашими данными Supabase
  TildaAnalytics.init({
    // ===== ВАШИ ДАННЫЕ =====
    supabaseUrl: 'https://qqfyjrugrinmdijpsutj.supabase.co',
    supabaseKey: 'sb_publishable_KzDns19CaSpI-40YZgPPCg_hCDb-1Iz',
    
    // ===== НАСТРОЙКИ =====
    debug: true,  // На продакшене поставьте false!
    
    // ID Яндекс.Метрики (если используете)
    // yandexMetrikaId: 87654321,  // Раскомментируйте и укажите ваш ID
    
    batchInterval: 5000,
    maxBatchSize: 10,
    sessionTimeout: 1800000,
    trackMouseMovement: false,
    scrollDebounce: 200,
    mouseDebounce: 500,
    scrollThresholds: [25, 50, 75, 90, 100],
    useFingerprintJS: true,
    requireConsent: false,
    
    callbacks: {
      onInit: function(userId, sessionId) {
        console.log('✅ Analytics started:', userId);
      },
      onBatchSent: function(count) {
        console.log('📤 Sent', count, 'events');
      },
      onError: function(error) {
        console.error('❌ Error:', error);
      }
    }
  });
</script>
```

---

## 🧪 Проверка работы

### 1. Откройте ваш сайт Tilda

### 2. Откройте консоль браузера (F12)

Вы должны увидеть:
```
[TildaAnalytics] ✅ Tilda Analytics initialized
  userId: "a1b2c3d4-..."
  sessionId: "7c8d9e0f-..."
  fingerprint: "..."

✅ Analytics started: a1b2c3d4-...
📤 Sent 1 events
```

### 3. Проверьте данные в Supabase

1. Откройте https://app.supabase.com
2. Выберите проект `qqfyjrugrinmdijpsutj`
3. Table Editor → `events`
4. Должны появиться записи:
   - `event_type: 'page_view'`
   - `payload` с метриками

### 4. Проверьте все таблицы

```sql
-- Проверка users
SELECT * FROM users ORDER BY created_at DESC LIMIT 5;

-- Проверка sessions
SELECT * FROM sessions ORDER BY created_at DESC LIMIT 5;

-- Проверка events
SELECT 
  event_type,
  created_at,
  payload->'metrics'->>'total_clicks' as clicks
FROM events 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## ✅ Готово!

После выполнения всех шагов:

- ✅ Таблицы созданы в Supabase
- ✅ RLS политики настроены
- ✅ Скрипт вставлен в Tilda
- ✅ Данные записываются

**Что собирается**:
- 50 поведенческих метрик
- Цели Яндекс.Метрики (если подключите)
- Email/Phone из форм
- События: page_view, click, scroll, form_submit

**Куда сохраняется**:
- Supabase (PostgreSQL)
- Таблица `events`
- Готово для анализа в Retool/JetAdmin
- Готово для ML в MindsDB

---

## 📁 Файлы проекта

- `FINAL_SCRIPT.js` - основной скрипт (54 KB)
- `PASTE_THIS_IN_TILDA.txt` - инструкция с кодом
- `HOW_TO_USE.md` - подробная документация
- `QUICKSTART.md` - быстрый старт с SQL

---

## 🆘 Если что-то не работает

### Ошибка: "Supabase JS client not loaded"
→ Добавьте библиотеку Supabase в `<head>`

### Ошибка: "Failed to insert"
→ Проверьте, что таблицы созданы и RLS настроен

### Ошибка: 401 Unauthorized
→ Проверьте правильность API key

### События не записываются
→ Откройте консоль (F12) и проверьте ошибки

---

**Удачи! 🚀**

📊 После запуска вы получите детальную аналитику поведения пользователей для ML-прогнозирования конверсий!
