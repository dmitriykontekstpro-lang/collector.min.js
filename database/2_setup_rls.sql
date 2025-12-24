-- ============================================================
-- НАСТРОЙКА ROW LEVEL SECURITY (RLS)
-- Выполните этот скрипт ПОСЛЕ создания таблиц
-- ============================================================

-- Включаем Row Level Security на всех таблицах
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Политики для таблицы users
-- Anon (публичный ключ) может только INSERT и UPDATE
CREATE POLICY "anon_users_insert" ON users
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "anon_users_update" ON users
  FOR UPDATE TO anon
  USING (true);

-- Политики для таблицы sessions
-- Anon может только INSERT и UPDATE
CREATE POLICY "anon_sessions_insert" ON sessions
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "anon_sessions_update" ON sessions
  FOR UPDATE TO anon
  USING (true);

-- Политики для таблицы events
-- Anon может только INSERT (самое важное!)
CREATE POLICY "anon_events_insert" ON events
  FOR INSERT TO anon
  WITH CHECK (true);

-- Политики для authenticated пользователей (для дашбордов)
-- Полный доступ ко всем таблицам
CREATE POLICY "authenticated_full_access_users" ON users
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "authenticated_full_access_sessions" ON sessions
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "authenticated_full_access_events" ON events
  FOR ALL TO authenticated
  USING (true);
