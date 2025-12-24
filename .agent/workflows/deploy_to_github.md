---
description: Automatically deploy changes to GitHub
---

// turbo-all

1. Добавляем все изменения в индекс
   git add .

2. Коммитим изменения (сообщение по умолчанию, если не указано иное - можно менять в процессе, но для автопилота оставим общее)
   git commit -m "Auto-update via Agent"

3. Отправляем на GitHub
   git push
