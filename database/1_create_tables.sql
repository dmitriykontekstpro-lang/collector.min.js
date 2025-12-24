-- ============================================================
-- СОЗДАНИЕ ТАБЛИЦ ДЛЯ TILDA ANALYTICS
-- Выполните этот скрипт в Supabase SQL Editor
-- ============================================================

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
