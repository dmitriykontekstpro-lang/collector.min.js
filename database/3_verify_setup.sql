-- ============================================================
-- ПРОВЕРКА СОЗДАННЫХ ТАБЛИЦ
-- Выполните эти запросы чтобы убедиться что всё работает
-- ============================================================

-- Проверка таблиц
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'sessions', 'events');

-- Должно вернуть 3 строки:
-- users
-- sessions
-- events

-- Проверка RLS политик
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('users', 'sessions', 'events')
ORDER BY tablename, policyname;

-- Должно вернуть 9 политик (по 3 на каждую таблицу)

-- Проверка индексов
SELECT tablename, indexname 
FROM pg_indexes 
WHERE tablename IN ('users', 'sessions', 'events')
ORDER BY tablename, indexname;

-- Должно вернуть все созданные индексы
