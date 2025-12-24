/**
 * Tilda Analytics v7.2 (Auto-Sync)
 * Hosted at: https://github.com/dmitriykontekstpro-lang/collector.min.js
 */
(function () {
  'use strict';
  window.TildaAnalytics = {
    config: null, supabase: null,
    state: {
      userId: null, currentSessionId: null, sessions: {}, events: new Set, goals: new Set,
      hasSynced: false, firstVisit: null, lastVisit: null, totalVisits: 0,
      ymClientId: null, isLead: false
    },
    // Sensors state
    behavior: {
      scrollMax: 0, selectionCount: 0, mouseDistance: 0, mouseTime: 0,
      formStarted: null, fieldsFilled: new Set(), lastScrollY: 0,
      rageClicks: 0, tabSwitches: 0, tabHiddenTime: 0, hoverHesitationTime: 0,
      scrollDirectionChanges: 0, textCopiedCount: 0,
      exitElement: null // NEW: Последний элемент перед уходом
    },
    _synced: false, _syncTimer: null, _tickTimer: null,
    _lastClick: { time: 0, x: 0, y: 0 }, _hoverStart: null, _hiddenStart: null, _lastScrollDir: 1,

    async init(e) {
      this.config = { supabaseUrl: "", supabaseKey: "", tableName: "analytics", minSessionDuration: 10, sessionTimeout: 12e5, syncInterval: 1e4, debug: false, yandexMetrikaId: null, ...e };
      // Ждем загрузки Supabase, если его еще нет
      if (typeof supabase === 'undefined') {
        console.warn('[TA] Supabase not loaded yet, waiting...');
        setTimeout(() => this.init(e), 500);
        return;
      }

      this.supabase = supabase.createClient(this.config.supabaseUrl, this.config.supabaseKey);
      this._loadState();
      this._checkSessionTimeout();
      this._initHardwareInfo();
      this._initBehaviorSensors();
      this._initTick();
      this._initListeners();
      if (this.config.yandexMetrikaId) {
        this._initYandexMetrika();
        this._fetchYandexClientID();
      }
      this._log("🚀 Init v7.2 (Auto-Sync Active)");
      this.trackEvent("page_view");
    },

    // --- 1. STATE ---
    _loadState() {
      let uid = localStorage.getItem("ta_uid");
      if (!uid) { uid = this._uuid(); localStorage.setItem("ta_uid", uid); }
      this.state.userId = uid;
      try {
        const s = JSON.parse(localStorage.getItem("ta_store") || "{}");
        this.state.sessions = s.sessions || {};
        this.state.events = new Set(s.events || []);
        this.state.goals = new Set(s.goals || []);
        this.state.lastActivity = s.lastActivity || Date.now();
        this.state.currentSessionId = s.currentSessionId || null;
        this.state.hasSynced = !!s.hasSynced;
        this.state.firstVisit = s.firstVisit || Date.now();
        this.state.lastVisit = s.lastVisit || Date.now();
        this.state.totalVisits = s.totalVisits || 0;
        this.state.ymClientId = s.ymClientId || null;
        this.state.isLead = !!s.isLead;
        if (!this.state.currentSessionId) this.state.totalVisits++;
      } catch (e) { }
    },

    _saveState() {
      localStorage.setItem("ta_store", JSON.stringify({
        sessions: this.state.sessions, events: Array.from(this.state.events), goals: Array.from(this.state.goals),
        lastActivity: this.state.lastActivity, currentSessionId: this.state.currentSessionId, hasSynced: this.state.hasSynced,
        firstVisit: this.state.firstVisit, lastVisit: this.state.lastVisit, totalVisits: this.state.totalVisits,
        ymClientId: this.state.ymClientId, isLead: this.state.isLead
      }));
    },

    _checkSessionTimeout() {
      const now = Date.now();
      if (!this.state.currentSessionId || now - this.state.lastActivity > this.config.sessionTimeout) {
        this.state.currentSessionId = this._uuid();
        this.state.sessions[this.state.currentSessionId] = 0;
        this.state.lastVisit = now;
        this._log("🆕 New Session");
      }
      this.state.lastActivity = now;
      this._saveState();
    },

    // --- 2. YANDEX METRIKA PRO ---
    _initYandexMetrika() {
      const originalYm = window.ym;
      if (!originalYm) return;
      window.ym = (...args) => {
        if (args[1] === 'reachGoal') {
          const goalId = args[2];
          this.trackGoal(goalId, args[3]);
          if (goalId === 'REG_SEND_FINAL' || goalId == 281047303) {
            this._log("⭐ LEAD DETECTED: REG_SEND_FINAL");
            this.state.isLead = true;
            this.trackEvent('conversion_lead');
          }
        }
        originalYm(...args);
      };
    },

    _fetchYandexClientID() {
      const check = () => {
        if (this.state.ymClientId) return;
        if (window.ym) {
          try {
            window.ym(this.config.yandexMetrikaId, 'getClientID', (clientID) => {
              if (clientID) {
                this.state.ymClientId = clientID;
                this._saveState();
                this._log("🆔 Yandex ClientID:", clientID);
              }
            });
          } catch (e) { }
        }
      };
      check(); setTimeout(check, 2000); setTimeout(check, 5000); setTimeout(check, 10000);
    },

    trackGoal(id, params) {
      this.state.goals.add(id); this.trackEvent("yandex_goal"); this._saveState(); this._log("🎯 Goal:", id);
    },

    // --- 3. BEHAVIOR SENSORS ---
    _initBehaviorSensors() {
      document.addEventListener('click', (e) => {
        const now = Date.now();
        const dist = Math.sqrt(Math.pow(e.clientX - this._lastClick.x, 2) + Math.pow(e.clientY - this._lastClick.y, 2));
        if (now - this._lastClick.time < 300 && dist < 20) { this.behavior.rageClicks++; this._log("😡 Rage Click"); }
        this._lastClick = { time: now, x: e.clientX, y: e.clientY };
        if (e.target.closest('a, button')) this.trackEvent("click");
      }, true);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          this.behavior.tabSwitches++;
          this._hiddenStart = Date.now();
          // Запоминаем элемент, на котором ушли
          if (this._currentHoverElement) this.behavior.exitElement = this._currentHoverElement;
        }
        else if (this._hiddenStart) { this.behavior.tabHiddenTime += (Date.now() - this._hiddenStart); this._hiddenStart = null; }
      });
      document.body.addEventListener('mouseover', (e) => {
        // 1. Hover Hesitation
        if (e.target.closest('a, button, input')) this._hoverStart = Date.now();

        // 2. Exit Tracker (Запоминаем элемент под мышкой)
        // Берем текст элемента или ID или Класс (обрезаем до 50 символов)
        let el = e.target.innerText || e.target.id || e.target.className;
        if (typeof el === 'string') {
          this._currentHoverElement = el.substring(0, 50).replace(/\s+/g, ' ').trim();
        }
      });
      document.body.addEventListener('click', (e) => {
        // Также обновляем при клике (на случай тачскринов)
        let el = e.target.innerText || e.target.id || e.target.className;
        if (typeof el === 'string') {
          this._currentHoverElement = el.substring(0, 50).replace(/\s+/g, ' ').trim();
        }
      });

      document.body.addEventListener('mouseout', (e) => {
        if (this._hoverStart && e.target.closest('a, button, input')) {
          const diff = Date.now() - this._hoverStart; if (diff > 400 && diff < 8000) this.behavior.hoverHesitationTime += diff; this._hoverStart = null;
        }
      });
      document.addEventListener('copy', () => this.behavior.textCopiedCount++);
      document.addEventListener('selectionchange', () => { const s = document.getSelection(); if (s && !s.isCollapsed && !this._selDebounce) { this.behavior.selectionCount++; this._selDebounce = setTimeout(() => this._selDebounce = null, 500); } });
      let lX = 0, lY = 0, lT = Date.now();
      document.addEventListener('mousemove', (e) => {
        const now = Date.now(), dt = now - lT; if (dt > 100) { this.behavior.mouseDistance += Math.sqrt(Math.pow(e.clientX - lX, 2) + Math.pow(e.clientY - lY, 2)); this.behavior.mouseTime += dt; lX = e.clientX; lY = e.clientY; lT = now; }
      }, { passive: true });
      window.addEventListener('scroll', () => {
        const st = window.scrollY, dir = st > this.behavior.lastScrollY ? 1 : -1;
        if (dir !== this._lastScrollDir && Math.abs(st - this.behavior.lastScrollY) > 50) { this.behavior.scrollDirectionChanges++; this._lastScrollDir = dir; }
        const p = Math.round((st / (document.body.scrollHeight - window.innerHeight)) * 100); if (p > this.behavior.scrollMax) this.behavior.scrollMax = p; this.behavior.lastScrollY = st;
      }, { passive: true });
      document.addEventListener('focusin', (e) => { if (/INPUT|TEXTAREA/.test(e.target.tagName) && !this.behavior.formStarted) this.behavior.formStarted = Math.round(performance.now() / 1000); }, true);
      document.addEventListener('change', (e) => { if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) this.behavior.fieldsFilled.add(e.target.name || e.target.id); }, true);
    },

    // --- 4. HARDWARE ---
    _initHardwareInfo() {
      const n = navigator, c = n.connection || {};
      this.env = { screen_width: window.screen.width, screen_height: window.screen.height, device_memory_gb: n.deviceMemory || null, hardware_concurrency: n.hardwareConcurrency || null, network_downlink: c.downlink || null, os_type: this._getOS(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, is_working_hours: this._isWorkingHours() };
    },
    _getOS() { const u = navigator.userAgent; if (/Windows/.test(u)) return 'Windows'; if (/Mac/.test(u)) return 'MacOS'; if (/iPhone|iPad/.test(u)) return 'iOS'; if (/Android/.test(u)) return 'Android'; return 'Other' },
    _isWorkingHours() { const h = new Date().getHours(), d = new Date().getDay(); return (d >= 1 && d <= 5) && (h >= 9 && h < 18) },

    // --- 5. SYNC ---
    _initTick() {
      this._tickTimer = setInterval(() => {
        if (!document.hidden && this.state.currentSessionId) {
          this.state.sessions[this.state.currentSessionId] = (this.state.sessions[this.state.currentSessionId] || 0) + 1;
          this.state.lastActivity = Date.now(); this._saveState(); this._trySync();
        }
      }, 1000);
    },

    async _trySync() {
      const s = this.state.currentSessionId, d = this.state.sessions[s] || 0;
      if (!this.state.hasSynced && d < this.config.minSessionDuration) return;
      if (!this._synced || !(Date.now() - this._lastSyncTime < this.config.syncInterval)) await this._syncToSupabase();
    },

    async _syncToSupabase() {
      const tot = Object.values(this.state.sessions).reduce((a, b) => a + b, 0);
      const focusT = tot * 1000, totalT = focusT + this.behavior.tabHiddenTime, focPct = totalT > 0 ? Math.round((focusT / totalT) * 100) : 100;
      const msSpd = this.behavior.mouseTime > 0 ? Math.round(this.behavior.mouseDistance / (this.behavior.mouseTime / 1000)) : 0;

      const data = {
        ...this.env, ...this._getUTM(),
        ym_client_id: this.state.ymClientId,
        is_lead: this.state.isLead,
        traffic_source_type: this._determineSource(),
        entry_url: window.location.href, page_title: document.title,
        total_time_sec: tot, total_sessions_count: this.state.totalVisits,
        days_since_first_visit: Math.round((Date.now() - this.state.firstVisit) / 864e5),
        days_since_last_visit: Math.round((Date.now() - this.state.lastVisit) / 864e5),
        visit_frequency_per_week: (this.state.totalVisits / Math.max(1, (Date.now() - this.state.firstVisit) / (864e5 * 7))).toFixed(1),
        rage_click_count: this.behavior.rageClicks, tab_switch_count: this.behavior.tabSwitches,
        focus_time_percent: focPct, hover_hesitation_sec: Math.round(this.behavior.hoverHesitationTime / 1000),
        mouse_velocity_px_sec: msSpd, text_selection_count: this.behavior.selectionCount, text_copied_count: this.behavior.textCopiedCount,
        last_interaction_element: this.behavior.exitElement, // <--- ОТПРАВЛЯЕМ В БАЗУ
        max_scroll_depth_percent: this.behavior.scrollMax, scroll_direction_changes: this.behavior.scrollDirectionChanges, scroll_speed_avg: 0,
        form_start_time_sec: this.behavior.formStarted, fields_filled_count: this.behavior.fieldsFilled.size
      };

      const payload = {
        user_id: this.state.userId,
        sessions_history: this.state.sessions,
        event_name: Array.from(this.state.events).join(", "),
        yandex_metrika: Array.from(this.state.goals).join(", "),
        data: data,
        last_updated: new Date().toISOString()
      };

      this._log("⭐ Sync v7.2", data);
      await this.supabase.from(this.config.tableName).upsert(payload, { onConflict: "user_id" });
      this._synced = true; this.state.hasSynced = true; this._saveState(); this._lastSyncTime = Date.now();
    },

    _determineSource() { const r = document.referrer; if (!r || r.includes(location.hostname)) return 'Direct'; if (/google|yandex|bing/.test(r)) return 'SEO'; return 'Referral' },
    trackEvent(e) { this.state.events.add(e); this._saveState() },
    _initListeners() { document.addEventListener("submit", () => this.trackEvent("form_submit")) },
    _getUTM() { const e = new URLSearchParams(location.search); return { utm_source: e.get("utm_source"), utm_medium: e.get("utm_medium"), utm_campaign: e.get("utm_campaign"), utm_content: e.get("utm_content") } },
    _uuid() { return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, e => { const t = 16 * Math.random() | 0; return ("x" == e ? t : 3 & t | 8).toString(16) }) },
    _log(...e) { this.config.debug && console.log("[TA v7.2]", ...e) }
  };
})();
// ✅ Auto-Sync Verified
