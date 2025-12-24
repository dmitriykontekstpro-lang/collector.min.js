(function () {
    'use strict';

    // TILDA ANALYTICS v4.0 (User Profile Mode)

    window.TildaAnalytics = {
        config: null,
        supabase: null,

        // Внутреннее состояние (синхронизируется с localStorage)
        state: {
            userId: null,
            currentSessionId: null,
            sessions: {}, // { id: seconds }
            events: new Set(),
            goals: new Set(),
            lastActivity: Date.now(),
            isNewUser: false
        },

        // Флаги
        _synced: false,
        _syncTimer: null,
        _tickTimer: null,

        async init(config) {
            this.config = {
                supabaseUrl: '',
                supabaseKey: '',
                tableName: 'user_profiles',
                minSessionDuration: 10, // sek
                sessionTimeout: 20 * 60 * 1000, // 20 min
                syncInterval: 10000, // 10 sek
                debug: false,
                yandexMetrikaId: null,
                ...config
            };

            if (typeof supabase === 'undefined') {
                console.error('Supabase not loaded'); return;
            }
            this.supabase = supabase.createClient(this.config.supabaseUrl, this.config.supabaseKey);

            this._loadState();
            this._checkSessionTimeout();
            this._initTick();
            this._initListeners();

            if (this.config.yandexMetrikaId) this._initYandexMetrika();

            this._log('🚀 Init v4 (Profile Mode)');

            // Сразу трекаем просмотр
            this.trackEvent('page_view');
        },

        // === STATE MANAGEMENT ===

        _loadState() {
            // 1. User ID
            let uid = localStorage.getItem('ta_uid');
            if (!uid) {
                uid = this._uuid();
                localStorage.setItem('ta_uid', uid);
                this.state.isNewUser = true;
            }
            this.state.userId = uid;

            // 2. Load History
            try {
                const saved = JSON.parse(localStorage.getItem('ta_store') || '{}');
                this.state.sessions = saved.sessions || {};
                this.state.events = new Set(saved.events || []);
                this.state.goals = new Set(saved.goals || []);
                this.state.lastActivity = saved.lastActivity || Date.now();
                this.state.currentSessionId = saved.currentSessionId || null;
            } catch (e) {
                console.error('State load error', e);
            }
        },

        _saveState() {
            localStorage.setItem('ta_store', JSON.stringify({
                sessions: this.state.sessions,
                events: Array.from(this.state.events),
                goals: Array.from(this.state.goals),
                lastActivity: this.state.lastActivity,
                currentSessionId: this.state.currentSessionId
            }));
        },

        _checkSessionTimeout() {
            const now = Date.now();
            const timeSinceLast = now - this.state.lastActivity;

            // Если сессии нет или прошло больше 20 минут (timeout)
            if (!this.state.currentSessionId || timeSinceLast > this.config.sessionTimeout) {
                // Создаем новую сессию
                this.state.currentSessionId = this._uuid();
                this.state.sessions[this.state.currentSessionId] = 0; // 0 секунд
                this._log('🆕 New Session started:', this.state.currentSessionId);
            }

            this.state.lastActivity = now;
            this._saveState();
        },

        // === CORE LOGIC ===

        _initTick() {
            // Каждую секунду увеличиваем счетчик времени
            this._tickTimer = setInterval(() => {
                if (document.hidden) return; // Не считаем время в фоне

                const sid = this.state.currentSessionId;
                if (sid) {
                    // Инкремент секунд
                    this.state.sessions[sid] = (this.state.sessions[sid] || 0) + 1;
                    this.state.lastActivity = Date.now();
                    this._saveState();

                    this._trySync(); // Пробуем отправить
                }
            }, 1000);
        },

        async _trySync() {
            const sid = this.state.currentSessionId;
            const currentDuration = this.state.sessions[sid] || 0;

            // Правило: Новые юзеры < 10 секунд не пишутся
            // Но если юзер СТАРЫЙ (у него уже были сессии), то пишем сразу? 
            // User requested: "Только если сессия НОВОГО user_id больше 10 секунд"

            const isShort = currentDuration < this.config.minSessionDuration;
            const hasHistory = Object.keys(this.state.sessions).length > 1; // Были другие сессии

            if (this.state.isNewUser && !hasHistory && isShort) {
                // Ждем накопления 10 секунд
                return;
            }

            // Ограничение частоты отправки (Throttle)
            // Отправляем каждые 10 сек, или если это первая отправка
            if (this._synced && (Date.now() - this._lastSyncTime < this.config.syncInterval)) {
                return;
            }

            await this._syncToSupabase();
        },

        async _syncToSupabase() {
            // Готовим данные
            const totalSeconds = Object.values(this.state.sessions).reduce((a, b) => a + b, 0);
            const totalSessions = Object.keys(this.state.sessions).length;

            // Контекст (устройство, UTM)
            const context = {
                ua: navigator.userAgent,
                screen: `${window.screen.width}x${window.screen.height}`,
                is_mobile: /Mobile|Android|iPhone/i.test(navigator.userAgent),
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                referrer: document.referrer || null,
                entry_url: window.location.href,
                page_title: document.title,

                // Статистика
                total_time_sec: totalSeconds,
                total_sessions_count: totalSessions,

                // UTM
                ...this._getUTM()
            };

            // Список событий
            const eventsStr = Array.from(this.state.events).join(', ');
            const goalsStr = Array.from(this.state.goals).join(', ');

            // Payload
            const payload = {
                user_id: this.state.userId,
                sessions_history: this.state.sessions,
                events_triggered: eventsStr,
                yandex_goals: goalsStr,
                data: context,
                last_updated: new Date().toISOString()
            };

            this._log('⬆️ Syncing...', payload);

            const { error } = await this.supabase
                .from(this.config.tableName)
                .upsert(payload, { onConflict: 'user_id' });

            if (error) {
                console.error('Sync failed:', error);
            } else {
                this._synced = true;
                this._lastSyncTime = Date.now();
            }
        },

        // === TRACKING ===

        trackEvent(name) {
            this.state.events.add(name);
            this._saveState();
            // Не вызываем sync сразу, ждем тика таймера
        },

        trackGoal(goalId, params) {
            this.state.goals.add(goalId);
            this.trackEvent('yandex_goal');
            this._saveState();
            this._log('🎯 Goal:', goalId);
        },

        // === HELPERS & LISTENERS ===

        _initListeners() {
            // Clicks
            document.addEventListener('click', (e) => {
                const target = e.target.closest('a, button, .t-btn, [role="button"]');
                if (target) this.trackEvent('click');
            }, true);

            // Forms
            document.addEventListener('submit', () => this.trackEvent('form_submit'));
        },

        _initYandexMetrika() {
            const originalYm = window.ym;
            if (!originalYm) return;
            window.ym = (...args) => {
                if (args[1] === 'reachGoal') {
                    this.trackGoal(args[2], args[3]);
                }
                originalYm(...args);
            };
        },

        _getUTM() {
            const p = new URLSearchParams(window.location.search);
            return {
                utm_source: p.get('utm_source'),
                utm_medium: p.get('utm_medium'),
                utm_campaign: p.get('utm_campaign'),
                utm_content: p.get('utm_content'),
                utm_term: p.get('utm_term')
            };
        },

        _uuid() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },

        _log(...args) {
            if (this.config.debug) console.log('[TildaAnalytics v4]', ...args);
        }
    };
})();
