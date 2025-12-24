# 📄 ФИНАЛЬНЫЙ СКРИПТ TILDA ANALYTICS - Ready to Use

**Версия**: 2.0.1  
**Дата**: 2025-12-22  
**Файл**: `FINAL_SCRIPT.js`  
**Размер**: ~54 KB  

---

## 🚀 Готово к использованию!

Полный код скрипта находится в файле:
```
c:\Users\Дмитрий\.gemini\antigravity\playground\tilda-analytics\FINAL_SCRIPT.js
```

---

## 📋 Быстрая интеграция в Tilda

### Шаг 1: Откройте настройки сайта в Tilda

**Site Settings → Advanced → HTML code for site**

### Шаг 2: Вставьте в `Code in <head>`

```html
<!-- Supabase JS Client -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- FingerprintJS (опционально, для точной идентификации) -->
<script src="https://cdn.jsdelivr.net/npm/@fingerprintjs/fingerprintjs@3"></script>
```

### Шаг 3: Вставьте код скрипта

**Вариант A: Через хостинг (рекомендуется)**
1. Загрузите `FINAL_SCRIPT.js` на ваш хостинг
2. Вставьте в **Code in <head>**:

```html
<script src="https://your-domain.com/path/to/FINAL_SCRIPT.js"></script>
```

**Вариант B: Прямая вставка (для тестирования)**
1. Скопируйте весь код из `FINAL_SCRIPT.js`
2. Вставьте в **Code before </body>** внутри тегов:

```html
<script>
  // Вставьте сюда весь код из FINAL_SCRIPT.js
  (function() {
    'use strict';
    
    window.TildaAnalytics = {
      // ... весь код ...
    };
  })();
</script>
```

### Шаг 4: Инициализируйте коллектор

Вставьте в **Code before </body>**:

```html
<script>
  // Инициализация Tilda Analytics
  TildaAnalytics.init({
    // === ОБЯЗАТЕЛЬНЫЕ ПАРАМЕТРЫ ===
    supabaseUrl: 'https://xxxxxxxxxxxxx.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    
    // === ОПЦИОНАЛЬНЫЕ ПАРАМЕТРЫ ===
    
    // ID счетчика Яндекс.Метрики (для перехвата целей)
    yandexMetrikaId: 87654321,
    
    // Режим отладки (включите для тестирования)
    debug: true,  // На продакшене поставьте false
    
    // Батчинг событий
    batchInterval: 5000,      // Отправка каждые 5 секунд
    maxBatchSize: 10,         // Максимум событий в пакете
    
    // Таймаут сессии (30 минут)
    sessionTimeout: 1800000,
    
    // Отслеживание движений мыши (может повысить нагрузку)
    trackMouseMovement: false,
    
    // Debounce для scroll/mouse
    scrollDebounce: 200,
    mouseDebounce: 500,
    
    // Пороги скролла
    scrollThresholds: [25, 50, 75, 90, 100],
    
    // FingerprintJS (требует подключения библиотеки)
    useFingerprintJS: true,
    
    // GDPR - требовать согласие на сбор данных
    requireConsent: false,
    
    // Функция проверки согласия (если requireConsent = true)
    consentCheck: function() {
      return localStorage.getItem('cookie_consent') === 'accepted';
    },
    
    // Callbacks (опционально)
    callbacks: {
      onInit: function(userId, sessionId) {
        console.log('Analytics started:', userId);
      },
      onBatchSent: function(eventCount) {
        console.log('Sent', eventCount, 'events');
      },
      onError: function(error) {
        console.error('Analytics error:', error);
      }
    }
  });
</script>
```

**ВАЖНО**: Замените `supabaseUrl` и `supabaseKey` на ваши реальные значения из Supabase Dashboard (Project Settings → API).

---

## ✅ Что делает скрипт

### 📊 Собирает 50 метрик автоматически:

**Time Metrics (6)**:
- session_duration_sec - длительность сессии
- time_to_first_click - время до первого клика
- active_time_on_page - активное время на странице
- time_on_pricing_block - время на блоке цен
- time_on_reviews_block - время на блоке отзывов
- average_time_per_screen - среднее время на экран

**Scroll Behavior (6)**:
- max_scroll_depth_percent - максимальная глубина скролла
- scroll_velocity_avg - средняя скорость скролла
- scroll_up_count - количество возвратов наверх
- scroll_pauses_count - остановки скролла
- fast_scroll_events - быстрые пролистывания
- reached_footer - достиг футера

**Mouse & Interaction (9)**:
- total_clicks - общее количество кликов
- rage_clicks_count - яростные клики (фрустрация)
- dead_clicks_count - клики по неактивным элементам
- mouse_distance_px - дистанция курсора
- hover_cta_count - наведения на кнопки
- hover_image_duration - время наведения на изображения
- text_selection_count - выделения текста
- copy_to_clipboard_events - копирование в буфер
- exit_intent_signals - сигналы ухода

**Form Interaction (5)**:
- form_focus_count - активация полей формы
- form_typing_duration - время ввода в форму
- field_corrections_count - исправления (Backspace)
- form_abandonment_rate - брошенная форма
- paste_in_form_count - вставки текста

**Device & Technical (6)**:
- is_mobile - мобильное устройство
- screen_orientation - portrait/landscape
- browser_language_match - совпадение языка
- connection_type - тип соединения (4g/wifi)
- battery_level - уровень заряда батареи
- window_resize_count - изменения размера окна

**Context & Traffic (6)**:
- visit_hour_local - час визита
- is_weekend - выходной день
- referrer_type - тип источника (search/social/direct/paid)
- visits_count - порядковый номер визита
- days_since_last_visit - дней с последнего визита
- utm_depth - заполненность UTM меток

**Complex/Derived (12)**:
- content_consumption_rate - скорость потребления контента
- interaction_intensity - интенсивность взаимодействия
- focus_switches - переключения вкладок
- zoom_events - использование зума
- gallery_arrows_click - клики по стрелкам галереи
- video_play_rate - процент просмотра видео
- accordion_expand_count - раскрытие аккордеонов
- popup_close_time - время до закрытия попапа
- social_links_click - клик по соцсетям
- logo_click_count - клики по логотипу
- map_interaction - взаимодействие с картой
- error_encounter_count - столкновение с ошибками

### 🎯 Автоматические интеграции:

1. **Яндекс.Метрика** - перехват всех целей
   ```javascript
   // На сайте вызывается:
   ym(87654321, 'reachGoal', 'buy_button');
   
   // Скрипт автоматически записывает в БД:
   // event_type: 'yandex_goal'
   // goalName: 'buy_button'
   ```

2. **Tilda формы** - перехват email/phone/name
   ```javascript
   // При отправке формы автоматически:
   // - Записывается событие form_submit
   // - Обновляется users.contact_data
   ```

3. **FingerprintJS** - точная идентификация пользователей
   ```javascript
   // Генерирует уникальный fingerprint устройства
   // Отличает пользователей даже без cookies
   ```

### 📝 События, записываемые в БД:

- `page_view` - просмотр страницы (с performance метриками)
- `click` - клик по элементу (координаты, target, timing)
- `scroll` - пороги скролла (25%, 50%, 75%, 90%, 100%)
- `form_submit` - отправка формы (с данными полей)
- `yandex_goal` - цель Яндекс.Метрики (название + параметры)
- `custom_goal` - кастомная цель (через API)
- `session_end` - завершение сессии (ВСЕ 50 метрик)

---

## 🧪 Тестирование

### 1. Откройте консоль браузера (F12)

После загрузки страницы вы должны увидеть:

```
[TildaAnalytics] ✅ Tilda Analytics initialized
  userId: "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
  sessionId: "7c8d9e0f-1a2b-3c4d-5e6f-7g8h9i0j1k2l"
  fingerprint: "a1b2c3d4e5f6g7h8"

[TildaAnalytics] Initializing Yandex.Metrika integration...
[TildaAnalytics] ✅ Yandex.Metrika proxy installed
```

### 2. Выполните действия на странице

- **Кликните на кнопку**:
  ```
  [TildaAnalytics] total_clicks: 1
  ```

- **Прокрутите страницу до 50%**:
  ```
  [TildaAnalytics] Event tracked: scroll
    scrollPercent: 50
  ```

- **Заполните форму**:
  ```
  [TildaAnalytics] 📝 Form field focused
  [TildaAnalytics] form_focus_count: 1
  ```

- **Отправьте форму**:
  ```
  [TildaAnalytics] ✅ Form submitted
  [TildaAnalytics] 📞 Contact data updated: {email: "test@example.com"}
  [TildaAnalytics] 📤 Sent 1 events
  ```

### 3. Проверьте данные в Supabase

1. Откройте https://app.supabase.com
2. Выберите ваш проект
3. Перейдите в **Table Editor → events**
4. Должны появиться записи с `event_type`: `page_view`, `click`, `scroll`, `form_submit`

### 4. Проверьте перехват целей Яндекс.Метрики

Если на сайте есть вызовы целей:
```javascript
ym(87654321, 'reachGoal', 'test_goal');
```

В консоли должно появиться:
```
[TildaAnalytics] 🎯 Yandex goal reached: test_goal null
```

В Supabase должна появиться запись:
```sql
SELECT * FROM events 
WHERE event_type = 'yandex_goal' 
ORDER BY created_at DESC 
LIMIT 1;

-- Результат:
-- target_text: "test_goal"
-- payload: {"custom": {"goalName": "test_goal", "goalType": "yandex_metrika"}}
```

---

## 🎯 Public API для разработчиков

### Отследить кастомную цель
```javascript
TildaAnalytics.goal('download_catalog', 100);
// Запишется как event_type: 'custom_goal'
```

### Отследить кастомное событие
```javascript
TildaAnalytics.track('special_action', {
  buttonColor: 'red',
  location: 'header',
  value: 'clicked_special_offer'
});
```

### Получить текущие метрики
```javascript
const metrics = TildaAnalytics.getMetrics();
console.log(metrics);
// Вернет объект со всеми 50 метриками
```

---

## 📂 Файлы проекта

**Основной скрипт**:
- ✅ `FINAL_SCRIPT.js` (54 KB) - готов к использованию

**Документация**:
- 📘 `frontend/INTEGRATION_READY.md` - инструкция по интеграции
- 📗 `docs/YANDEX_METRIKA_INTEGRATION.md` - объяснение работы с Метрикой
- 📕 `QUICKSTART.md` - быстрый старт с SQL
- 📙 `ARCHITECTURE.md` - техническая архитектура
- 📔 `COLLECTOR_READY.md` - итоговая сводка

---

## ⚠️ Важно перед запуском

### 1. Создайте SQL схему в Supabase

Перед использованием скрипта необходимо создать таблицы в Supabase:
- `users` - уникальные посетители
- `sessions` - визиты
- `events` - поток событий

Инструкция: см. `QUICKSTART.md` → Шаг 4, 5

### 2. Настройте RLS политики

Обязательно создайте Row Level Security политики, чтобы:
- ✅ Публичный `anon` ключ мог только INSERT
- ❌ Публика не могла SELECT (защита от конкурентов)

Инструкция: см. `QUICKSTART.md` → Шаг 5

### 3. Отключите debug на продакшене

```javascript
TildaAnalytics.init({
  supabaseUrl: '...',
  supabaseKey: '...',
  debug: false  // ← ВАЖНО! На продакшене = false
});
```

---

## 🎉 Готово!

Скрипт полностью функционален и готов к использованию.

**Что дальше**:
1. ✅ Скопируйте код из `FINAL_SCRIPT.js`
2. ✅ Интегрируйте в Tilda по инструкции выше
3. ✅ Протестируйте в консоли браузера
4. ✅ Проверьте данные в Supabase
5. ✅ Настройте дашборды в Retool/JetAdmin
6. ✅ Интегрируйте с MindsDB для ML-анализа

**Удачи! 🚀**

---

**Создано**: 2025-12-22  
**Версия скрипта**: 2.0.1  
**Размер**: ~54 KB  
**Метрик**: 50+  
**Интеграций**: Supabase + Яндекс.Метрика + Tilda + FingerprintJS
