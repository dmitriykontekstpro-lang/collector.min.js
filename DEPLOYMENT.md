# Инструкция по Развертыванию Tilda Analytics

Это решение состоит из двух частей:
1.  **Frontend**: JS-скрипт (`tilda-analytics.js`), который работает в браузере пользователя на сайте.
2.  **Backend**: База данных (Supabase) для приема и хранения данных.

Ниже описаны шаги для полноценного запуска.

---

## Часть 1: Хостинг Скрипта (Frontend)

Вы не можете просто загрузить `.js` файл в саму Тильду как файл. Вам нужно разместить его на хостинге, чтобы получить прямую ссылку (например, `https://your-site.com/tilda-analytics.js`), которую мы вставим в Тильду.

### Вариант А: GitHub Pages (Бесплатно & Просто)
1.  Создайте репозиторий на GitHub.
2.  Загрузите туда файл `tilda-analytics.js`.
3.  Зайдите в **Settings** -> **Pages**.
4.  Включите GitHub Pages (Source: `main` branch).
5.  Ваш скрипт будет доступен по адресу: `https://<ваш-логин>.github.io/<имя-репо>/tilda-analytics.js`.
6.  **Используйте эту ссылку для вставки в Tilda.**

### Вариант Б: Свой хостинг / S3 / CDN
Если у вас есть доступ к любому веб-серверу (Nginx, Apache) или облачному хранилищу (AWS S3, Selectel и т.д.), просто загрузите файл туда и получите публичную ссылку.

---

## Часть 2: Бэкенд (База Данных)

### Вариант А: Supabase (Рекомендуемый)
Это "Backend-as-a-Service". Вам не нужно писать серверный код, Supabase предоставляет готовый API.

1.  **Создайте проект**: На [supabase.com](https://supabase.com).
2.  **Создайте таблицу**: В SQL Editor выполните:
    ```sql
    CREATE TABLE user_analytics (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        session_id TEXT,
        user_id TEXT,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        analytics_data JSONB
    );
    ```
3.  **Откройте доступ (RLS)**:
    Чтобы скрипт мог *писать* данные, но никто не мог их *читать* или удалять:
    - Перейдите в **Authentication** -> **Policies**.
    - Создайте политику для `INSERT`:
      - Name: `Enable insert for anon users`
      - Allowed operations: `INSERT`
      - Target roles: `anon`
      - Condition: `true` (или проверка токена, если нужно).
4.  **Получите ключи**:
    - В настройках проекта (API) скопируйте `Project URL` и `anon public key`.
    - Вставьте их в конфигурацию скрипта на Tilda.

### Вариант Б: Собственный Бэкенд (Node.js / Python / PHP)
Если вы хотите отправлять данные на свой личный сервер вместо Supabase.

1.  **Измените скрипт**:
    В файле `tilda-analytics.js` найдите метод `sendToSupabase` и замените его на `fetch`:

    ```javascript
    async sendToSupabase(data) {
      // Отправка на ваш личный сервер
      try {
        await fetch('https://api.vash-site.ru/collect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: this.state.sessionId,
            analytics_data: data
          })
        });
        this.log('Data sent to custom backend!');
      } catch (e) {
        this.log('Error sending:', e);
      }
    }
    ```
2.  **Создайте эндпоинт на сервере**:
    Пример для Node.js (Express):
    ```javascript
    app.post('/collect', (req, res) => {
      const { session_id, analytics_data } = req.body;
      // Сохраните в MySQL, PostgreSQL, MongoDB или файл
      console.log('New session:', session_id);
      db.save(analytics_data);
      res.sendStatus(200);
    });
    ```

---

## Часть 3: Подключение на Tilda

1.  Зайдите в настройки сайта -> **Ещё** -> **HTML-код для вставки внутрь HEAD**.
2.  Вставьте код загрузки и инициализации:

```html
<!-- 1. Загрузка скрипта с вашего хостинга -->
<script src="https://<ВАШ-ХОСТИНГ>/tilda-analytics.js"></script>

<!-- 2. Инициализация -->
<script>
  window.addEventListener('load', function() {
    new TildaAnalytics({
      // Если используете Supabase
      supabaseUrl: 'https://xyz.supabase.co', 
      supabaseKey: 'eyJhbGciOiJIUzI1NiIsIn...',
      tableName: 'user_analytics',
      
      // Если используете свой бэкенд (Вариант Б), 
      // эти поля можно оставить пустыми или удалить, если вы изменили код скрипта.
      debug: true // включить логи в консоли браузера для теста
    });
  });
</script>
```
