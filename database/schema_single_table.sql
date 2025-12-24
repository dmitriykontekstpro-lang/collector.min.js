-- ============================================================
-- НОВАЯ СХЕМА: ВСЁ В ОДНОЙ ТАБЛИЦЕ (Flat Schema)
-- Версия: 3.0.0
-- Упрощает аналитику, не требует JOIN-ов
-- ============================================================

-- Удаляем старые таблицы если нужно (раскомментировать)
-- DROP TABLE IF EXISTS events;
-- DROP TABLE IF EXISTS sessions;
-- DROP TABLE IF EXISTS users;

-- Создаем единую таблицу событий
CREATE TABLE IF NOT EXISTS analytics (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ключевые поля для фильтрации
  event_name TEXT NOT NULL,    -- 'page_view', 'click', 'form_submit', 'session_start'
  user_id TEXT,                -- Persistent User ID
  session_id TEXT,             -- Session ID
  page_url TEXT,               -- Текущий URL
  
  -- Все контекстные данные (Broad JSONB)
  -- Включает: utm, device, geo, event_specific_data
  data JSONB DEFAULT '{}'::jsonb
);

-- Индексы для скорости
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON analytics(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_data ON analytics USING GIN(data);

-- Настройка RLS (Безопасность)
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Разрешаем anon вставку (INSERT)
CREATE POLICY "Anon insert access" ON analytics
  FOR INSERT TO anon
  WITH CHECK (true);

-- Разрешаем чтение только для админов (authenticated)
CREATE POLICY "Authenticated read access" ON analytics
  FOR SELECT TO authenticated
  USING (true);

-- Комментарии
COMMENT ON TABLE analytics IS 'Единый лог всех событий сайта';
