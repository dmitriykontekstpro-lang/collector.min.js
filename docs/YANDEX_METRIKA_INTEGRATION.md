# 🎯 Интеграция с Яндекс.Метрикой - Детальное объяснение

## Как работает перехват целей

### Метод 1: Proxy-паттерн (Monkey Patching) ✅

**Принцип работы**:
1. Ждем, пока загрузится Яндекс.Метрика и появится функция `window.ym`
2. Сохраняем оригинальную функцию
3. Подменяем `window.ym` на нашу обертку
4. Наша обертка записывает цель в БД и вызывает оригинальную функцию

**Код**:
```javascript
// Ждем загрузки Яндекс.Метрики
function waitForYandexMetrika(callback, maxAttempts = 50) {
  let attempts = 0;
  
  const checkInterval = setInterval(() => {
    attempts++;
    
    if (window.ym) {
      clearInterval(checkInterval);
      callback();
    } else if (attempts >= maxAttempts) {
      clearInterval(checkInterval);
      console.warn('Yandex.Metrika not loaded after', maxAttempts * 100, 'ms');
    }
  }, 100); // Проверяем каждые 100ms
}

// Инициализация
waitForYandexMetrika(() => {
  const originalYM = window.ym;
  
  window.ym = function(...args) {
    const counterId = args[0];
    const method = args[1];
    const goalName = args[2];
    const params = args[3]; // Дополнительные параметры цели
    
    // Перехватываем цели
    if (method === 'reachGoal') {
      console.log('🎯 Goal reached:', goalName);
      
      // Записываем в Supabase
      TildaAnalytics._trackYandexGoal(goalName, params);
    }
    
    // Вызываем оригинальную функцию Метрики
    return originalYM.apply(this, args);
  };
  
  console.log('✅ Yandex.Metrika proxy installed');
});
```

**Что перехватывается**:
```javascript
// Любой из этих вызовов будет перехвачен:
ym(87654321, 'reachGoal', 'order_button');
ym(87654321, 'reachGoal', 'form_submit', { form_id: 'contact' });
ym(87654321, 'reachGoal', 'add_to_cart', { price: 1500 });
```

---

### Метод 2: Callback отслеживание (альтернатива) ⭐

Яндекс.Метрика поддерживает **callback** при достижении цели:

```javascript
// Callback при достижении цели
ym(87654321, 'reachGoal', 'order_button', {}, function() {
  console.log('Goal callback triggered');
  TildaAnalytics.goal('order_button_ym');
});
```

**Проблема**: Требует изменения всех существующих вызовов целей на сайте.

---

### Метод 3: dataLayer отслеживание (GTM-стиль) 🔧

Если используется Google Tag Manager или аналог:

```javascript
// Слушаем события в dataLayer
window.dataLayer = window.dataLayer || [];
const originalPush = window.dataLayer.push;

window.dataLayer.push = function(...args) {
  args.forEach(event => {
    if (event.event === 'ymGoal') {
      TildaAnalytics.goal(event.goalName, event.goalValue);
    }
  });
  
  return originalPush.apply(this, args);
};
```

Использование:
```javascript
dataLayer.push({
  'event': 'ymGoal',
  'goalName': 'order_button',
  'goalValue': 1500
});
```

---

## 🔧 Улучшенная версия для collector.js

Замените метод `_initYandexMetrika()` на этот улучшенный вариант:

```javascript
/**
 * Инициализация интеграции с Яндекс.Метрикой
 * Поддерживает асинхронную загрузку счетчика
 */
_initYandexMetrika() {
  this._log('Initializing Yandex.Metrika integration...');
  
  // Функция установки прокси
  const installProxy = () => {
    if (!window.ym) {
      this._log('⚠️ window.ym not found');
      return false;
    }
    
    // Сохраняем оригинальную функцию
    const originalYM = window.ym;
    
    // Подменяем на нашу обертку
    window.ym = (...args) => {
      const counterId = args[0];
      const method = args[1];
      const goalName = args[2];
      const params = args[3];
      
      // Перехватываем только reachGoal
      if (method === 'reachGoal') {
        this._trackYandexGoal(goalName, params);
      }
      
      // Вызываем оригинальную функцию
      return originalYM.apply(window, args);
    };
    
    // Копируем свойства оригинальной функции
    Object.keys(originalYM).forEach(key => {
      window.ym[key] = originalYM[key];
    });
    
    this._log('✅ Yandex.Metrika proxy installed');
    return true;
  };
  
  // Попытка 1: Метрика уже загружена
  if (window.ym) {
    installProxy();
    return;
  }
  
  // Попытка 2: Ждем загрузки Метрики
  let attempts = 0;
  const maxAttempts = 50; // 5 секунд (50 * 100ms)
  
  const checkInterval = setInterval(() => {
    attempts++;
    
    if (window.ym) {
      clearInterval(checkInterval);
      installProxy();
    } else if (attempts >= maxAttempts) {
      clearInterval(checkInterval);
      this._log('⚠️ Yandex.Metrika not loaded after 5 seconds');
      
      // Попытка 3: Устанавливаем заглушку и ждем первого вызова
      this._installYMLazyProxy();
    }
  }, 100);
},

/**
 * Lazy Proxy - устанавливается, если Метрика не загрузилась вовремя
 */
_installYMLazyProxy() {
  let proxyInstalled = false;
  
  // Создаем Proxy для window.ym
  Object.defineProperty(window, 'ym', {
    get() {
      return this._ymFunction;
    },
    set(value) {
      this._ymFunction = value;
      
      // При установке window.ym (загрузке Метрики)
      if (!proxyInstalled && typeof value === 'function') {
        proxyInstalled = true;
        const originalYM = value;
        
        this._ymFunction = function(...args) {
          const method = args[1];
          const goalName = args[2];
          const params = args[3];
          
          if (method === 'reachGoal') {
            TildaAnalytics._trackYandexGoal(goalName, params);
          }
          
          return originalYM.apply(window, args);
        };
        
        TildaAnalytics._log('✅ Yandex.Metrika lazy proxy installed');
      }
    },
    configurable: true
  });
},

/**
 * Записывает цель Яндекс.Метрики в БД
 */
_trackYandexGoal(goalName, params = null) {
  this._log('🎯 Yandex goal reached:', goalName, params);
  
  this._trackEvent('yandex_goal', {
    page_url: window.location.href,
    target_text: goalName,
    payload: {
      custom: {
        goalName: goalName,
        goalType: 'yandex_metrika',
        goalParams: params || {},
        ymCounterId: this.config.yandexMetrikaId,
        timestamp: Date.now()
      },
      timing: {
        timeOnPage: (Date.now() - this.pageStartTime) / 1000
      }
    }
  });
},
```

---

## 📊 Пример: Как это работает на практике

### 1. На сайте есть кнопка с целью:

```html
<button onclick="ym(87654321, 'reachGoal', 'buy_button')">
  Купить сейчас
</button>
```

### 2. Когда пользователь кликает:

**Шаг 1**: Вызывается наша обертка `window.ym`
```javascript
window.ym(87654321, 'reachGoal', 'buy_button')
```

**Шаг 2**: Наш код перехватывает:
```javascript
if (method === 'reachGoal') {
  // goalName = 'buy_button'
  this._trackYandexGoal('buy_button');
}
```

**Шаг 3**: Записываем в Supabase:
```javascript
{
  "event_type": "yandex_goal",
  "target_text": "buy_button",
  "payload": {
    "custom": {
      "goalName": "buy_button",
      "goalType": "yandex_metrika",
      "timestamp": 1703253465789
    }
  }
}
```

**Шаг 4**: Вызываем оригинальную функцию Метрики:
```javascript
return originalYM(87654321, 'reachGoal', 'buy_button');
```

**Результат**: 
- ✅ Цель записана в Supabase
- ✅ Цель отправлена в Яндекс.Метрику
- ✅ Пользователь ничего не заметил

---

## 🔍 Отладка

### Проверка установки прокси:

Откройте консоль браузера (F12) и выполните:

```javascript
// Проверка 1: Метрика загружена?
console.log('ym exists:', typeof window.ym);

// Проверка 2: Это наш прокси?
console.log('Proxy active:', window.ym.toString().includes('TildaAnalytics'));

// Проверка 3: Вызов тестовой цели
ym(87654321, 'reachGoal', 'test_goal');
// Должно появиться: [TildaAnalytics] 🎯 Yandex goal reached: test_goal
```

### Просмотр записанных целей в Supabase:

```sql
SELECT 
  created_at,
  target_text as goal_name,
  payload->'custom'->>'goalParams' as params
FROM events
WHERE event_type = 'yandex_goal'
ORDER BY created_at DESC
LIMIT 10;
```

---

## ⚠️ Важные моменты

### 1. Порядок загрузки скриптов

**Правильно**:
```html
<!-- 1. Яндекс.Метрика (в head) -->
<script>
  (function(m,e,t,r,i,k,a){...})  
</script>

<!-- 2. Supabase -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- 3. Наш коллектор -->
<script src="/collector.js"></script>

<!-- 4. Инициализация -->
<script>
  TildaAnalytics.init({
    supabaseUrl: '...',
    supabaseKey: '...',
    yandexMetrikaId: 87654321
  });
</script>
```

### 2. Асинхронная загрузка Метрики

Если Метрика загружается **асинхронно** (рекомендовано):
```html
<script async src="https://mc.yandex.ru/metrika/tag.js"></script>
```

Наш улучшенный код **автоматически** подождет загрузки.

### 3. Несколько счетчиков

Если на сайте несколько счетчиков Метрики:
```javascript
ym(87654321, 'reachGoal', 'goal1');
ym(12345678, 'reachGoal', 'goal2');
```

Будут перехвачены **обе** цели.

---

## 📝 Что записывается в БД

```json
{
  "id": 12345,
  "session_id": "abc-123",
  "event_type": "yandex_goal",
  "page_url": "https://site.com/order",
  "target_text": "buy_button",
  "payload": {
    "custom": {
      "goalName": "buy_button",
      "goalType": "yandex_metrika",
      "goalParams": {},
      "ymCounterId": 87654321,
      "timestamp": 1703253465789
    },
    "timing": {
      "timeOnPage": 45.3
    }
  },
  "created_at": "2025-12-22T15:07:00Z"
}
```

---

## 🚀 Готово к использованию!

Улучшенный код **автоматически**:
- ✅ Ждет загрузки Яндекс.Метрики
- ✅ Перехватывает все цели
- ✅ Записывает в Supabase
- ✅ Не ломает работу Метрики
- ✅ Работает с async загрузкой

**Обновите** метод `_initYandexMetrika()` в вашем `collector.js` на улучшенную версию выше.

---

## 🎓 Альтернатива: Ручное логирование целей

Если не хотите использовать proxy, можно логировать цели вручную:

```javascript
// В каждом месте, где вызывается цель:
function trackGoal(goalName) {
  // Отправляем в Яндекс.Метрику
  ym(87654321, 'reachGoal', goalName);
  
  // Отправляем в наш коллектор
  TildaAnalytics.goal(goalName);
}

// Использование:
trackGoal('buy_button');
```

Но это требует **изменения всего кода** на сайте.

---

**Рекомендация**: Используйте улучшенную версию с автоматическим ожиданием загрузки Метрики. Она работает прозрачно и не требует изменений в коде сайта.
