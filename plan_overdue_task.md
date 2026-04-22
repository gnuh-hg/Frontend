# PLAN — Hiển thị task quá hạn rõ ràng

> Tạo ngày: 2026-04-23
> Trạng thái: Chưa thực thi
> Mục tiêu: Thêm visual indicator (màu đỏ + badge) lên task card khi due_date đã qua ngày hôm nay — giúp user nhận ra ngay mà không cần mở detail panel.

---

## Bối cảnh

Task card hiện tại luôn hiển thị deadline với màu xám trung tính (`var(--text-secondary)`), không phân biệt task đã quá hạn hay chưa. User phải nhớ hoặc tự kiểm tra ngày để biết task nào cần xử lý gấp.

### Các file liên quan

| File | Vai trò |
|---|---|
| `js/home/container_task.js` | Logic render — thêm helper, sửa buildActiveCardHTML, renderActiveItem, real-time update, lang handler |
| `css/home/container_task.css` | Style — thêm CSS cho overdue card, deadline row, badge |
| `locales/en.json` | i18n — thêm key `home.overdue_badge` |
| `locales/vi.json` | i18n — thêm key `home.overdue_badge` |

### Thông tin code hiện tại cần biết

**`buildActiveCardHTML` (line 412)** — render HTML bên trong mỗi task card active:
```js
function buildActiveCardHTML(item) {
    const progress = item.progress ?? 0;
    return `
        <div class="task-header">
            <div class="task-name">${item.name}</div>
            <button class="btn-done">${t('home.btn_done')}</button>
        </div>
        <div class="task-deadline">${CALENDAR_SVG}<span>${t('home.task_due_prefix')} ${showDate(item.due_date)}</span></div>
        <div class="task-progress${progress === 100 ? ' progress-full' : ''}">
            ...
        </div>`;
}
```

**`renderActiveItem` (line 386)** — tạo DOM element cho task card:
```js
function renderActiveItem(item) {
    hideEmptyState();
    const el = document.createElement('div');
    el.className = `task ${item.priority}`;  // ← cần thêm 'task--overdue' tại đây
    el.dataset.id = item.id;
    el.innerHTML = buildActiveCardHTML(item);
    taskListActive.appendChild(el);
    attachEvents(el, item);
}
```

**`showDate` (line 1798)** — format ISO string → `dd/mm/yyyy`. Đặt helper `isOverdue` ngay cạnh hàm này.

**`taskDatePicker.onConfirm` (khoảng line 1163–1194)** — callback khi user chọn/xóa date trong detail panel. Hiện tại update `activeData.due_date` và text DOM, nhưng chưa sync class overdue.

**`langChanged` handler (khoảng line 1854)** — duyệt `.task` để update text khi đổi ngôn ngữ. Cần thêm cập nhật `.overdue-badge`.

**CSS token:** `var(--accent-danger)` = `#ef4444` (đã định nghĩa trong `:root` của `container_task.css`).

**Mobile:** `.task .task-deadline { display: none }` trong `@media (max-width: 768px)` — cần override riêng cho overdue.

---

## Quy tắc "quá hạn"

- So sánh theo **ngày** (không tính giờ): `due_date` là **hôm nay** → **chưa quá hạn**
- Task `is_completed` → **không bao giờ** có indicator (chỉ active task mới check)
- Task không có `due_date` → **không** overdue

---

## Các bước thực hiện

### Bước 1 — i18n (locales)

Thêm vào namespace `"home"` trong **cả 2 file**, đặt gần key `task_due_prefix` / `date_set`:

**`locales/en.json`:**
```json
"overdue_badge": "Overdue"
```

**`locales/vi.json`:**
```json
"overdue_badge": "Quá hạn"
```

---

### Bước 2 — JS: thêm helper `isOverdue`

Thêm hàm này ngay **trước hoặc sau `showDate`** (line ~1798):

```js
function isOverdue(due_date) {
    if (!due_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(due_date);
    due.setHours(0, 0, 0, 0);
    return due < today;
}
```

---

### Bước 3 — JS: sửa `renderActiveItem` (line 386)

```js
function renderActiveItem(item) {
    hideEmptyState();
    const el = document.createElement('div');
    el.className = `task ${item.priority}${isOverdue(item.due_date) ? ' task--overdue' : ''}`;
    el.dataset.id = item.id;
    el.innerHTML = buildActiveCardHTML(item);
    taskListActive.appendChild(el);
    attachEvents(el, item);
}
```

---

### Bước 4 — JS: sửa `buildActiveCardHTML` (line 412)

```js
function buildActiveCardHTML(item) {
    const progress = item.progress ?? 0;
    const overdue = isOverdue(item.due_date);
    const overdueBadge = overdue
        ? `<span class="overdue-badge">${t('home.overdue_badge')}</span>`
        : '';
    return `
        <div class="task-header">
            <div class="task-name">${item.name}</div>
            <button class="btn-done">${t('home.btn_done')}</button>
        </div>
        <div class="task-deadline${overdue ? ' overdue' : ''}">
            ${CALENDAR_SVG}
            <span>${t('home.task_due_prefix')} ${showDate(item.due_date)}</span>
            ${overdueBadge}
        </div>
        <div class="task-progress${progress === 100 ? ' progress-full' : ''}">
            <div class="progress-bar-container"><div class="progress-bar-fill" style="width: ${progress}%"></div></div>
            <span class="progress-percent">${progress}%</span>
        </div>`;
}
```

---

### Bước 5 — JS: sync real-time khi user thay đổi due_date trong detail panel

Trong `taskDatePicker.onConfirm` (khoảng line 1163–1194), có **2 nhánh**:
- Nhánh set date mới (line ~1166–1174)
- Nhánh clear date (line ~1191–1196)

Sau mỗi lần cập nhật `activeData.due_date` trong **cả 2 nhánh**, thêm đoạn sync:

```js
// Sync overdue state lên task card
const taskEl = document.querySelector(`.task[data-id="${activeData.id}"]`);
if (taskEl) {
    const overdue = isOverdue(activeData.due_date);
    taskEl.classList.toggle('task--overdue', overdue);
    const deadlineDiv = taskEl.querySelector('.task-deadline');
    if (deadlineDiv) {
        deadlineDiv.classList.toggle('overdue', overdue);
        const existingBadge = deadlineDiv.querySelector('.overdue-badge');
        if (overdue && !existingBadge) {
            const badge = document.createElement('span');
            badge.className = 'overdue-badge';
            badge.textContent = t('home.overdue_badge');
            deadlineDiv.appendChild(badge);
        } else if (!overdue && existingBadge) {
            existingBadge.remove();
        }
    }
}
```

---

### Bước 6 — JS: cập nhật `langChanged` handler (khoảng line 1854)

Tìm đoạn `container.querySelectorAll('.task').forEach(taskEl => {`. Bên trong forEach, thêm sau phần cập nhật `deadlineSpan`:

```js
// Cập nhật overdue-badge text
const badge = taskEl.querySelector('.overdue-badge');
if (badge) badge.textContent = t('home.overdue_badge');
```

---

### Bước 7 — CSS: thêm vào cuối `container_task.css`

Thêm vào **cuối file** (sau block `@media (max-width: 480px)` cuối cùng):

```css
/* ==========================================================================
   OVERDUE TASK INDICATOR
   ========================================================================== */

/* Card: border-left đỏ, override priority color */
.task--overdue {
    border-left-color: var(--accent-danger) !important;
    box-shadow: var(--shadow-md), -2px 0 8px rgba(239, 68, 68, 0.2);
}

/* Deadline row: icon + text đỏ */
.task-deadline.overdue {
    color: var(--accent-danger);
}

.task-deadline.overdue span {
    color: var(--accent-danger);
    font-weight: 600;
}

.task-deadline.overdue svg rect,
.task-deadline.overdue svg line {
    stroke: var(--accent-danger);
}

/* Overdue badge pill */
.overdue-badge {
    display: inline-flex;
    align-items: center;
    padding: 1px 6px;
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 10px;
    font-size: 10px;
    font-weight: 700;
    color: var(--accent-danger);
    text-transform: uppercase;
    letter-spacing: 0.3px;
    flex-shrink: 0;
    margin-left: 2px;
}

/* Mobile: .task-deadline bị ẩn (display:none) nhưng khi overdue cần hiện badge.
   Chỉ show badge, ẩn icon + text date để tiết kiệm không gian. */
@media (max-width: 768px) {
    .task--overdue .task-deadline {
        display: flex;
    }

    .task--overdue .task-deadline svg,
    .task--overdue .task-deadline span {
        display: none;
    }

    .task--overdue .task-deadline .overdue-badge {
        display: inline-flex;
    }
}
```

**Lưu ý `!important`:** Selector `.task.high`, `.task.medium`, `.task.low` có specificity ngang `.task--overdue` — cần `!important` để màu đỏ override priority color ở `border-left`.

---

## Thứ tự thực hiện

1. `locales/en.json` + `locales/vi.json` (không dependency)
2. `js/home/container_task.js` — theo thứ tự:
   - Thêm `isOverdue` helper (cạnh `showDate`)
   - Sửa `renderActiveItem`
   - Sửa `buildActiveCardHTML`
   - Thêm real-time sync trong `taskDatePicker.onConfirm`
   - Thêm badge update trong `langChanged` handler
3. `css/home/container_task.css` — thêm block CSS cuối file

---

## Checklist verify

| # | Test case | Kết quả |
|---|---|---|
| 1 | Task `due_date` = hôm qua → badge + text đỏ xuất hiện | ☐ |
| 2 | Task `due_date` = hôm nay → không có indicator | ☐ |
| 3 | Task `due_date` = ngày mai → không có indicator | ☐ |
| 4 | Task không có `due_date` → không có indicator | ☐ |
| 5 | Task `is_completed` với `due_date` quá hạn → không có indicator | ☐ |
| 6 | Đổi due_date trong detail panel sang ngày quá hạn → card cập nhật realtime | ☐ |
| 7 | Đổi due_date sang ngày tương lai → badge biến mất realtime | ☐ |
| 8 | Clear due_date → badge biến mất realtime | ☐ |
| 9 | Mobile: badge `Quá hạn` hiện, icon + text date ẩn | ☐ |
| 10 | Đổi ngôn ngữ EN↔VI → badge text cập nhật | ☐ |
