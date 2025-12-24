-- ============================================================
-- ML FEATURE STORE DICTIONARY
-- Описание всех собираемых метрик для обучения модели
-- ============================================================

DROP TABLE IF EXISTS analytics_dictionary;

CREATE TABLE analytics_dictionary (
    feature_key TEXT PRIMARY KEY,       -- Название параметра в JSON (data.feature_key)
    category TEXT NOT NULL,             -- Категория (Hardware, Behavior, Traffic...)
    description TEXT NOT NULL,          -- Описание для человека
    data_type TEXT NOT NULL,            -- Тип данных (Numeric, Boolean, Catigorical)
    possible_values TEXT,               -- Диапазон или варианты значений
    ml_significance TEXT,               -- Зачем это модели? (Гипотеза)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Права на чтение (чтобы вы могли забрать это в Python/Pandas)
ALTER TABLE analytics_dictionary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read dict" ON analytics_dictionary FOR SELECT TO anon USING (true);

-- ============================================================
-- ЗАПОЛНЕНИЕ ДАННЫМИ (METADATA)
-- ============================================================

INSERT INTO analytics_dictionary (feature_key, category, description, data_type, possible_values, ml_significance) VALUES 

-- 1. HARDWARE (Платежеспособность)
('device_memory_gb', 'Hardware', 'Объем оперативной памяти устройства (RAM)', 'Numeric', '2, 4, 8, 16, 32', 'Косвенный признак дохода. 8GB+ на мобильном = флагман = деньги.'),
('hardware_concurrency', 'Hardware', 'Количество логических ядер процессора', 'Numeric', '2 - 32', 'Высокая мощность = проф. станция или игровой ПК. Важно для B2B/Tech.'),
('screen_width', 'Hardware', 'Ширина экрана в пикселях', 'Numeric', '320 - 5120', 'Отличает старые мониторы от 4K. Влияет на UX.'),
('network_downlink', 'Hardware', 'Эффективная скорость соединения (Mbit/s)', 'Numeric', '0 - 10', 'Быстрый инет (10) = офис или крупный город. Медленный = плохая связь.'),
('os_type', 'Hardware', 'Операционная система', 'Categorical', 'Windows, MacOS, iOS, Android, Linux', 'MacOS/iOS часто имеют более высокий LTV и конверсию.'),

-- 2. TRAFFIC & CONTEXT (Контекст)
('traffic_source_type', 'Context', 'Тип источника трафика', 'Categorical', 'SEO, Direct, Social, Referral', 'SEO и Direct часто дают более лояльных ("теплых") клиентов.'),
('is_working_hours', 'Context', 'Визит совершен в рабочее время (09-18)', 'Boolean', 'true, false', 'Критично для B2B. Если true, вероятно, ищут для бизнеса.'),
('visit_frequency_per_week', 'Context', 'Частота визитов в неделю', 'Numeric', '0.0 - 50.0', 'Интенсивность интереса. Частые визиты = горячий спрос.'),
('days_since_first_visit', 'Context', 'Дней с первого захода на сайт', 'Numeric', '0 - 3650', 'Срок принятия решения (Time to conversion).'),

-- 3. BEHAVIOR: ENGAGEMENT (Вовлеченность)
('total_time_sec', 'Behavior', 'Суммарное время на сайте', 'Numeric', '0 - inf', 'Сильный сигнал интереса. <10с = отказ, >60с = интерес.'),
('focus_time_percent', 'Behavior', 'Процент времени когда вкладка была активна', 'Numeric', '0 - 100', 'Фильтрует "фоновые" сессии. Высокий % = реальное чтение.'),
('max_scroll_depth_percent', 'Behavior', 'Максимальная глубина скролла', 'Numeric', '0 - 100', 'Видел ли пользователь оффер/цены внизу страницы.'),
('scroll_direction_changes', 'Behavior', 'Количество смен направления скролла', 'Numeric', '0 - 100', 'Много смен = внимательное чтение (вверх-вниз). Мало = сканирование.'),
('reading_intensity_score', 'Behavior', 'Индекс интенсивности чтения (слов/сек)', 'Numeric', '0 - 1000', 'Классификация: Вдумчивый читатель vs Скроллер.'),

-- 4. BEHAVIOR: PSYCHOLOGY (Психология)
('rage_click_count', 'Psychology', 'Яростные клики (быстрые удары в одно место)', 'Numeric', '0 - 50', 'Негативный сигнал. Фрустрация, злость или баг интерфейса.'),
('hover_hesitation_sec', 'Psychology', 'Время "сомнений" курсора над кнопками', 'Numeric', '0 - inf', 'Хочет нажать, но боится. Признак сомневающегося лида.'),
('mouse_velocity_px_sec', 'Psychology', 'Скорость движения мыши', 'Numeric', '0 - 5000', 'Помогает отсеять ботов (0 или >2000) и определить нервозность.'),
('text_selection_count', 'Psychology', 'Количество выделений текста', 'Numeric', '0 - 100', 'Высочайший сигнал вовлеченности (копируют или читают внимательно).'),
('tab_switch_count', 'Psychology', 'Уходы на другие вкладки', 'Numeric', '0 - 100', 'Сравнение цен с конкурентами (Price Shopping).'),

-- 5. FUNNEL (Воронка)
('form_start_time_sec', 'Funnel', 'Секунда сессии, когда начал заполнять форму', 'Numeric', '0 - inf', 'Слишком быстро = бот/спам. Долго = сомнения.'),
('fields_filled_count', 'Funnel', 'Количество заполненных полей', 'Numeric', '0 - 20', 'Микро-конверсия. Заполнил, но не отправил = "брошенная корзина".'),
('is_lead', 'Target', 'Является ли лидом (Цель достигнута)', 'Boolean', 'true, false', 'Целевая переменная (Target Variable) для обучения.');
