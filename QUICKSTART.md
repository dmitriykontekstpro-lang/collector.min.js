# ⚡ Quick Start - Tilda Analytics

## 📋 Что уже готово (Phase 0 - Planning)

✅ **Структура проекта создана**
```
tilda-analytics/
├── 📄 README.md                           ✅ Главная документация
├── 📄 PROJECT_PLAN.md                     ✅ Детальный план (8 фаз)
├── 📄 ARCHITECTURE.md                     ✅ Техническая архитектура
├── 📄 SUMMARY.md                          ✅ Итоговое резюме
├── 📂 database/                           ⏳ TODO
├── 📂 frontend/
│   ├── config.example.js                  ✅ Пример конфигурации
│   └── tilda-integration-guide.md         ✅ Инструкция по интеграции
└── 📂 docs/
    └── data-schema.md                     ✅ Описание структуры БД
```

---

## 🚀 Следующие шаги (Step-by-Step)

### Шаг 1: Изучите документацию (15 минут)

**Обязательно к прочтению**:
1. 📖 `SUMMARY.md` - краткий обзор всего проекта
2. 📊 `docs/data-schema.md` - структура базы данных
3. 🔧 `frontend/tilda-integration-guide.md` - как интегрировать в Tilda

**Дополнительно**:
- `PROJECT_PLAN.md` - если нужны детали по каждой фазе
- `ARCHITECTURE.md` - для понимания технической архитектуры

---

### Шаг 2: Создайте проект в Supabase (5 минут)

1. Перейдите на [supabase.com](https://supabase.com)
2. Нажмите **"New Project"**
3. Заполните:
   - **Name**: `tilda-analytics` (или любое другое)
   - **Database Password**: придумайте сильный пароль
   - **Region**: выберите ближайший регион
4. Дождитесь создания проекта (~2 минуты)

---

### Шаг 3: Сохраните credentials (2 минуты)

1. Откройте **Project Settings → API**
2. Скопируйте:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public (API Key)**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

📝 **Сохраните в безопасное место** (понадобятся на Шаге 6)

---

### Шаг 4: Создайте SQL схему базы данных (30 минут)

**TODO**: Создать файл `database/schema.sql`

**Что нужно включить**:

#### 4.1 Таблица `users`
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

#### 4.2 Таблица `sessions`
```sql
CREATE TABLE sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    yclid TEXT,
    gclid TEXT,
    fbclid TEXT,
    referrer TEXT,
    entry_url TEXT NOT NULL,
    user_agent TEXT,
    ip_address INET,
    device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
    os TEXT,
    browser TEXT,
    screen_resolution TEXT,
    viewport_size TEXT,
    language TEXT,
    timezone TEXT,
    session_duration INTEGER DEFAULT 0,
    pages_viewed INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);
```

#### 4.3 Таблица `events` (с партиционированием)
```sql
CREATE TABLE events (
    id BIGSERIAL,
    session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'click', 'scroll', 'form_submit', 'form_focus', 'mouse_hover', 'page_exit', 'custom_goal')),
    page_url TEXT NOT NULL,
    target_element TEXT,
    target_text TEXT,
    target_href TEXT,
    target_classes TEXT[],
    target_id TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Создание первой партиции (декабрь 2025)
CREATE TABLE events_2025_12 PARTITION OF events
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');
```

#### 4.4 Индексы
```sql
-- Users
CREATE UNIQUE INDEX idx_users_fingerprint ON users(device_fingerprint);
CREATE INDEX idx_users_email ON users USING GIN ((contact_data->'email'));

-- Sessions
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX idx_sessions_utm ON sessions(utm_source, utm_medium, utm_campaign);

-- Events
CREATE INDEX idx_events_session_id ON events(session_id, created_at DESC);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_payload_gin ON events USING GIN (payload);
```

#### 4.5 Триггеры (автообновление timestamps)
```sql
-- Функция для автообновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для users
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

**Выполнение**:
1. Скопируйте весь SQL код
2. Откройте Supabase → **SQL Editor**
3. Создайте **New Query**
4. Вставьте код
5. Нажмите **Run**

---

### Шаг 5: Создайте RLS политики (15 минут)

**TODO**: Создать файл `database/rls_policies.sql`

```sql
-- Включение RLS на всех таблицах
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- USERS TABLE POLICIES
-- ===========================================

-- Политика 1: anon может только вставлять
CREATE POLICY "anon_insert_only_users" ON users
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Политика 2: anon НЕ МОЖЕТ читать
CREATE POLICY "anon_no_select_users" ON users
    FOR SELECT
    TO anon
    USING (false);

-- Политика 3: authenticated полный доступ
CREATE POLICY "auth_full_access_users" ON users
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ===========================================
-- SESSIONS TABLE POLICIES
-- ===========================================

CREATE POLICY "anon_insert_only_sessions" ON sessions
    FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "anon_no_select_sessions" ON sessions
    FOR SELECT
    TO anon
    USING (false);

CREATE POLICY "auth_full_access_sessions" ON sessions
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ===========================================
-- EVENTS TABLE POLICIES
-- ===========================================

CREATE POLICY "anon_insert_only_events" ON events
    FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "anon_no_select_events" ON events
    FOR SELECT
    TO anon
    USING (false);

CREATE POLICY "auth_select_events" ON events
    FOR SELECT
    TO authenticated
    USING (true);
```

**Выполнение**:
1. Откройте Supabase → **SQL Editor**
2. Создайте **New Query**
3. Вставьте код выше
4. Нажмите **Run**

**Проверка**:
```sql
-- Должно вернуть все политики
SELECT * FROM pg_policies 
WHERE tablename IN ('users', 'sessions', 'events');
```

---

### Шаг 6: Разработайте JavaScript коллектор (2-3 дня)

**TODO**: Создать файл `frontend/collector.js`

**Основные модули** (см. `ARCHITECTURE.md` для деталей):

#### 6.1 Initialization
```javascript
const TildaAnalytics = {
  config: null,
  supabase: null,
  userId: null,
  sessionId: null,
  
  init(config) {
    this.config = { ...defaultConfig, ...config };
    this.supabase = supabase.createClient(
      config.supabaseUrl,
      config.supabaseKey
    );
    
    this.userId = await this.getOrCreateUserId();
    this.sessionId = this.getOrCreateSessionId();
    
    this.initEventListeners();
    
    if (this.config.debug) {
      console.log('✅ Tilda Analytics initialized', {
        userId: this.userId,
        sessionId: this.sessionId
      });
    }
  }
};
```

#### 6.2 Identity Management
```javascript
async getOrCreateUserId() {
  // Попытка 1: FingerprintJS (если доступен)
  if (window.FingerprintJS) {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId;
  }
  
  // Попытка 2: localStorage
  let userId = localStorage.getItem('analytics_user_id');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('analytics_user_id', userId);
  }
  return userId;
}
```

#### 6.3 Event Tracking
```javascript
// Click tracking
document.body.addEventListener('click', (e) => {
  const data = {
    click: {
      x: e.clientX,
      y: e.clientY,
      button: e.button
    },
    timing: {
      timeOnPage: performance.now()
    }
  };
  
  this.track('click', {
    target_element: getCSSPath(e.target),
    target_text: e.target.innerText?.substring(0, 100),
    target_href: e.target.href,
    payload: data
  });
});
```

**Полный шаблон** смотрите в `ARCHITECTURE.md` (Модуль 6)

---

### Шаг 7: Тестирование (1 день)

1. **Создайте тестовую страницу на Tilda**
2. **Интегрируйте коллектор** (см. `frontend/tilda-integration-guide.md`)
3. **Включите debug режим**:
   ```javascript
   TildaAnalytics.init({
     supabaseUrl: 'YOUR_URL',
     supabaseKey: 'YOUR_KEY',
     debug: true  // ← Включить логи
   });
   ```
4. **Откройте консоль браузера** (F12)
5. **Выполните действия**:
   - Откройте страницу → должно появиться `page_view`
   - Кликните на кнопку → должно появиться `click`
   - Прокрутите страницу → должно появиться `scroll`
6. **Проверьте данные в Supabase**:
   - Table Editor → `events`
   - Должны появиться записи

---

## 📊 Checklist полной интеграции

### Phase 0: Planning ✅
- [x] Создана структура проекта
- [x] Написана документация
- [x] Описана архитектура

### Phase 1: Database Setup ⏳
- [ ] Создан файл `database/schema.sql`
- [ ] Создан файл `database/rls_policies.sql`
- [ ] SQL выполнен в Supabase
- [ ] Таблицы созданы успешно
- [ ] RLS политики работают
- [ ] Тестовый INSERT выполнен

### Phase 2: Core JavaScript ⏳
- [ ] Создан файл `frontend/collector.js`
- [ ] Реализована инициализация Supabase
- [ ] Реализован Identity Management
- [ ] Реализован UTM Parser
- [ ] Реализован Device Detection
- [ ] Добавлены Performance Metrics

### Phase 3: Event Tracking ⏳
- [ ] Реализован Click Tracker
- [ ] Реализован Scroll Tracker
- [ ] Реализован Form Interceptor (Tilda)
- [ ] Добавлен Page Visibility API
- [ ] Добавлен Mouse Movement (опционально)

### Phase 4: Optimization ⏳
- [ ] Реализован Event Batching
- [ ] Добавлен navigator.sendBeacon
- [ ] Реализован Retry Logic
- [ ] Оптимизирован размер payload

### Phase 5: Testing ⏳
- [ ] Создана тестовая страница на Tilda
- [ ] Интегрирован коллектор
- [ ] Проверена работа всех событий
- [ ] Проверены RLS политики
- [ ] Валидация данных

### Phase 6: Production ⏳
- [ ] Отключен debug режим
- [ ] Загружен коллектор на CDN/хостинг
- [ ] Интегрирован на production сайт
- [ ] Настроены дашборды (Retool/JetAdmin)
- [ ] Настроена интеграция с MindsDB

---

## 🎓 Полезные ссылки

### Документация проекта:
- 📖 [SUMMARY.md](./SUMMARY.md) - Итоговое резюме
- 🏗️ [ARCHITECTURE.md](./ARCHITECTURE.md) - Техническая архитектура
- 📊 [docs/data-schema.md](./docs/data-schema.md) - Структура БД
- 🔧 [frontend/tilda-integration-guide.md](./frontend/tilda-integration-guide.md) - Интеграция в Tilda

### Внешние ресурсы:
- [Supabase Documentation](https://supabase.com/docs)
- [FingerprintJS Guide](https://dev.fingerprintjs.com/)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [Tilda Help Center](https://help-ru.tilda.cc/)

---

## ⚡ Quick Commands

### Проверка структуры проекта
```powershell
tree /F /A
```

### Открыть файлы для редактирования
```powershell
# SQL схема
code database/schema.sql

# JavaScript коллектор
code frontend/collector.js

# RLS политики
code database/rls_policies.sql
```

### Создать недостающие файлы
```powershell
# Создать файлы базы данных
New-Item -ItemType File -Path "database\schema.sql" -Force
New-Item -ItemType File -Path "database\rls_policies.sql" -Force
New-Item -ItemType File -Path "database\indexes.sql" -Force

# Создать JavaScript коллектор
New-Item -ItemType File -Path "frontend\collector.js" -Force
```

---

## 🚨 Troubleshooting

### Проблема: SQL ошибка при создании таблиц
**Решение**: Проверьте, что вы создаете таблицы в правильном порядке:
1. `users` (независимая)
2. `sessions` (зависит от `users`)
3. `events` (зависит от `sessions`)

### Проблема: RLS блокирует INSERT
**Решение**: Убедитесь, что использован правильный ключ:
- ✅ **anon key** для frontend (публичный)
- ❌ **service_role key** только для backend (секретный)

### Проблема: События не отправляются
**Решение**:
1. Откройте консоль браузера (F12)
2. Включите `debug: true` в конфигурации
3. Проверьте наличие ошибок
4. Проверьте URL и ключ Supabase

---

## 📞 Поддержка

**Если застряли**:
1. Проверьте документацию в `/docs`
2. Изучите примеры в `ARCHITECTURE.md`
3. Создайте Issue с описанием проблемы

---

**Удачи в разработке! 🚀**

**Версия**: 1.0.0  
**Последнее обновление**: 2025-12-22
