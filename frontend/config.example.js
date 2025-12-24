// Пример конфигурации для Tilda Analytics
// Скопируйте этот файл и переименуйте в config.js

const TildaAnalyticsConfig = {
    // === ОБЯЗАТЕЛЬНЫЕ ПАРАМЕТРЫ ===

    // URL вашего Supabase проекта
    // Найдите в: Project Settings > API > Project URL
    supabaseUrl: 'https://xxxxxxxxxxxxx.supabase.co',

    // Публичный anon-key
    // Найдите в: Project Settings > API > Project API keys > anon public
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjI0MjQwMCwiZXhwIjoxOTMxODE4NDAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',


    // === ОПЦИОНАЛЬНЫЕ ПАРАМЕТРЫ ===

    // Включить отладочные логи в консоль
    debug: false,

    // Интервал отправки событий (миллисекунды)
    batchInterval: 5000, // 5 секунд

    // Максимальное количество событий в буфере
    maxBatchSize: 10,

    // Таймаут сессии (миллисекунды)
    sessionTimeout: 1800000, // 30 минут

    // Отслеживать движения мыши (может повысить нагрузку)
    trackMouseMovement: false,

    // Debounce для scroll событий (миллисекунды)
    scrollDebounce: 200,

    // Debounce для mouse movement (если включен)
    mouseDebounce: 500,

    // Пороги для scroll tracking (проценты)
    scrollThresholds: [25, 50, 75, 90, 100],

    // Включить сбор IP адреса (требует серверного компонента)
    collectIP: false,

    // Включить FingerprintJS (более точная идентификация)
    useFingerprintJS: true,

    // Пользовательские события (кастомные цели)
    customEvents: {
        // Пример: отслеживание кнопки "Скачать прайс"
        downloadPrice: {
            selector: 'a[href*="price.pdf"]',
            eventName: 'download_price'
        },
        // Пример: клик по номеру телефона
        phoneClick: {
            selector: 'a[href^="tel:"]',
            eventName: 'phone_click'
        }
    },

    // Исключения: элементы, которые НЕ нужно отслеживать
    excludeSelectors: [
        '.analytics-ignore',
        '[data-no-track]',
        '#cookie-banner'
    ],

    // GDPR: требовать согласие перед сбором данных
    requireConsent: false,

    // Функция проверки согласия (если requireConsent = true)
    consentCheck: function () {
        // Пример: проверка cookie consent
        return localStorage.getItem('analytics_consent') === 'true';
    },

    // Callback функции (опционально)
    callbacks: {
        // Вызывается после успешной инициализации
        onInit: function (userId, sessionId) {
            if (this.debug) {
                console.log('Analytics initialized:', { userId, sessionId });
            }
        },

        // Вызывается после отправки batch событий
        onBatchSent: function (eventCount) {
            if (this.debug) {
                console.log(`Sent ${eventCount} events`);
            }
        },

        // Вызывается при ошибке
        onError: function (error) {
            if (this.debug) {
                console.error('Analytics error:', error);
            }
        }
    }
};

// Экспорт для использования в collector.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TildaAnalyticsConfig;
}
