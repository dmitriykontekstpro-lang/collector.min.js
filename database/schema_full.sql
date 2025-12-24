-- ============================================================
-- TILDA ANALYTICS - SQL СХЕМА
-- Версия: 2.0.1 (обновлено 2025-12-23)
-- Supabase Project: qqfyjrugrinmdijpsutj
-- ============================================================

-- ============================================================
-- ТАБЛИЦА 1: USERS (Пользователи)
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  device_fingerprint TEXT,
  contact_data JSONB DEFAULT '{}'::jsonb,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_fingerprint ON users(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen_at DESC);

-- Автоматическое обновление updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ТАБЛИЦА 2: SESSIONS (Сессии/Визиты)
-- ============================================================

CREATE TABLE IF NOT EXISTS sessions (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL UNIQUE,
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
  
  -- Контекст визита
  referrer TEXT,
  entry_url TEXT,
  user_agent TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  os TEXT,
  browser TEXT,
  screen_resolution TEXT,
  viewport_size TEXT,
  language TEXT,
  timezone TEXT,
  
  -- Метрики сессии
  session_duration INTEGER DEFAULT 0,
  pages_viewed INTEGER DEFAULT 0,
  
  -- Временные метки
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Индексы для аналитики
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_device_type ON sessions(device_type);
CREATE INDEX IF NOT EXISTS idx_sessions_utm_source ON sessions(utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_utm_campaign ON sessions(utm_campaign) WHERE utm_campaign IS NOT NULL;

-- ============================================================
-- ТАБЛИЦА 3: EVENTS (События)
-- ============================================================

CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  page_url TEXT,
  target_element TEXT,
  target_text TEXT,
  target_href TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для быстрых запросов
CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_payload ON events USING GIN(payload);

-- Составной индекс для аналитики
CREATE INDEX IF NOT EXISTS idx_events_type_created ON events(event_type, created_at DESC);

-- Индекс для поиска целей Яндекс.Метрики
CREATE INDEX IF NOT EXISTS idx_events_yandex_goals 
ON events(created_at DESC) 
WHERE event_type = 'yandex_goal';

-- ============================================================
-- ПАРТИЦИОНИРОВАНИЕ (для больших объемов данных)
-- ============================================================

-- Создание партиций по месяцам для таблицы events
-- Раскомментируйте если планируете хранить > 1М событий

-- CREATE TABLE events_2025_01 PARTITION OF events
-- FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- CREATE TABLE events_2025_02 PARTITION OF events
-- FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- ============================================================
-- ПРЕДСТАВЛЕНИЯ (VIEWS) для быстрой аналитики
-- ============================================================

-- Статистика по типам событий
CREATE OR REPLACE VIEW events_stats AS
SELECT 
  event_type,
  COUNT(*) as count,
  DATE(created_at) as date
FROM events
GROUP BY event_type, DATE(created_at)
ORDER BY date DESC, count DESC;

-- Активные пользователи за последние 7 дней
CREATE OR REPLACE VIEW active_users_7d AS
SELECT 
  u.user_id,
  u.device_fingerprint,
  u.contact_data,
  COUNT(DISTINCT s.session_id) as sessions_count,
  MAX(u.last_seen_at) as last_activity
FROM users u
LEFT JOIN sessions s ON u.user_id = s.user_id
WHERE u.last_seen_at > NOW() - INTERVAL '7 days'
GROUP BY u.user_id, u.device_fingerprint, u.contact_data
ORDER BY last_activity DESC;

-- Конверсионная воронка
CREATE OR REPLACE VIEW conversion_funnel AS
SELECT 
  DATE(e.created_at) as date,
  COUNT(DISTINCT CASE WHEN e.event_type = 'page_view' THEN e.session_id END) as page_views,
  COUNT(DISTINCT CASE WHEN e.event_type = 'click' THEN e.session_id END) as clicks,
  COUNT(DISTINCT CASE WHEN e.event_type = 'form_submit' THEN e.session_id END) as form_submits,
  COUNT(DISTINCT CASE WHEN e.event_type = 'yandex_goal' THEN e.session_id END) as goals
FROM events e
GROUP BY DATE(e.created_at)
ORDER BY date DESC;

-- ============================================================
-- ФУНКЦИИ для аналитики
-- ============================================================

-- Получить все метрики сессии
CREATE OR REPLACE FUNCTION get_session_metrics(p_session_id UUID)
RETURNS TABLE (
  event_type TEXT,
  event_count BIGINT,
  metrics JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.event_type,
    COUNT(*) as event_count,
    jsonb_agg(e.payload -> 'metrics') FILTER (WHERE e.payload ? 'metrics') as metrics
  FROM events e
  WHERE e.session_id = p_session_id
  GROUP BY e.event_type;
END;
$$ LANGUAGE plpgsql;

-- Получить цели Яндекс.Метрики за период
CREATE OR REPLACE FUNCTION get_yandex_goals(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE (
  goal_name TEXT,
  goal_count BIGINT,
  total_params JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.target_text as goal_name,
    COUNT(*) as goal_count,
    jsonb_agg(e.payload -> 'custom' -> 'goalParams') as total_params
  FROM events e
  WHERE 
    e.event_type = 'yandex_goal'
    AND e.created_at BETWEEN start_date AND end_date
  GROUP BY e.target_text
  ORDER BY goal_count DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ТРИГГЕРЫ для валидации
-- ============================================================

-- Валидация payload (не больше 100KB)
CREATE OR REPLACE FUNCTION validate_event_payload()
RETURNS TRIGGER AS $$
BEGIN
  IF pg_column_size(NEW.payload) > 102400 THEN
    RAISE EXCEPTION 'Payload слишком большой (> 100KB)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_validate_payload
BEFORE INSERT OR UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION validate_event_payload();

-- ============================================================
-- КОММЕНТАРИИ к таблицам
-- ============================================================

COMMENT ON TABLE users IS 'Уникальные посетители сайта';
COMMENT ON TABLE sessions IS 'Визиты пользователей с контекстом';
COMMENT ON TABLE events IS 'Поток событий и метрик';

COMMENT ON COLUMN users.user_id IS 'UUID пользователя (из FingerprintJS или localStorage)';
COMMENT ON COLUMN users.contact_data IS 'Email, телефон из форм';
COMMENT ON COLUMN sessions.session_id IS 'UUID сессии';
COMMENT ON COLUMN events.payload IS 'JSONB с метриками и данными события';

-- ============================================================
-- ЗАВЕРШЕНИЕ
-- ============================================================

-- Проверка созданных таблиц
SELECT 
  tablename,
  schemaname
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'sessions', 'events')
ORDER BY tablename;
