/**
 * Tilda Analytics Script (Advanced)
 * Tracks extensive user behavior and sends data to Supabase.
 */

class TildaAnalytics {
  constructor(config = {}) {
    this.config = {
      sessionTimeout: 300000, // 5 minutes in ms
      supabaseUrl: config.supabaseUrl || '',
      supabaseKey: config.supabaseKey || '',
      tableName: config.tableName || 'user_analytics', // Renamed for clarity
      debug: config.debug || false,
      ...config
    };

    // Initialize state structure mirroring requested JSON
    this.state = {
      sessionId: this.getOrCreateSessionId(),
      userId: this.getOrCreateUserId(),
      startTime: Date.now(),
      lastActivityTime: Date.now(),

      // Counters & Trackers
      eventsCount: 0,
      clicksTotal: 0,
      clicksCta: 0,
      scrollDepth: 0,
      timerFired: false,
      yandexGoalsTriggered: [],

      // Temp navigation handling
      pageHistory: this.getStoredPageHistory()
    };

    // Add current page to history
    this.addToPageHistory();

    this.init();
  }

  init() {
    this.log('Initializing Advanced Tilda Analytics...');
    this.updateStoredVisits(); // Increment visits logic
    this.setupEventListeners();
    this.setupYandexSpy();
    this.startSessionTimer();
    this.trackScroll();
  }

  // --- Yandex Metrica Integration ---

  setupYandexSpy() {
    // Proxy the global ym function to capture reachGoal events
    const originalYm = window.ym;
    const self = this;

    // Define spy
    const ymSpy = function (...args) {
      try {
        // args[0] is usually counterId, args[1] is action
        if (args.length >= 2 && args[1] === 'reachGoal') {
          const goalId = args[2];
          self.log(`Captured Yandex Goal: ${goalId}`);
          self.state.yandexGoalsTriggered.push({
            goal: goalId,
            timestamp: new Date().toISOString(),
            params: args[3] || null
          });
        }
      } catch (e) { console.error('Error in YM spy', e); }

      if (typeof originalYm === 'function') {
        return originalYm.apply(this, args);
      }
    };

    // Preserve properties of original ym (like .a queue)
    if (originalYm) {
      Object.keys(originalYm).forEach(key => ymSpy[key] = originalYm[key]);
    }

    window.ym = ymSpy;
  }

  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  log(message, data) {
    if (this.config.debug) {
      console.log(`[TildaAnalytics] ${message}`, data || '');
    }
  }

  // --- ID & Storage Utils ---

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem('ta_session_id');
    if (!sessionId) {
      sessionId = this.generateUUID();
      sessionStorage.setItem('ta_session_id', sessionId);
      sessionStorage.setItem('ta_session_start', Date.now());
    }
    return sessionId;
  }

  getOrCreateUserId() {
    let userId = localStorage.getItem('ta_user_id');
    if (!userId) {
      userId = this.generateUUID();
      localStorage.setItem('ta_user_id', userId);
    }
    return userId;
  }

  updateStoredVisits() {
    if (!sessionStorage.getItem('ta_visit_counted')) {
      let visits = parseInt(localStorage.getItem('ta_visits_total') || '0');
      let lastVisit = localStorage.getItem('ta_last_visit_ts');

      localStorage.setItem('ta_visits_total', visits + 1);
      localStorage.setItem('ta_last_visit_ts', Date.now());

      // Store for "days since last session" calculation
      if (lastVisit) {
        sessionStorage.setItem('ta_days_since_last', (Date.now() - parseInt(lastVisit)) / (1000 * 60 * 60 * 24));
      } else {
        sessionStorage.setItem('ta_days_since_last', 0);
      }

      sessionStorage.setItem('ta_visit_counted', 'true');
      sessionStorage.setItem('ta_is_returning', visits > 0);
    }
  }



  getStoredPageHistory() {
    try { return JSON.parse(sessionStorage.getItem('ta_page_history') || '[]'); } catch (e) { return []; }
  }

  addToPageHistory() {
    const entry = {
      url: window.location.href,
      timestamp: Date.now(),
      title: document.title
    };
    this.state.pageHistory.push(entry);
    sessionStorage.setItem('ta_page_history', JSON.stringify(this.state.pageHistory));
  }

  // --- Data Collectors ---

  collectAllData() {
    return {
      session: this.collectSessionData(),
      navigation: this.collectNavigationData(),
      events: this.collectEventsData(),
      traffic: this.collectTrafficData(),
      device: this.collectDeviceData(),
      ids: this.collectIdsData(), // New: Explicit IDs including Yandex
      geo: this.collectGeoData(),
      content: this.collectContentData(),
      target_actions: this.collectTargetActionsData()
    };
  }

  collectIdsData() {
    return {
      session_id: this.state.sessionId,
      user_id: this.state.userId,
      yclid: new URLSearchParams(window.location.search).get('yclid') || null,
      ym_uid: this.getCookie('_ym_uid'),
      ga_uid: this.getCookie('_ga'), // Bonus: Google Analytics ID
      fbp: this.getCookie('_fbp')    // Bonus: Facebook Pixel ID
    };
  }

  collectSessionData() {
    const start = parseInt(sessionStorage.getItem('ta_session_start') || this.state.startTime);
    const now = Date.now();
    const duration = Math.floor((now - start) / 1000);

    return [
      this.state.sessionId,                        // session_id
      new Date(start).toISOString(),               // session_start_time
      new Date(now).toISOString(),                 // session_end_time
      duration,                                    // session_duration_seconds
      this.state.pageHistory.length,               // session_page_views
      new Set(this.state.pageHistory.map(p => p.url)).size, // unique_pages_visited
      this.state.eventsCount,                      // session_events_count
      sessionStorage.getItem('ta_is_returning') === 'true', // is_returning_user
      parseFloat(sessionStorage.getItem('ta_days_since_last') || 0), // days_since_last_session

      // Placeholders for advanced historical data usually fetched from server
      null, // sessions_last_7d
      null, // sessions_last_30d

      this.state.pageHistory.length === 1 && duration < 30, // bounce_flag (simple logic)
      null, // exit_page_id (known on server or unload)
      this.state.pageHistory[0]?.url || window.location.href, // entry_page_id
      this.state.pageHistory.length, // session_depth
      this.state.eventsCount / (duration / 60 || 1), // session_activity_rate_events_per_minute

      null, // time_to_first_action
      null, // time_to_first_target_action
      this.state.scrollDepth, // scroll_activity_total (using max depth as proxy)
      null  // scroll_activity_avg
    ];
  }

  collectNavigationData() {
    const path = this.state.pageHistory.map(p => new URL(p.url).pathname);
    return [
      path.join(' > '), // navigation_path
      path.length,      // navigation_path_length
      Math.max(0, path.length - 1), // page_transitions_count
      null, // avg_time_between_page_transitions (needs calculation)
      'html', // first_page_type
      'html', // last_page_type
      0, // returned_to_same_page_count
      false, // navigation_loops_flag
      // Scroll stats
      null, null, null, // avg/max/min scroll depth per page
      null, null, null, // dwell times
      null, // time_on_intent_pages
      0, // intent_pages_count
      null, // navigation_efficiency_score
      null, null, null // reading patterns
    ];
  }

  collectEventsData() {
    return [
      this.state.clicksTotal, // clicks_total
      this.state.clicksCta,   // clicks_cta
      0, // hover_events_total
      0, // hover_time_total
      0, // form_start_count
      0, // form_submit_count
      0, // form_abandon_count
      0, // time_on_forms_total
      0, // video_play_count
      0, // video_watch_seconds
      0, // internal_search_count
      "", // internal_search_terms
      0, // cta_conversion_rate
      null, // element_click_map
      0, // rage_clicks_count
      null, // mouse_move_heatmap_points
      0, // scroll_stops_count
      0, // active_time_seconds
      0  // interaction_density
    ];
  }

  collectTrafficData() {
    const params = new URLSearchParams(window.location.search);
    return [
      params.get('utm_source'),
      params.get('utm_medium'),
      params.get('utm_campaign'),
      params.get('utm_content'),
      params.get('utm_term'),
      params.get('yclid'), // Added Yandex Click ID here as well
      document.referrer,
      document.referrer ? new URL(document.referrer).hostname : null,
      'unknown', // referrer_type
      this.state.pageHistory[0]?.url, // landing_page_id
      'direct', // traffic_channel (needs logic)
      false, // is_paid_traffic
      null, null, null, null, 0, null, null, null, 0
    ];
  }

  collectDeviceData() {
    return [
      navigator.userAgent,
      navigator.appName, // browser_name (imperfect)
      navigator.appVersion,
      navigator.platform, // os_name
      null, // os_version
      this.getDeviceType(),
      `${window.screen.width}x${window.screen.height}`,
      window.innerWidth,
      window.innerHeight,
      this.getDeviceType() === 'mobile',
      this.getDeviceType() === 'tablet',
      this.getDeviceType() === 'desktop',
      navigator.connection ? navigator.connection.effectiveType : 'unknown',
      navigator.hardwareConcurrency || null,
      navigator.deviceMemory || null,
      null, // battery_level
      'ontouchstart' in window || navigator.maxTouchPoints > 0, // touch_support_flag
      null, // device_fingerprint_hash
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.language
    ];
  }

  collectGeoData() {
    return [
      null, // country
      null, // city
      null, // region
      null, // lat
      null, // lon
      null, // accuracy
      null, // asn
      null, // provider
      null, // risk
      new Date().getHours() // user_local_hour
    ];
  }

  collectContentData() {
    // Logic to grab semantic tags or Tilda specific blocks could go here
    return [
      [], 0, [], [], [], 0, 0, 0, 0, 0
    ];
  }

  collectTargetActionsData() {
    return {
      yandex_goals_triggered: this.state.yandexGoalsTriggered,
      // Legacy fields placeholder
      conversion_flag: this.state.yandexGoalsTriggered.length > 0
    };
  }

  getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "tablet";
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle/.test(ua)) return "mobile";
    return "desktop";
  }

  // --- Interaction Tracking ---

  setupEventListeners() {
    // Scroll
    window.addEventListener('scroll', () => this.trackScroll(), { passive: true });

    // Clicks & Interactions
    document.addEventListener('click', (e) => {
      this.state.eventsCount++;
      this.state.clicksTotal++;
      this.state.lastActivityTime = Date.now();

      // Simple heuristic for CTA clicks without explicit goal config
      if (e.target.closest('a, button')) {
        const el = e.target.closest('a, button');
        if (el.className.includes('btn') || el.className.includes('cta') || el.getAttribute('href')?.includes('#order')) {
          this.state.clicksCta++;
        }
      }
    });

    // Mouse Activity
    document.addEventListener('mousemove', () => {
      this.state.lastActivityTime = Date.now();
    });
  }

  trackScroll() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercent = Math.round((scrollTop / docHeight) * 100);

    if (scrollPercent > this.state.scrollDepth) {
      this.state.scrollDepth = scrollPercent;
    }
  }

  // --- Session Timer ---

  startSessionTimer() {
    const elapsed = Date.now() - this.state.startTime;
    const remaining = Math.max(0, this.config.sessionTimeout - elapsed);

    if (sessionStorage.getItem('ta_data_sent') === 'true') return;

    setTimeout(() => this.handleSessionTimeout(), remaining);
  }

  handleSessionTimeout() {
    if (this.state.timerFired) return;
    this.state.timerFired = true;

    const data = this.collectAllData();
    this.log('Session timeout. Sending characteristics...', data);

    this.sendToSupabase(data);
    sessionStorage.setItem('ta_data_sent', 'true');
  }

  // --- Supabase Integration ---

  async loadSupabaseScript() {
    return new Promise((resolve, reject) => {
      if (window.supabase) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.head.appendChild(script);
    });
  }

  async initSupabase() {
    if (this.supabaseClient) return this.supabaseClient;
    try {
      if (!window.supabase) await this.loadSupabaseScript();
      this.supabaseClient = window.supabase.createClient(this.config.supabaseUrl, this.config.supabaseKey);
      return this.supabaseClient;
    } catch (e) { console.error(e); return null; }
  }

  async sendToSupabase(data) {
    const client = await this.initSupabase();
    if (!client) return;

    const payload = {
      session_id: this.state.sessionId,
      user_id: this.state.userId,
      timestamp: new Date().toISOString(),
      analytics_data: data
    };

    const { error } = await client.from(this.config.tableName).insert([payload]);
    if (error) this.log('Error sending:', error);
    else this.log('Data sent!');
  }
}

// Auto-initialize
window.TildaAnalytics = TildaAnalytics;
