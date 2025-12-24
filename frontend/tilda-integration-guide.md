# Интеграция Tilda Analytics в сайт на Tilda

## 🎯 Цель
Встроить систему сбора аналитики в сайт, созданный на платформе Tilda.

---

## 📋 Предварительные требования

1. **Сайт на Tilda** с активной подпиской
2. **Проект Supabase** (бесплатный tier подойдет)
3. **Выполненная настройка БД** (см. `database/schema.sql`)

---

## 🚀 Пошаговая инструкция

### Шаг 1: Подключение CDN библиотек

Откройте настройки сайта Tilda:
**Site Settings → Advanced → HTML code for site → Code inside HEAD**

```html
<!-- Supabase JS Client -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- FingerprintJS (опционально, но рекомендуется) -->
<script src="https://cdn.jsdelivr.net/npm/@fingerprintjs/fingerprintjs@3"></script>
```

---

### Шаг 2: Загрузка основного скрипта

#### Вариант A: Хостинг на вашем сервере (рекомендуется)

1. Загрузите `frontend/collector.js` на ваш хостинг
2. Добавьте в **Code inside HEAD**:

```html
<script src="https://ваш-домен.ru/path/to/collector.js"></script>
```

#### Вариант B: Прямая вставка кода

1. Скопируйте весь код из `frontend/collector.js`
2. Вставьте в **Code before </body>** (внизу страницы)

```html
<script>
  // Вставьте сюда весь код из collector.js
  (function() {
    // ... код коллектора ...
  })();
</script>
```

---

### Шаг 3: Инициализация аналитики

Добавьте в **Code before </body>** (после подключения collector.js):

```html
<script>
  // Инициализация Tilda Analytics
  TildaAnalytics.init({
    supabaseUrl: 'https://xxxxxxxxxxxxx.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    debug: false // Включите true для отладки
  });
</script>
```

**⚠️ ВАЖНО**: Замените URL и ключ на ваши настоящие значения из Supabase Dashboard.

---

### Шаг 4: Расширенная конфигурация (опционально)

```html
<script>
  TildaAnalytics.init({
    // Обязательные
    supabaseUrl: 'https://xxxxxxxxxxxxx.supabase.co',
    supabaseKey: 'your-anon-key',
    
    // Опциональные
    debug: true,                    // Логи в консоль
    batchInterval: 5000,            // Отправка каждые 5 сек
    maxBatchSize: 10,               // Макс. событий в пакете
    sessionTimeout: 1800000,        // 30 минут сессия
    trackMouseMovement: false,      // Отключить mouse tracking
    scrollThresholds: [25, 50, 75, 90, 100], // Пороги скролла
    
    // Кастомные события
    customEvents: {
      downloadPDF: {
        selector: 'a[href*=".pdf"]',
        eventName: 'pdf_download'
      },
      phoneClick: {
        selector: 'a[href^="tel:"]',
        eventName: 'phone_click'
      }
    },
    
    // Исключения
    excludeSelectors: [
      '.no-track',
      '[data-analytics-ignore]'
    ],
    
    // GDPR
    requireConsent: false,
    consentCheck: function() {
      return localStorage.getItem('cookie_consent') === 'accepted';
    },
    
    // Callbacks
    callbacks: {
      onInit: function(userId, sessionId) {
        console.log('Analytics started:', userId);
      },
      onError: function(error) {
        console.error('Analytics error:', error);
      }
    }
  });
</script>
```

---

## 🎨 Интеграция с Tilda формами

### Автоматический перехват (рекомендуется)

Коллектор автоматически перехватывает все формы Tilda. Никаких дополнительных настроек не требуется.

**Что отслеживается**:
- ✅ Email из поля `input[type="email"]`
- ✅ Телефон из поля `input[type="tel"]` или `input[name*="phone"]`
- ✅ Имя из поля `input[name*="name"]`
- ✅ Успешная отправка формы (событие `form_submit`)
- ✅ Ошибки валидации

### Ручное отслеживание (расширенное)

Если вам нужно отследить кастомное событие:

```javascript
// После успешной отправки формы
TildaAnalytics.track('custom_goal', {
  goalName: 'subscribed_to_newsletter',
  value: 100,
  formId: 'form123'
});
```

---

## 📊 Отслеживание целей (Goals)

### Встроенные цели

Коллектор автоматически отслеживает:

| Цель | Описание | Условие |
|------|----------|---------|
| `page_view` | Просмотр страницы | Автоматически |
| `click` | Клик по элементу | Клик по любому элементу |
| `scroll_25` | Скролл 25% | Прокрутка страницы |
| `scroll_50` | Скролл 50% | Прокрутка страницы |
| `scroll_75` | Скролл 75% | Прокрутка страницы |
| `scroll_100` | Скролл до конца | Прокрутка страницы |
| `form_submit` | Отправка формы | Успешная отправка |

### Кастомные цели

Добавьте в конфигурацию:

```javascript
TildaAnalytics.init({
  // ... остальные настройки ...
  
  customEvents: {
    // Цель: Клик по кнопке "Заказать звонок"
    callbackRequest: {
      selector: 'a.t-btn[href*="callback"]',
      eventName: 'callback_request'
    },
    
    // Цель: Скачивание каталога
    catalogDownload: {
      selector: 'a[href*="catalog.pdf"]',
      eventName: 'catalog_download'
    },
    
    // Цель: Клик по цене
    priceClick: {
      selector: '.t-price',
      eventName: 'price_interaction'
    }
  }
});
```

### Программное отслеживание целей

```html
<script>
  // Отследить достижение цели вручную
  document.getElementById('buy-button').addEventListener('click', function() {
    TildaAnalytics.track('custom_goal', {
      goalName: 'clicked_buy_button',
      value: 500,
      productId: '12345'
    });
  });
</script>
```

---

## 🔍 Тестирование интеграции

### Шаг 1: Включите режим отладки

```javascript
TildaAnalytics.init({
  supabaseUrl: '...',
  supabaseKey: '...',
  debug: true  // ← Включаем debug
});
```

### Шаг 2: Откройте консоль браузера

**Chrome/Edge**: `F12 → Console`  
**Firefox**: `F12 → Console`  
**Safari**: `Develop → Show JavaScript Console`

### Шаг 3: Проверьте инициализацию

После загрузки страницы вы должны увидеть:

```
✅ Tilda Analytics initialized
   User ID: 550e8400-e29b-41d4-a716-446655440000
   Session ID: 7c9e6794-b5a1-11eb-8529-0242ac130003
   Fingerprint: a1b2c3d4e5f6g7h8
```

### Шаг 4: Проверьте события

Кликните по кнопке, прокрутите страницу. В консоли должны появиться:

```
📊 Event tracked: click
   Target: button.t-btn
   Text: Заказать сейчас
   
📊 Event tracked: scroll
   Depth: 50%
```

### Шаг 5: Проверьте данные в Supabase

1. Откройте [app.supabase.com](https://app.supabase.com)
2. Выберите ваш проект
3. Перейдите в **Table Editor → events**
4. Обновите страницу → должны появиться записи

![Supabase Table Editor](https://via.placeholder.com/800x400?text=Supabase+Events+Table)

---

## 🐛 Устранение проблем

### Проблема: События не записываются

**Проверьте**:
1. ✅ Правильно ли указаны `supabaseUrl` и `supabaseKey`
2. ✅ Выполнен ли SQL из `database/schema.sql`
3. ✅ Включены ли RLS политики (`database/rls_policies.sql`)
4. ✅ Нет ли ошибок в консоли браузера (F12)

**Решение**:
```javascript
// Проверьте подключение к Supabase
TildaAnalytics.init({
  supabaseUrl: 'ВАШ_URL',
  supabaseKey: 'ВАШ_КЛЮЧ',
  debug: true  // ← Включите логи
});
```

### Проблема: CORS ошибка

```
Access to fetch at 'https://xxx.supabase.co' from origin 'https://tilda.cc' 
has been blocked by CORS policy
```

**Решение**: Supabase по умолчанию разрешает все домены. Если ошибка появляется:
1. Проверьте, что используете `anon` ключ, а не `service_role`
2. Очистите кэш браузера (Ctrl+Shift+Delete)

### Проблема: RLS блокирует INSERT

```
new row violates row-level security policy
```

**Решение**: Убедитесь, что RLS политики настроены:

```sql
-- Проверьте в Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'events';

-- Если политик нет, выполните:
-- database/rls_policies.sql
```

### Проблема: FingerprintJS не работает

**Симптомы**: В консоли ошибка `FingerprintJS is not defined`

**Решение**: Проверьте, что CDN скрипт загружен:
```html
<!-- Должно быть ПЕРЕД collector.js -->
<script src="https://cdn.jsdelivr.net/npm/@fingerprintjs/fingerprintjs@3"></script>
```

### Проблема: Формы Tilda не перехватываются

**Решение**: Tilda использует Ajax-отправку. Коллектор автоматически перехватывает через `MutationObserver`.

Если не работает, попробуйте ручной перехват:

```javascript
// Добавьте в Code before </body>
$(document).on('tildaform:aftersuccess', function (e, form) {
  TildaAnalytics.track('form_submit', {
    formId: $(form).attr('id'),
    formName: $(form).find('input[name="formservices[]"]').val()
  });
});
```

---

## 🎯 Лучшие практики

### 1. Не отслеживайте чувствительные данные

```javascript
// ❌ ПЛОХО: Отправка паролей
excludeSelectors: []

// ✅ ХОРОШО: Исключите поля паролей
excludeSelectors: [
  'input[type="password"]',
  'input[name*="card"]',
  '.sensitive-data'
]
```

### 2. Используйте осмысленные имена событий

```javascript
// ❌ Плохо
customEvents: {
  event1: { selector: '.btn1', eventName: 'e1' }
}

// ✅ Хорошо
customEvents: {
  catalogRequest: { 
    selector: '.catalog-btn', 
    eventName: 'catalog_request' 
  }
}
```

### 3. Минимизируйте payload

```javascript
// ❌ Избыточно
trackMouseMovement: true  // Генерирует тысячи событий

// ✅ Оптимально
trackMouseMovement: false
scrollThresholds: [25, 50, 75, 100]  // Только ключевые точки
```

### 4. Тестируйте на staging

```javascript
// В зависимости от окружения
const isProduction = window.location.hostname !== 'localhost';

TildaAnalytics.init({
  supabaseUrl: isProduction ? 'PROD_URL' : 'DEV_URL',
  supabaseKey: isProduction ? 'PROD_KEY' : 'DEV_KEY',
  debug: !isProduction
});
```

---

## 📱 Особенности Tilda

### Zero Block

Если вы используете Zero Block, убедитесь, что кнопки имеют уникальные классы:

```html
<!-- Добавьте data-атрибут для отслеживания -->
<button class="tn-atom" data-goal="purchase">Купить</button>
```

Затем в конфигурации:

```javascript
customEvents: {
  purchase: {
    selector: '[data-goal="purchase"]',
    eventName: 'purchase_intent'
  }
}
```

### Popup окна

Popup блоки Tilda тоже отслеживаются автоматически. Для уточнения:

```javascript
// Отследить открытие popup
document.addEventListener('DOMNodeInserted', function(e) {
  if (e.target.classList && e.target.classList.contains('t-popup')) {
    TildaAnalytics.track('popup_open', {
      popupId: e.target.id
    });
  }
});
```

---

## ✅ Чеклист интеграции

- [ ] Создан проект в Supabase
- [ ] Выполнен SQL из `database/schema.sql`
- [ ] Выполнен SQL из `database/rls_policies.sql`
- [ ] Добавлены CDN скрипты в `<head>`
- [ ] Загружен `collector.js` на хостинг или вставлен напрямую
- [ ] Инициализирован TildaAnalytics с правильными credentials
- [ ] Протестирован в режиме debug
- [ ] Проверены события в Supabase Table Editor
- [ ] Отключен debug режим для production
- [ ] Добавлены кастомные цели (если нужно)

---

## 🚀 Что дальше?

После успешной интеграции:

1. **Настройте дашборды** в Retool/JetAdmin
2. **Создайте аналитические запросы** (см. `docs/analytics-queries.md`)
3. **Интегрируйте с MindsDB** для ML-прогнозов
4. **Настройте автоматические отчеты** через SQL scheduled queries

---

**Нужна помощь?** Создайте [Issue](../../issues) с описанием проблемы.
