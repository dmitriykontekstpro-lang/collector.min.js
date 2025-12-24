# 🚀 КАК ЗАГРУЗИТЬ КОД НА GITHUB (пошагово)

Вижу что у вас уже создан репозиторий `collector.min.js` на GitHub! ✅

---

## СПОСОБ 1: Через веб-интерфейс GitHub (САМЫЙ ПРОСТОЙ)

### Шаг 1: Создайте файл

1. На странице репозитория (где вы сейчас) нажмите кнопку **"creating a new file"** (синяя ссылка в тексте)
   
   ИЛИ нажмите **"Add file"** → **"Create new file"**

2. В поле "Name your file..." введите:
   ```
   collector.min.js
   ```

3. В большом поле ниже (редактор) вставьте **ВЕСЬ код** из вашего файла:
   - Откройте на компьютере: `c:\Users\Дмитрий\.gemini\antigravity\playground\tilda-analytics\collector.min.js`
   - Выделите всё (Ctrl+A)
   - Скопируйте (Ctrl+C)
   - Вернитесь на GitHub и вставьте (Ctrl+V)

4. Прокрутите вниз, в поле "Commit new file" введите:
   ```
   Add Tilda Analytics collector script
   ```

5. Нажмите зеленую кнопку **"Commit new file"**

**Готово!** Файл загружен ✅

---

## СПОСОБ 2: Загрузить готовый файл

### Шаг 1: Загрузите файл

1. На странице репозитория нажмите **"Add file"** → **"Upload files"**

2. Перетащите файл `collector.min.js` с компьютера в окно GitHub
   
   ИЛИ нажмите **"choose your files"** и выберите файл

3. Введите описание:
   ```
   Upload Tilda Analytics script
   ```

4. Нажмите **"Commit changes"**

**Готово!** Файл загружен ✅

---

## Шаг 2: Включите GitHub Pages

После загрузки файла:

1. Перейдите в **Settings** (вкладка вверху репозитория)

2. В левом меню найдите **Pages**

3. В разделе "Source" выберите:
   - Branch: **main** (или master)
   - Folder: **/ (root)**

4. Нажмите **Save**

5. Подождите 1-2 минуты

6. Обновите страницу - появится сообщение:
   ```
   Your site is live at https://dmitriykontekstpro-lang.github.io/collector.min.js/
   ```

---

## Шаг 3: Получите ссылку на файл

### Вариант A: Прямая ссылка GitHub Pages
```
https://dmitriykontekstpro-lang.github.io/collector.min.js/collector.min.js
```

### Вариант B: jsDelivr CDN (РЕКОМЕНДУЕТСЯ - быстрее!)
```
https://cdn.jsdelivr.net/gh/dmitriykontekstpro-lang/collector.min.js/collector.min.js
```

**Используйте Вариант B** - jsDelivr работает быстрее!

---

## Шаг 4: Вставьте в Tilda

Теперь в **Tilda → Site Settings → Advanced → "Code in &lt;head&gt;"** вставьте:

```html
<!-- Библиотеки -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="https://cdn.jsdelivr.net/npm/@fingerprintjs/fingerprintjs@3"></script>

<!-- Ваш скрипт с GitHub -->
<script src="https://cdn.jsdelivr.net/gh/dmitriykontekstpro-lang/collector.min.js/collector.min.js"></script>

<!-- Инициализация -->
<script>
  document.addEventListener('DOMContentLoaded', function() {
    if (typeof TildaAnalytics !== 'undefined') {
      TildaAnalytics.init({
        supabaseUrl: 'https://qqfyjrugrinmdijpsutj.supabase.co',
        supabaseKey: 'sb_publishable_KzDns19CaSpI-40YZgPPCg_hCDb-1Iz',
        yandexMetrikaId: 51854510,
        debug: true,
        trackMouseMovement: false,
        scrollDebounce: 300,
        mouseDebounce: 500,
        batchInterval: 5000,
        maxBatchSize: 10,
        sessionTimeout: 1800000,
        scrollThresholds: [25, 50, 75, 90, 100],
        useFingerprintJS: true,
        requireConsent: false,
        callbacks: {
          onInit: function(userId, sessionId) {
            console.log('✅ Tilda Analytics запущен');
            console.log('User ID:', userId);
            console.log('Session ID:', sessionId);
          },
          onBatchSent: function(eventCount) {
            console.log('📤 Отправлено событий:', eventCount);
          },
          onError: function(error) {
            console.error('❌ Ошибка:', error);
          }
        }
      });
    } else {
      console.error('❌ TildaAnalytics не загружен с GitHub!');
    }
  });
</script>
```

---

## ✅ Проверка

1. **Save** в Tilda
2. **Publish**
3. Откройте сайт
4. F12 → Console
5. Должно появиться:
   ```
   ✅ Tilda Analytics запущен
   ```

---

## 🎯 Преимущества этого метода:

- ✅ Код на GitHub (можно обновлять)
- ✅ jsDelivr CDN (быстрая доставка)
- ✅ Всего 30 строк в HEAD Tilda (компактно!)
- ✅ Легко обновлять: просто замените файл на GitHub

---

## 🔄 Как обновить код в будущем:

1. Откройте репозиторий на GitHub
2. Нажмите на файл `collector.min.js`
3. Нажмите иконку карандаша (Edit)
4. Внесите изменения
5. **Commit changes**
6. jsDelivr автоматически обновится через 12-24 часа

Для мгновенного обновления используйте:
```
https://purge.jsdelivr.net/gh/dmitriykontekstpro-lang/collector.min.js/collector.min.js
```

---

## 📦 Итого:

1. ✅ Загрузите `collector.min.js` на GitHub (Способ 1 или 2)
2. ✅ Включите GitHub Pages (не обязательно для jsDelivr)
3. ✅ Вставьте код в Tilda HEAD (30 строк выше)
4. ✅ Save → Publish

**Готово!** Скрипт будет работать на всех страницах! 🚀
