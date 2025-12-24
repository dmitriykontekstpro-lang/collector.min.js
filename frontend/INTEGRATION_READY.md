# 🚀 Быстрая интеграция коллектора

## ✅ Скрипт создан!

Файл: `frontend/collector.js` (24 KB, ~900 строк кода)

---

## 📊 Что собирает скрипт

### ✅ Все 50 метрик из вашего списка:

**Time Metrics (6)**:
- session_duration_sec
- time_to_first_click  
- active_time_on_page
- time_on_pricing_block
- time_on_reviews_block
- average_time_per_screen

**Scroll Behavior (6)**:
- max_scroll_depth_percent
- scroll_velocity_avg
- scroll_up_count
- scroll_pauses_count
- fast_scroll_events
- reached_footer

**Mouse & Interaction (9)**:
- total_clicks
- rage_clicks_count
- dead_clicks_count
- mouse_distance_px
- hover_cta_count
- hover_image_duration
- text_selection_count
- copy_to_clipboard_events
- exit_intent_signals

**Form Interaction (5)**:
- form_focus_count
- form_typing_duration
- field_corrections_count
- form_abandonment_rate
- paste_in_form_count

**Device & Technical (6)**:
- is_mobile
- screen_orientation
- browser_language_match
- connection_type
- battery_level
- window_resize_count

**Context & Traffic (6)**:
- visit_hour_local
- is_weekend
- referrer_type
- visits_count
- days_since_last_visit
- utm_depth

**Complex/Derived (12)**:
- content_consumption_rate
- interaction_intensity
- focus_switches
- zoom_events
- gallery_arrows_click
- video_play_rate
- accordion_expand_count
- popup_close_time
- social_links_click
- logo_click_count
- map_interaction
- error_encounter_count

### ✅ Дополнительно:
- 🎯 Интеграция с Яндекс.Метрикой (автоматический перехват целей)
- 📝 Перехват форм Tilda (Ajax формы)
- ✉️ Извлечение email/phone из форм
- 📊 События: page_view, click, scroll, form_submit, yandex_goal

---

## 🔧 Быстрая установка на Tilda

### Шаг 1: Подключите CDN библиотеки

Скопируйте в **Site Settings → Advanced → HTML code for site → Code in &lt;head>**:

```html
<!-- Supabase JS Client -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- FingerprintJS (опционально, для точной идентификации) -->
<script src="https://cdn.jsdelivr.net/npm/@fingerprintjs/fingerprintjs@3"></script>
```

### Шаг 2: Загрузите collector.js

**Вариант A: Через хостинг** (рекомендуется)
1. Загрузите `frontend/collector.js` на ваш хостинг
2. Добавьте в **Code in &lt;head>**:

```html
<script src="https://your-domain.com/collector.js"></script>
```

**Вариант B: Прямая вставка** (для тестирования)
1. Скопируйте весь код из `frontend/collector.js`
2. Вставьте в **Code before &lt;/body>** внутри тегов `<script>...</script>`

### Шаг 3: Инициализируйте коллектор

Добавьте в **Code before &lt;/body>**:

```html
<script>
  // Инициализация Tilda Analytics
  TildaAnalytics.init({
    // === ОБЯЗАТЕЛЬНЫЕ ПАРАМЕТРЫ ===
    supabaseUrl: 'https://xxxxxxxxxxxxx.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    
    // === ОПЦИОНАЛЬНЫЕ ПАРАМЕТРЫ ===
    debug: true,  // Включите для тестирования, выключите на продакшн
    
    // ID счетчика Яндекс.Метрики (если используете)
    yandexMetrikaId: 12345678,
    
    // Отслеживание движений мыши (может повысить нагрузку)
    trackMouseMovement: false,
    
    // Батчинг событий
    batchInterval: 5000,      // Отправка каждые 5 секунд
    maxBatchSize: 10,          // Максимум событий в пакете
    
    // GDPR
    requireConsent: false,     // Требовать Cookie Consent
    
    // Callbacks (опционально)
    callbacks: {
      onInit: function(userId, sessionId) {
        console.log('Analytics started', userId);
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

---

## 🧪 Тестирование

### 1. Откройте консоль браузера (F12)

После загрузки страницы вы должны увидеть:
```
[TildaAnalytics] ✅ Tilda Analytics initialized
  userId: "a1b2c3d4-e5f6-..."
  sessionId: "7c8d9e0f-1a2b-..."
  fingerprint: "a1b2c3d4e5f6g7h8"
```

### 2. Выполните действия

- **Кликните на кнопку** → `[TildaAnalytics] total_clicks: 1`
- **Прокрутите страницу** → `[TildaAnalytics] max_scroll_depth: 50%`
- **Заполните форму** → `[TildaAnalytics] 📝 Form field focused`
- **Отправьте форму** → `[TildaAnalytics] ✅ Form submitted`

### 3. Проверьте данные в Supabase

1. Откройте [app.supabase.com](https://app.supabase.com)
2. Table Editor → `events`
3. Должны появиться события с `payload` содержащим все метрики

---

## 📊 Примеры использования

### Отслеживание кастомной цели

```javascript
// В Code before </body> или в onclick
TildaAnalytics.goal('download_catalog', 100);
```

### Получение текущих метрик

```javascript
const metrics = TildaAnalytics.getMetrics();
console.log('Current metrics:', metrics);
```

### Ручное отслеживание события

```javascript
TildaAnalytics.track('custom_event', {
  eventName: 'button_click_special',
  value: 'red_button'
});
```

---

## 🎯 Интеграция с Яндекс.Метрикой

Коллектор **автоматически** перехватывает все цели Яндекс.Метрики!

Ваш код Яндекс.Метрики:
```javascript
ym(87654321, 'reachGoal', 'order_button_click');
```

Коллектор **автоматически** запишет это как событие `yandex_goal` с payload:
```json
{
  "custom": {
    "goalName": "order_button_click",
    "goalType": "yandex_metrika"
  }
}
```

---

## 📝 Что автоматически отслеживается на Tilda

### Клики по элементам:
- ✅ Кнопки (`.t-btn`)
- ✅ Ссылки
- ✅ Логотип (`.t-logo`)
- ✅ Соцсети
- ✅ Стрелки галереи
- ✅ Карта
- ✅ FAQ/Аккордеоны

### Формы:
- ✅ Фокус на поле
- ✅ Ввод текста
- ✅ Backspace (исправления)
- ✅ Вставка из буфера (Ctrl+V)
- ✅ Отправка формы
- ✅ Email/телефон сохраняются в `users.contact_data`

### Блоки:
- ✅ Время на блоке цен (`.t-price`)
- ✅ Время на блоке отзывов (`.t-reviews`)

---

## 🔍 Структура данных в events.payload

```json
{
  "metrics": {
    "session_duration_sec": 120,
    "time_to_first_click": 3.5,
    "active_time_on_page": 95,
    "max_scroll_depth_percent": 75,
    "total_clicks": 8,
    "rage_clicks_count": 0,
    "form_focus_count": 3,
    "form_typing_duration": 25.5,
    "is_mobile": false,
    "visit_hour_local": 14,
    "is_weekend": false,
    "visits_count": 3,
    "utm_depth": 5,
    ...
  }
}
```

Все 50 метрик сохраняются в событии `session_end` при закрытии страницы.

---

## ⚙️ Дополнительные настройки

### Исключить элементы из отслеживания

```javascript
TildaAnalytics.init({
  supabaseUrl: '...',
  supabaseKey: '...',
  
  excludeSelectors: [
    '.no-track',
    '[data-analytics-ignore]',
    '#admin-panel'
  ]
});
```

### GDPR Compliance

```javascript
TildaAnalytics.init({
  supabaseUrl: '...',
  supabaseKey: '...',
  
  requireConsent: true,
  consentCheck: function() {
    // Ваша логика проверки Cookie Consent
    return localStorage.getItem('cookie_consent') === 'accepted';
  }
});
```

---

## 🚨 Важно!

### ❌ НЕ отслеживается (по безопасности):
- Пароли
- Данные банковских карт
- Секретная информация

### ✅ Отслеживается только:
- Email (для CRM)
- Телефон (для CRM)
- Имя (для CRM)
- Поведенческие метрики

---

## 📈 Анализ собранных данных

### SQL запрос для получения всех метрик пользователя:

```sql
SELECT 
  e.created_at,
  e.event_type,
  e.payload->'metrics' as all_metrics
FROM events e
WHERE e.session_id = 'YOUR_SESSION_ID'
  AND e.event_type = 'session_end'
ORDER BY e.created_at DESC
LIMIT 1;
```

### Средние метрики по всем пользователям:

```sql
SELECT 
  AVG((e.payload->'metrics'->>'total_clicks')::int) as avg_clicks,
  AVG((e.payload->'metrics'->>'session_duration_sec')::int) as avg_session_duration,
  AVG((e.payload->'metrics'->>'max_scroll_depth_percent')::int) as avg_scroll_depth,
  COUNT(*) as total_sessions
FROM events e
WHERE e.event_type = 'session_end'
  AND e.created_at > NOW() - INTERVAL '7 days';
```

---

## 🎓 Следующие шаги

1. ✅ **Скрипт готов** к интеграции
2. ⏳ **Создайте SQL схему** (см. `QUICKSTART.md` → Шаг 4, 5)
3. ⏳ **Протестируйте на тестовой странице Tilda**
4. ⏳ **Настройте дашборды** в Retool/JetAdmin
5. ⏳ **Интегрируйте с MindsDB** для ML-прогнозов

---

## 🐛 Troubleshooting

### События не записываются
- Проверьте консоль (F12) на ошибки
- Убедитесь, что RLS политики настроены
- Проверьте правильность `supabaseUrl` и `supabaseKey`

### Формы не перехватываются
- Убедитесь, что `jQuery` загружен (Tilda использует jQuery)
- Проверьте, что формы имеют класс `.t-form`

### Slow performance
- Отключите `trackMouseMovement: false`
- Увеличьте `scrollDebounce` до 300-500ms

---

**Готово к использованию! 🚀**

**Файл**: `frontend/collector.js`  
**Размер**: 24 KB (не минифицирован)  
**Версия**: 2.0.0  
**Дата**: 2025-12-22
