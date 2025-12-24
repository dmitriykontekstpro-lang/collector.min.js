# Решение: Синхронизация Оффлайн-конверсий (CRM -> Supabase)

Поскольку JS-скрипт работает только когда пользователь **онлайн**, для записи событий, происходящих через несколько дней (в CRM), нам нужен **Backend-процесс**.

Идеальное решение в вашей архитектуре — **Supabase Edge Function**. Это серверная функция, которая имеет доступ к вашей базе и может быть вызвана через простой URL (Webhook) из вашей CRM (Bitrix24, AmoCRM) или интегратора (Make/Zapier).

## Архитектура

1.  **Сбор (уже реализовано)**:
    *   Скрипт `tilda-analytics.js` собирает `session_id` и `ym_uid`.
    *   **ВАЖНО**: При отправке формы на сайте вы должны передавать этот `session_id` или `ym_uid` в CRM (через скрытое поле).

2.  **Событие в CRM**:
    *   Менеджер закрывает сделку -> CRM шлет Webhook.

3.  **Обработка (Supabase Edge Function)**:
    *   Функция получает данные.
    *   Находит запись в таблице `user_analytics` по ID.
    *   Обновляет JSON, добавляя новую цель в список.

## Код Supabase Edge Function

Создайте функцию `crm-conversion-hook`.

```typescript
// supabase/functions/crm-conversion-hook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // 1. Получаем данные от CRM
    const { session_id, ym_uid, goal_name, goal_value } = await req.json()

    if (!session_id && !ym_uid) {
      return new Response('Missing session_id or ym_uid', { status: 400 })
    }

    // 2. Инициализируем Supabase Admin (нужен SERVICE_ROLE_KEY для записи)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Ищем сессию пользователя
    // Если есть session_id - ищем по нему. Если нет - берем ПОСЛЕДНЮЮ сессию по ym_uid
    let query = supabaseAdmin
      .from('user_analytics')
      .select('*')
      
    if (session_id) {
        query = query.eq('session_id', session_id)
    } else {
        // Поиск последней сессии этого пользователя, где analytics_data->ids->>ym_uid совпадает
        // Примечание: JSONB поиск может быть медленным без индекса, лучше сохранять ym_uid в отдельную колонку если база большая
        // Для примера используем простой фильтр, но в идеале лучше передавать session_id из CRM
        query = query.contains('analytics_data', { ids: { ym_uid: ym_uid } })
                     .order('timestamp', { ascending: false })
                     .limit(1)
    }

    const { data: sessions, error: searchError } = await query
    
    if (searchError || !sessions || sessions.length === 0) {
      return new Response('Session not found', { status: 404 })
    }

    const sessionRow = sessions[0]
    const analyticsData = sessionRow.analytics_data

    // 4. Добавляем новую цель в JSON
    const newGoal = {
        goal: goal_name || 'crm_conversion',
        timestamp: new Date().toISOString(),
        value: goal_value || 0,
        source: 'crm_offline'
    }

    // Проверяем, есть ли уже массив triggering, если нет - создаем
    if (!analyticsData.target_actions) analyticsData.target_actions = {}
    if (!analyticsData.target_actions.yandex_goals_triggered) analyticsData.target_actions.yandex_goals_triggered = []
    
    analyticsData.target_actions.yandex_goals_triggered.push(newGoal)
    // Также обновляем флаги конверсии
    analyticsData.target_actions.conversion_flag = true

    // 5. Записываем обновленный JSON обратно в базу
    const { error: updateError } = await supabaseAdmin
      .from('user_analytics')
      .update({ analytics_data: analyticsData })
      .eq('id', sessionRow.id)

    if (updateError) throw updateError

    return new Response(JSON.stringify({ success: true, updated_session: sessionRow.id }), {
      headers: { "Content-Type": "application/json" },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
```

## Как настроить (Инструкция)

### Шаг 1: Подготовка Tilda
Добавьте скрытое поле в форму на сайте.
1. Добавьте поле `Input` -> Type: `Hidden field`.
2. Variable name: `session_id`.
3. Добавьте JS код, чтобы заполнить это поле значением из нашего скрипта:
```javascript
setTimeout(function() {
   const sessionId = sessionStorage.getItem('ta_session_id');
   if(sessionId) {
       // Или используем jQuery если это Tilda Zero Block
       $('input[name="session_id"]').val(sessionId);
   }
}, 2000);
```

### Шаг 2: Создать Edge Function
1. Установите Supabase CLI.
2. `supabase functions new crm-conversion-hook`.
3. Вставьте код выше.
4. `supabase functions deploy crm-conversion-hook`.

### Шаг 3: Настройка CRM (Webhook)
Настройте автоматизацию в CRM (например, "При смене статуса на 'Оплачено'"):
*   **URL**: `https://<PROJECT_REF>.supabase.co/functions/v1/crm-conversion-hook`
*   **Method**: `POST`
*   **Body (JSON)**:
    ```json
    {
      "session_id": "{{Lead.session_id}}",  // Поле, которое мы передали с Тильды
      "goal_name": "payment_success",
      "goal_value": 5000
    }
    ```

Теперь, когда CRM дернет эту ссылку, данные в базе `user_analytics` обновятся, и там появится запись о достижении цели.
