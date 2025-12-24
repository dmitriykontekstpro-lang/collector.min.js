# 💎 Tilda Analytics v4.0: User Profiles
Система переведена в режим "Профиля пользователя": одна строка на одного клиента со всей историей.

---

## 💾 ШАГ 1: Обновите базу данных (Supabase)

Нужно создать таблицу `user_profiles`.

```sql
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,
  sessions_history JSONB DEFAULT '{}'::jsonb,
  events_triggered TEXT,
  yandex_goals TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_updated ON user_profiles(last_updated DESC);
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anon upsert" ON user_profiles FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon update" ON user_profiles FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon read" ON user_profiles FOR SELECT TO anon USING (true);
```

---

## 📝 ШАГ 2: Вставьте код в Tilda

**Важно:** Удалите старый код и вставьте этот. Он содержит всю логику фильтрации (10 сек) и агрегации.

```html
<!-- Библиотека Supabase -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<script>
(function(){'use strict';
/* TildaAnalytics v4.0 - User Profile Mode */
window.TildaAnalytics={config:null,supabase:null,state:{userId:null,currentSessionId:null,sessions:{},events:new Set,goals:new Set,lastActivity:Date.now(),isNewUser:!1},_synced:!1,_syncTimer:null,_tickTimer:null,
async init(e){this.config={supabaseUrl:"",supabaseKey:"",tableName:"user_profiles",minSessionDuration:10,sessionTimeout:12e5,syncInterval:1e4,debug:!1,yandexMetrikaId:null,...e},
"undefined"!=typeof supabase&&(this.supabase=supabase.createClient(this.config.supabaseUrl,this.config.supabaseKey),this._loadState(),this._checkSessionTimeout(),this._initTick(),this._initListeners(),
this.config.yandexMetrikaId&&this._initYandexMetrika(),this._log("🚀 Init v4"),this.trackEvent("page_view"))},
_loadState(){let e=localStorage.getItem("ta_uid");e||(e=this._uuid(),localStorage.setItem("ta_uid",e),this.state.isNewUser=!0),this.state.userId=e;try{const t=JSON.parse(localStorage.getItem("ta_store")||"{}");
this.state.sessions=t.sessions||{},this.state.events=new Set(t.events||[]),this.state.goals=new Set(t.goals||[]),this.state.lastActivity=t.lastActivity||Date.now(),this.state.currentSessionId=t.currentSessionId||null}catch(e){console.error(e)}},
_saveState(){localStorage.setItem("ta_store",JSON.stringify({sessions:this.state.sessions,events:Array.from(this.state.events),goals:Array.from(this.state.goals),lastActivity:this.state.lastActivity,currentSessionId:this.state.currentSessionId}))},
_checkSessionTimeout(){const e=Date.now();(!this.state.currentSessionId||e-this.state.lastActivity>this.config.sessionTimeout)&&(this.state.currentSessionId=this._uuid(),this.state.sessions[this.state.currentSessionId]=0,
this._log("🆕 New Session:",this.state.currentSessionId)),this.state.lastActivity=e,this._saveState()},
_initTick(){this._tickTimer=setInterval((()=>{if(document.hidden)return;const e=this.state.currentSessionId;e&&(this.state.sessions[e]=(this.state.sessions[e]||0)+1,this.state.lastActivity=Date.now(),this._saveState(),this._trySync())}),1e3)},
async _trySync(){const e=this.state.currentSessionId,t=this.state.sessions[e]||0,s=t<this.config.minSessionDuration,i=Object.keys(this.state.sessions).length>1;
if((!this.state.isNewUser||i||!s)&&(!this._synced||!(Date.now()-this._lastSyncTime<this.config.syncInterval)))await this._syncToSupabase()},
async _syncToSupabase(){const e=Object.values(this.state.sessions).reduce(((e,t)=>e+t),0),t=Object.keys(this.state.sessions).length,s={ua:navigator.userAgent,screen:`${window.screen.width}x${window.screen.height}`,
is_mobile:/Mobile|Android|iPhone/i.test(navigator.userAgent),language:navigator.language,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,referrer:document.referrer||null,entry_url:window.location.href,page_title:document.title,
total_time_sec:e,total_sessions_count:t,...this._getUTM()},i=Array.from(this.state.events).join(", "),n=Array.from(this.state.goals).join(", "),
a={user_id:this.state.userId,sessions_history:this.state.sessions,events_triggered:i,yandex_goals:n,data:s,last_updated:(new Date).toISOString()};
this._log("⬆️ Sync",a);const{error:r}=await this.supabase.from(this.config.tableName).upsert(a,{onConflict:"user_id"});r?console.error("Sync fail",r):(this._synced=!0,this._lastSyncTime=Date.now())},
trackEvent(e){this.state.events.add(e),this._saveState()},trackGoal(e,t){this.state.goals.add(e),this.trackEvent("yandex_goal"),this._saveState(),this._log("b5 Goal",e)},
_initListeners(){document.addEventListener("click",(e=>{e.target.closest('a, button, .t-btn, [role="button"]')&&this.trackEvent("click")}),!0),document.addEventListener("submit",(()=>this.trackEvent("form_submit")))},
_initYandexMetrika(){const e=window.ym;if(e){window.ym=(...t)=>{ "reachGoal"===t[1]&&this.trackGoal(t[2],t[3]),e(...t)}}},
_getUTM(){const e=new URLSearchParams(window.location.search);return{utm_source:e.get("utm_source"),utm_medium:e.get("utm_medium"),utm_campaign:e.get("utm_campaign"),utm_content:e.get("utm_content")}},
_uuid(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,(e=>{const t=16*Math.random()|0;return("x"==e?t:3&t|8).toString(16)})),_log(...e){this.config.debug&&console.log("[TA v4]",...e)}}})();
</script>

<script>
document.addEventListener('DOMContentLoaded', function() {
    TildaAnalytics.init({
        supabaseUrl: 'https://qqfyjrugrinmdijpsutj.supabase.co',
        supabaseKey: 'sb_publishable_KzDns19CaSpI-40YZgPPCg_hCDb-1Iz',
        yandexMetrikaId: 51854510,
        debug: true
    });
});
</script>
```

---

## ✅ Как это работает теперь

1.  **Посетитель зашел (0 сек):** Данные сохраняются только в браузере (LocalStorage).
2.  **Прошло 9 секунд:** Ничего не уходит в базу.
3.  **Прошло 11 секунд:** Скрипт видит, что сессия > 10 сек, и отправляет данные в Supabase.
    *   Создается строка с `user_id`.
    *   Записывается `sessions_history: {"session-uuid": 11}`.
4.  **Посетитель ушел и вернулся через час:**
    *   Создается новый `session_id`.
    *   Счетчики продолжают расти.
    *   В базе обновляется та же самая строчка `user_id`.
    *   `sessions_history` становится: `{"old-session": 100, "new-session": 20}`.
    *   `total_time_sec` увеличивается.

Это идеальная схема для отслеживания "качества" аудитории.
