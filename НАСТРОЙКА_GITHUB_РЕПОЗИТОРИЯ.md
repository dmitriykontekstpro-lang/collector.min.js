# 🔧 НАСТРОЙКА РЕПОЗИТОРИЯ GITHUB (пошагово)

## ✅ У вас уже создан репозиторий! Осталось его настроить

---

## ШАГ 1: Загрузите файл скрипта

### Вариант A: Через веб-интерфейс (ПРОЩЕ)

1. **Откройте ваш репозиторий**:
   ```
   https://github.com/dmitriykontekstpro-lang/collector.min.js
   ```

2. **Нажмите "Add file" → "Create new file"**

3. **В поле "Name your file..." введите**:
   ```
   collector.min.js
   ```

4. **Вставьте код скрипта**:
   - На компьютере откройте: `c:\Users\Дмитрий\.gemini\antigravity\playground\tilda-analytics\collector.min.js`
   - Выделите всё: **Ctrl+A**
   - Скопируйте: **Ctrl+C**
   - Вернитесь на GitHub
   - Вставьте в редактор: **Ctrl+V**

5. **Прокрутите вниз**
   - В поле "Commit new file" введите:
     ```
     Add Tilda Analytics collector
     ```
   - Нажмите зеленую кнопку **"Commit new file"**

✅ **Файл загружен!**

---

## ШАГ 2: Создайте README (рекомендуется)

Вернитесь на главную страницу репозитория:

1. **Нажмите "Add file" → "Create new file"**

2. **В поле имени введите**:
   ```
   README.md
   ```

3. **Вставьте описание**:
   ```markdown
   # Tilda Analytics Collector
   
   Скрипт для сбора поведенческих метрик на сайтах Tilda.
   
   ## Использование
   
   Вставьте в HEAD вашего сайта Tilda:
   
   ```html
   <script src="https://cdn.jsdelivr.net/gh/dmitriykontekstpro-lang/collector.min.js/collector.min.js"></script>
   ```
   
   ## Возможности
   
   - 50+ поведенческих метрик
   - Интеграция с Supabase
   - Перехват целей Яндекс.Метрики
   - Сбор данных из форм
   
   ## Версия
   
   2.0.1 (оптимизированная)
   ```

4. **Commit new file**

---

## ШАГ 3: Настройте описание репозитория

1. **На главной странице репозитория** найдите справа блок "About"

2. **Нажмите иконку шестеренки** ⚙️ (рядом с About)

3. **Заполните**:
   - **Description**: 
     ```
     Tilda Analytics - Behavioral metrics collector for ML predictions
     ```
   
   - **Website** (опционально):
     ```
     https://qqfyjrugrinmdijpsutj.supabase.co
     ```
   
   - **Topics** (теги):
     ```
     tilda analytics javascript supabase metrics tracking
     ```

4. **Нажмите "Save changes"**

---

## ШАГ 4: Включите GitHub Pages (опционально)

Это не обязательно для jsDelivr, но полезно:

1. **Settings** (вкладка вверху) → **Pages** (слева в меню)

2. **В разделе "Source"**:
   - Branch: выберите **main** (или master)
   - Folder: выберите **/ (root)**
   - Нажмите **Save**

3. **Подождите 1-2 минуты**

4. **Обновите страницу** - появится сообщение:
   ```
   Your site is live at https://dmitriykontekstpro-lang.github.io/collector.min.js/
   ```

---

## ШАГ 5: Проверьте доступность файла

### Проверка через jsDelivr (РЕКОМЕНДУЕТСЯ):

Откройте в браузере:
```
https://cdn.jsdelivr.net/gh/dmitriykontekstpro-lang/collector.min.js/collector.min.js
```

Должен открыться ваш скрипт! ✅

### Проверка через GitHub Pages (если включили):

```
https://dmitriykontekstpro-lang.github.io/collector.min.js/collector.min.js
```

---

## ШАГ 6: Используйте в Tilda

### Вставьте в Tilda → Site Settings → Advanced → "Code in &lt;head&gt;":

```html
<!-- Tilda Analytics через jsDelivr CDN -->

<!-- Библиотеки -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="https://cdn.jsdelivr.net/npm/@fingerprintjs/fingerprintjs@3"></script>

<!-- Ваш скрипт с GitHub -->
<script src="https://cdn.jsdelivr.net/gh/dmitriykontekstpro-lang/collector.min.js/collector.min.js"></script>

<!-- Инициализация -->
<script>
(function() {
  'use strict';
  
  function initAnalytics() {
    if (typeof TildaAnalytics === 'undefined') {
      console.error('❌ TildaAnalytics не загрузился с GitHub!');
      return;
    }
    
    TildaAnalytics.init({
      // Supabase
      supabaseUrl: 'https://qqfyjrugrinmdijpsutj.supabase.co',
      supabaseKey: 'sb_publishable_KzDns19CaSpI-40YZgPPCg_hCDb-1Iz',
      
      // Яндекс.Метрика
      yandexMetrikaId: 51854510,
      
      // Режим
      debug: true,  // false на продакшене
      
      // Производительность
      trackMouseMovement: false,
      scrollDebounce: 300,
      mouseDebounce: 500,
      batchInterval: 5000,
      maxBatchSize: 10,
      sessionTimeout: 1800000,
      scrollThresholds: [25, 50, 75, 90, 100],
      useFingerprintJS: true,
      requireConsent: false,
      
      // Callbacks
      callbacks: {
        onInit: function(userId, sessionId) {
          console.log('✅ Tilda Analytics запущен');
          console.log('👤 User:', userId);
          console.log('📊 Session:', sessionId);
          console.log('🎯 Метрика:', 51854510);
        },
        onBatchSent: function(count) {
          console.log('📤 События:', count);
        },
        onError: function(error) {
          console.error('❌ Ошибка:', error);
        }
      }
    });
  }
  
  // Ждем загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnalytics);
  } else {
    initAnalytics();
  }
})();
</script>
```

**Save → Publish**

---

## ШАГ 7: Протестируйте

1. **Откройте ваш сайт Tilda**
2. **F12 → Console**
3. **Обновите страницу (F5)**

### ✅ Должно появиться:
```
✅ Tilda Analytics запущен
👤 User: abc123...
📊 Session: xyz789...
🎯 Метрика: 51854510
📤 События: 1
```

### ✅ В Supabase:
- Table Editor → **events**
- Должны появиться записи

---

## 🔄 Как обновить скрипт в будущем

### Способ 1: Через веб-интерфейс

1. Откройте репозиторий на GitHub
2. Нажмите на файл **collector.min.js**
3. Нажмите иконку **карандаша** (Edit this file)
4. Внесите изменения
5. **Commit changes**

### Способ 2: Загрузите новую версию

1. **Add file → Upload files**
2. Выберите новый файл (заменит старый)
3. **Commit changes**

### ⚡ Обновление CDN:

jsDelivr обновляется:
- **Автоматически**: через 12-24 часа
- **Принудительно**: откройте в браузере
  ```
  https://purge.jsdelivr.net/gh/dmitriykontekstpro-lang/collector.min.js/collector.min.js
  ```

---

## 📊 Дополнительные настройки (опционально)

### Защитите main ветку:

**Settings → Branches → Add rule**
- Branch name pattern: `main`
- ✅ Require pull request reviews before merging

### Добавьте LICENSE:

**Add file → Create new file**
- Name: `LICENSE`
- Template: Choose MIT License
- Commit

### Создайте .gitignore:

Не обязательно для одного файла, но если будете добавлять другие:
```
node_modules/
*.log
.DS_Store
```

---

## ✅ Чеклист настройки:

- [ ] Репозиторий создан на GitHub
- [ ] Файл `collector.min.js` загружен
- [ ] README.md создан
- [ ] Описание репозитория заполнено
- [ ] GitHub Pages включен (опционально)
- [ ] jsDelivr ссылка работает
- [ ] Код вставлен в Tilda HEAD
- [ ] Сайт опубликован
- [ ] Тест пройден (F12 → Console)
- [ ] Данные в Supabase появились

---

## 🎯 Итоговая структура репозитория:

```
collector.min.js/
├── collector.min.js    ← Основной файл
├── README.md           ← Описание
└── LICENSE (опционально)
```

---

## 🔗 Полезные ссылки:

**Ваш репозиторий**:
```
https://github.com/dmitriykontekstpro-lang/collector.min.js
```

**jsDelivr CDN**:
```
https://cdn.jsdelivr.net/gh/dmitriykontekstpro-lang/collector.min.js/collector.min.js
```

**Очистка кэша**:
```
https://purge.jsdelivr.net/gh/dmitriykontekstpro-lang/collector.min.js/collector.min.js
```

---

## 🚀 Готово!

Теперь у вас:
- ✅ Репозиторий на GitHub
- ✅ Скрипт доступен через CDN
- ✅ Компактный код в Tilda (30 строк вместо тысяч)
- ✅ Легко обновлять
- ✅ Работает на всех страницах

**Следуйте шагам 1-7 и всё заработает!** 🎉
