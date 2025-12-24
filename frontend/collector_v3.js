(function () {
    'use strict';

    window.TildaAnalytics = {
        version: '3.0.0',
        config: null,
        supabase: null,

        // State
        userId: null,
        sessionId: null,
        context: {}, // Хранит UTM, Device, Referrer

        // System
        _eventBuffer: [],

        async init(config) {
            // 1. Config
            this.config = {
                supabaseUrl: '',
                supabaseKey: '',
                tableName: 'analytics', // Единая таблица
                debug: false,
                batchInterval: 5000,
                yandexMetrikaId: null,
                ...config
            };

            this._log('🚀 Init v3.0 (Single Table Mode)');

            // 2. Supabase
            if (typeof supabase === 'undefined') {
                console.error('Supabase client not loaded');
                return;
            }
            this.supabase = supabase.createClient(this.config.supabaseUrl, this.config.supabaseKey);

            // 3. Identity & Session
            this._initIdentity();
            this._initContext(); // Собираем UTM, устройство и т.д.

            // 4. Start Tracking
            this._trackEvent('session_start'); // Первое событие
            this._trackEvent('page_view');

            this._initListeners();
            this._initBatchSender();

            if (this.config.yandexMetrikaId) this._initYandexMetrika();
        },

        _initIdentity() {
            // User ID
            let uid = localStorage.getItem('ta_uid');
            if (!uid) {
                uid = this._uuid();
                localStorage.setItem('ta_uid', uid);
            }
            this.userId = uid;

            // Session ID
            let sid = sessionStorage.getItem('ta_sid');
            if (!sid) {
                sid = this._uuid();
                sessionStorage.setItem('ta_sid', sid);
            }
            this.sessionId = sid;
        },

        _initContext() {
            // Собираем данные, которые будут прикрепляться ко ВСЕМ событиям
            this.context = {
                // Device
                ua: navigator.userAgent,
                screen: `${window.screen.width}x${window.screen.height}`,
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                is_mobile: /Mobile|Android|iPhone/i.test(navigator.userAgent),

                // Traffic Source
                referrer: document.referrer || null,

                // UTM (парсим из URL)
                ...this._getUTM(),

                // Landing Info
                entry_url: window.location.href
            };
        },

        _getUTM() {
            const p = new URLSearchParams(window.location.search);
            return {
                utm_source: p.get('utm_source'),
                utm_medium: p.get('utm_medium'),
                utm_campaign: p.get('utm_campaign'),
                utm_content: p.get('utm_content'),
                utm_term: p.get('utm_term'),
                yclid: p.get('yclid'),
                gclid: p.get('gclid')
            };
        },

        // === TRACKING CORE ===

        _trackEvent(name, props = {}) {
            const event = {
                event_name: name,
                user_id: this.userId,
                session_id: this.sessionId,
                page_url: window.location.href,
                created_at: new Date().toISOString(),

                // В поле data кладем ВСЁ: контекст сессии + параметры события
                data: {
                    ...this.context, // Добавляем UTM и Device в каждое событие!
                    ...props,        // Специфичные данные (цена, текст кнопки)
                    page_title: document.title
                }
            };

            this._eventBuffer.push(event);
            this._log('Stopped event:', name);

            if (this._eventBuffer.length >= 5 || ['form_submit', 'yandex_goal'].includes(name)) {
                this._flush();
            }
        },

        async _flush() {
            if (!this._eventBuffer.length) return;

            const events = [...this._eventBuffer];
            this._eventBuffer = [];

            const { error } = await this.supabase
                .from(this.config.tableName)
                .insert(events);

            if (error) {
                console.error('Send error:', error);
                // Возвращаем в буфер при ошибке (опционально, упрощаем для надежности)
            } else {
                this._log(`Sent ${events.length} events`);
            }
        },

        _initBatchSender() {
            setInterval(() => this._flush(), this.config.batchInterval);
            window.addEventListener('beforeunload', () => this._flush());
        },

        // === LISTENERS ===

        _initListeners() {
            // Clicks
            document.addEventListener('click', (e) => {
                const target = e.target.closest('a, button, .t-btn, [role="button"]');
                if (target) {
                    this._trackEvent('click', {
                        text: target.innerText || '',
                        href: target.getAttribute('href'),
                        id: target.id,
                        class: target.className
                    });
                }
            }, true);

            // Scrolls (Debounced 500ms)
            let scrollTimeout;
            window.addEventListener('scroll', () => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    this._trackEvent('scroll', {
                        depth_px: window.scrollY,
                        depth_pct: Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100)
                    });
                }, 1000); // Реже, раз в 1с
            });

            // Forms
            document.addEventListener('submit', (e) => {
                const form = e.target;
                const formData = new FormData(form);
                const data = {};
                formData.forEach((v, k) => {
                    if (k.includes('email') || k.includes('phone') || k.includes('name')) data[k] = v;
                });

                this._trackEvent('form_submit', {
                    form_id: form.id,
                    form_data: data // Collect contacts directly into event
                });
            });
        },

        // === YANDEX METRIKA ===

        _initYandexMetrika() {
            const originalYm = window.ym;
            if (!originalYm) return;

            window.ym = (...args) => {
                if (args[1] === 'reachGoal') {
                    this._trackEvent('yandex_goal', {
                        goal_name: args[2],
                        goal_params: args[3],
                        ym_id: args[0]
                    });
                }
                originalYm(...args);
            };
        },

        _uuid() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },

        _log(...args) {
            if (this.config.debug) console.log('[TildaAnalytics v3]', ...args);
        }
    };
})();
