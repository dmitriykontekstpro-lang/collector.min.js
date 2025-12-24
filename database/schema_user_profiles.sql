-- ============================================================
-- СХЕМА 4.0: ПРОФИЛИ ПОЛЬЗОВАТЕЛЕЙ (Aggregated User Data)
-- Одна строка = Один уникальный пользователь
-- ============================================================

-- Удаляем старую таблицу если нужно (раскомментируйте)
-- DROP TABLE IF EXISTS analytics;

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY, -- Уникальный ключ (cookie/fingerprint)
  
  -- История сессий: { "session_uuid": duration_seconds, ... }
  sessions_history JSONB DEFAULT '{}'::jsonb,
  
  -- Список событий через запятую: "page_view, click, form_submit"
  events_triggered TEXT,
  
  -- Цели Яндекс.Метрики через запятую: "lead, purchase"
  yandex_goals TEXT,
  
  -- Общий контекст + Агрегированная статистика
  -- { "total_sessions": 5, "total_time": 600, "utm_source": "...", "phone": "..." }
  data JSONB DEFAULT '{}'::jsonb,
  
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_user_profiles_updated ON user_profiles(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_data ON user_profiles USING GIN(data);

-- Настройка прав (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Разрешаем Вставку и Обновление для всех (Upsert)
CREATE POLICY "Public upsert" ON user_profiles
  FOR INSERT TO anon
  WITH CHECK (true);
  
CREATE POLICY "Public update" ON user_profiles
  FOR UPDATE TO anon
  USING (true);
  
CREATE POLICY "Read auth" ON user_profiles
  FOR SELECT TO authenticated
  USING (true);
