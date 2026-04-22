# Backend Spec — Challenge 2: is_completed + difficulty_rating

> Ngày tạo: 2026-04-22
> Mục tiêu: Mô tả những thay đổi backend cần thiết để hỗ trợ tính năng tách task done/chưa done và đánh giá độ khó.

---

## 1. Thay đổi data model (Task)

Thêm 2 field vào bảng/collection task:

| Field | Type | Default | Nullable | Mô tả |
|-------|------|---------|----------|-------|
| `is_completed` | boolean | `false` | No | Task đã hoàn thành hay chưa |
| `difficulty_rating` | integer (1–5) | `null` | Yes | Đánh giá độ khó sau khi done (hoặc trước) |

---

## 2. Thay đổi endpoint hiện có

### 2.1 `DELETE /project/:id/items/:taskId/done` — **Bỏ hoặc deprecated**

**Hiện tại:** Xóa task khỏi DB khi bấm Done.

**Thay đổi:** Frontend **không còn gọi endpoint này nữa**. Thay vào đó dùng `PATCH` bên dưới.

> Có thể giữ endpoint để backward compatible (nếu cần), nhưng frontend sẽ không dùng.

---

### 2.2 `PATCH /project/:id/items/:taskId` — **Mở rộng**

**Hiện tại:** Hỗ trợ các field: `name`, `priority`, `start_date`, `due_date`, `notes`, `process`.

**Bổ sung thêm:**

| Field trong body | Type | Mô tả |
|-----------------|------|-------|
| `is_completed` | boolean | Đánh dấu hoàn thành / khôi phục |
| `difficulty_rating` | integer 1–5 hoặc `null` | Ghi nhận độ khó |

**Request example — Mark Done:**
```json
PATCH /project/42/items/101
{ "is_completed": true }
```

**Request example — Restore:**
```json
PATCH /project/42/items/101
{ "is_completed": false }
```

**Request example — Set difficulty:**
```json
PATCH /project/42/items/101
{ "difficulty_rating": 3 }
```

**Request example — Done + difficulty cùng lúc (từ cross-drag):**
```json
PATCH /project/42/items/101
{ "is_completed": true, "difficulty_rating": null }
```

**Response:** `200 OK` với object task đã update (hoặc chỉ `{ ok: true }`).

**Validation:**
- `difficulty_rating`: nếu có thì phải là integer từ 1–5, hoặc `null`.
- `is_completed`: boolean.

---

### 2.3 `GET /project/:id/items` — **Mở rộng response**

Mỗi item trong response array phải trả về 2 field mới:

```json
{
  "id": 101,
  "name": "Design mockup",
  "priority": "high",
  "progress": 80,
  "is_completed": false,
  "difficulty_rating": null,
  "start_date": "...",
  "due_date": "...",
  "time_spent": 3600,
  "notes": "",
  "position": 1
}
```

> **Quan trọng:** Frontend dùng `is_completed` để route task vào đúng khu vực (active / completed). Nếu field thiếu → frontend coi là `false`.

---

### 2.4 `POST /project/:id/items` — **Mở rộng**

Khi tạo task mới, body có thể kèm (optional):

| Field | Default nếu thiếu |
|-------|--------------------|
| `is_completed` | `false` |
| `difficulty_rating` | `null` |

Response trả về task đầy đủ gồm cả 2 field mới.

---

### 2.5 `PATCH /project/:id/items/reorder` — **Không thay đổi logic, nhưng cần lưu ý**

Frontend sẽ gọi endpoint này riêng biệt cho từng khu vực (active và completed), với positions độc lập nhau.

**Behavior hiện tại giữ nguyên:** nhận array `[{ id, position }]` và cập nhật position.

> Frontend **không trộn** position của task active và completed vào 1 request. Hai khu vực có position sequence riêng.

**Backend** nên xử lý được cả 2 trường hợp (task active và completed) trong cùng 1 endpoint — không cần tách.

---

## 3. Không thay đổi

- `POST /auth/*`, `GET /folders`, `POST /projects`... — không ảnh hưởng.
- Logic `position` — vẫn là integer, tăng dần trong từng nhóm.
- Authentication / authorization — không thay đổi.
- `GET /statistic/*` — nếu thống kê tính `is_completed=true` là "done", cần kiểm tra lại logic statistic (ngoài scope hiện tại, cần confirm riêng).

---

## 4. Migration

- Các task cũ trong DB chưa có `is_completed`: set default `false`.
- Các task cũ chưa có `difficulty_rating`: set default `null`.
- Không cần migrate data từ endpoint Done cũ (task bị xóa bởi Done cũ sẽ không còn trong DB).

---

## 5. Tóm tắt nhanh cho developer backend

```
1. ALTER TABLE tasks ADD COLUMN is_completed BOOLEAN DEFAULT FALSE;
2. ALTER TABLE tasks ADD COLUMN difficulty_rating SMALLINT NULL CHECK (difficulty_rating BETWEEN 1 AND 5);
3. PATCH /project/:id/items/:taskId → nhận thêm is_completed, difficulty_rating
4. GET /project/:id/items → trả về is_completed, difficulty_rating trong mỗi item
5. POST /project/:id/items → nhận is_completed (default false), difficulty_rating (default null)
6. DELETE /project/:id/items/:taskId/done → deprecated (frontend không gọi nữa)
```
