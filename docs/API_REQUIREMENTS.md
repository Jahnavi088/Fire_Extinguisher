# API Requirements Document
## SOS Emergency Safety Platform — Frontend ↔ Backend Contract

**Base URL:** `https://ehs.garrev.com/app1/v1`  
**Auth:** All endpoints except `/auth/login` require `Authorization: Bearer {token}` header  
**Content-Type:** `application/json` for all requests except logo upload (multipart/form-data)

---

## TABLE OF CONTENTS
1. [Authentication](#1-authentication)
2. [Company Management](#2-company-management)
3. [User Management](#3-user-management)
4. [Module & Equipment Access](#4-module--equipment-access)
5. [Equipment (Assets)](#5-equipment-assets)
6. [Modules (Safety Types)](#6-modules-safety-types)
7. [Checklists](#7-checklists)
8. [Alerts](#8-alerts)
9. [Reports](#9-reports)
10. [Missing / Broken APIs](#10-missing--broken-apis)
11. [Response Shape Problems](#11-response-shape-problems)

---

## 1. Authentication

### POST `/auth/login`
**Request Body:**
```json
{
  "username": "admin",
  "password": "password123"
}
```
**Expected Response:**
```json
{
  "token": "eyJhbGciOi...",
  "user": {
    "id": 1,
    "name": "Admin User",
    "username": "admin",
    "role": "admin",
    "company_id": 5
  }
}
```
> ⚠️ **ISSUE:** If `user` object is missing from response, the UI constructs a fake one using only the `username` string — `id` will be **undefined**, which breaks localStorage-based nav permissions.  
> **Required:** Always return `user` object with at least `id`, `name`, `role`.

---

### GET `/auth/me`
**Request:** No body. Bearer token in header.

**Expected Response:**
```json
{
  "id": 1,
  "name": "Admin User",
  "username": "admin",
  "role": "admin",
  "company_id": 5,
  "status": "active"
}
```
> ⚠️ **ISSUE:** If the response wraps user in a `user` field (`{ "user": {...} }`), the app uses the entire response as the user object. Pick **one** format and stick to it.

---

### POST `/auth/logout`
**Request:** No body.  
**Expected Response:**
```json
{ "success": true }
```

---

## 2. Company Management

### GET `/admin/companies`
**Request:** No body.

**Expected Response:**
```json
[
  {
    "id": 1,
    "name": "Continental Hospitals",
    "company_ref": "CH-001",
    "email": "admin@continental.com",
    "address": "Hyderabad, Telangana",
    "phone": "9876543210",
    "logo": "https://ehs.garrev.com/uploads/logos/ch001.png"
  }
]
```
> ⚠️ **ISSUE 1:** The UI tries `company_ref || company_id || companyId` to find the company reference ID. Pick **one field name**: recommend `company_ref`.  
> ⚠️ **ISSUE 2:** The `logo` field must be a **full URL** (starting with `https://`). If it is a relative path like `/uploads/logos/...`, the image will not display on the frontend (it tries to load from `localhost:5173`).  
> ⚠️ **ISSUE 3:** Response must be a **direct array**, not wrapped in `{ "data": [...] }` or `{ "companies": [...] }` — or the frontend must handle all variants (it currently tries all three).

---

### POST `/admin/companies`
**Request Body:**
```json
{
  "name": "Continental Hospitals",
  "company_ref": "CH-001",
  "email": "admin@continental.com",
  "address": "Hyderabad, Telangana",
  "phone": "9876543210"
}
```
**Expected Response:**
```json
{
  "id": 1,
  "name": "Continental Hospitals",
  "company_ref": "CH-001",
  "email": "admin@continental.com",
  "address": "Hyderabad, Telangana",
  "phone": "9876543210",
  "logo": null
}
```
> ⚠️ **ISSUE:** If `id` is nested inside a `data` object (`{ "data": { "id": 1 } }`), the logo upload step immediately after will fail because the UI does `company?.data?.id || company?.id` — but if neither exists the `companyId` is `undefined` and the logo is never uploaded.  
> **Required:** Return `id` at the **top level** of the response.

---

### PATCH `/admin/companies/{id}`
**Request Body:** (only send fields that changed)
```json
{
  "name": "Continental Hospitals Updated",
  "email": "new@continental.com",
  "address": "New Address",
  "phone": "9999999999"
}
```
> ⚠️ **ISSUE:** If `company_ref` is included in the PATCH body when it hasn't changed, the server returns **500** because the uniqueness check doesn't exclude the current record.  
> **Required:** The server's uniqueness check for `company_ref` and `name` must **exclude the record being updated** (i.e., `WHERE id != :id`).  
> *(Frontend now only sends `company_ref`/`name` when they change — but the server-side fix is still needed.)*

**Expected Response:**
```json
{
  "id": 1,
  "name": "Continental Hospitals Updated",
  "company_ref": "CH-001",
  "email": "new@continental.com",
  "address": "New Address",
  "phone": "9999999999",
  "logo": "https://ehs.garrev.com/uploads/logos/ch001.png"
}
```

---

### POST `/admin/companies/{id}/logo`
**Request:** `multipart/form-data` with field name `logo` (image file).  
**Expected Response:**
```json
{
  "logo": "https://ehs.garrev.com/uploads/logos/ch001.png"
}
```
> ⚠️ **ISSUE:** `logo` URL in the response and in subsequent `GET /admin/companies` must be a **full absolute URL** (e.g., `https://ehs.garrev.com/uploads/logos/...`). A relative path like `/uploads/logos/...` will not load in the browser.

---

### DELETE `/admin/companies/{id}`
**Request:** No body.  
**Expected Response:**
```json
{ "success": true }
```

---

## 3. User Management

### GET `/admin/users`
**Request:** No body.

**Expected Response:**
```json
[
  {
    "id": 1,
    "name": "John Inspector",
    "username": "john",
    "email": "john@continental.com",
    "role": "inspector",
    "status": "active",
    "company_id": 1
  }
]
```
> ⚠️ **ISSUE:** Response must be a direct array. If wrapped, the UI falls back to `data.users || data.data || []`.  
> **Valid role values:** `superadmin`, `admin`, `inspector`, `user`  
> **Valid status values:** `active`, `inactive`

---

### POST `/admin/users`
**Request Body:**
```json
{
  "name": "John Inspector",
  "username": "john",
  "email": "john@continental.com",
  "password": "securepass123",
  "role": "inspector",
  "status": "active",
  "company_id": 1
}
```
**Expected Response:**
```json
{
  "id": 2,
  "name": "John Inspector",
  "username": "john",
  "email": "john@continental.com",
  "role": "inspector",
  "status": "active",
  "company_id": 1
}
```

---

### PATCH `/admin/users/{id}`
**Request Body:** (only changed fields)
```json
{
  "name": "John Inspector Updated",
  "email": "updated@continental.com",
  "role": "admin",
  "status": "active",
  "company_id": 2,
  "password": "newpassword"
}
```
> Note: `username` is never sent in update — it is not editable.  
> Note: `password` is only included when the admin explicitly sets a new one.

**Expected Response:** Updated user object (same shape as GET).

---

### GET `/admin/users/{id}/modules`
**Purpose:** Get all equipment modules assigned to this user.  
**Request:** No body.

**Expected Response:**
```json
[
  {
    "id": 101,
    "module_id": 30,
    "name": "Fire Extinguisher",
    "code": "fire_extinguisher",
    "access_level": "admin",
    "assigned_at": "2024-01-15T10:30:00Z"
  }
]
```
> ⚠️ **ISSUE:** The UI reads `m.id || m.module_id` for the assignment ID (used in DELETE). It reads `m.code || m.module_code` for the code. It reads `m.name || m.module_name` for display.  
> **Required:** Always include `id` (the assignment record ID), `module_id`, `name`, `code`, `access_level`.

---

### POST `/admin/users/{id}/modules`
**Purpose:** Assign equipment module access to user.  
**Request Body:**
```json
{
  "module_ids": [30]
}
```
**Expected Response:**
```json
{
  "id": 101,
  "user_id": 1,
  "module_id": 30,
  "access_level": "admin",
  "assigned_at": "2024-01-15T10:30:00Z"
}
```

---

### DELETE `/admin/users/{userId}/modules/{moduleId}`
**Purpose:** Remove a module assignment from a user.  
> ⚠️ `moduleId` here is the **assignment record `id`** (from `GET /admin/users/:id/modules` response field `id`), NOT the `module_id`.  
> Make sure the DELETE endpoint accepts the assignment record ID.

**Expected Response:**
```json
{ "success": true }
```

---

## 4. Module & Equipment Access

### GET `/admin/modules-list`
**Purpose:** Get the complete list of available equipment modules (used to populate the "Assign Equipment" dropdown).  
**Request:** No body.

**Expected Response:**
```json
[
  {
    "module_id": 30,
    "id": 30,
    "name": "Fire Extinguisher",
    "code": "fire_extinguisher",
    "category": "fire",
    "image": "/images/fire_extinguisher.png"
  },
  {
    "module_id": 2,
    "id": 2,
    "name": "Hose Reel",
    "code": "hose_reel",
    "category": "fire",
    "image": "/images/hose_reel.png"
  }
]
```
> ⚠️ **ISSUE:** The Equipment Access page currently uses a **hardcoded static list** of 29 modules from the frontend code (`STATIC_MODULES` array in `SafetyDashboard.jsx`). This endpoint exists in the API but is **never called** by the Equipment Access page.  
> **Required:** This endpoint must return all available modules so the dropdown shows live data.

---

## 5. Equipment (Assets)

### GET `/equipment`
**Request Parameters (query string):**
| Param | Type | Required | Example | Description |
|-------|------|----------|---------|-------------|
| `module_id` | integer | No | `30` | Filter by equipment type |
| `status` | string | No | `active` | Filter by status |
| `limit` | integer | No | `200` | Max records to return |

**Expected Response:**
```json
{
  "items": [
    {
      "id": "FE-CH-001",
      "sos_code": "FE-CH-001",
      "equipment_code": "FE-001",
      "extinguisher_type": "CO2 - 4.5 KG",
      "location_name": "Ground Floor - Lobby",
      "building_name": "Main Block",
      "building_dept": "Admin Department",
      "department_name": "Administration",
      "readiness_score": 95.5,
      "operational_status": "operational",
      "status": "active",
      "next_inspection_due": "2024-06-01"
    }
  ],
  "total": 42
}
```
> ⚠️ **ISSUE:** Equipment ID is referenced as both `sos_code` and `id` in different places. The UI does `item.sos_code || item.id` everywhere.  
> **Required:** Always return both fields — `id` (numeric/string primary key) and `sos_code` (the scannable code).

---

### GET `/equipment/{sosCode}`
**Expected Response:**
```json
{
  "id": "FE-CH-001",
  "sos_code": "FE-CH-001",
  "equipment_code": "FE-001",
  "extinguisher_type": "CO2 - 4.5 KG",
  "location_name": "Ground Floor - Lobby",
  "building_name": "Main Block",
  "floor_name": "Ground Floor",
  "zone_name": "Zone A",
  "department_name": "Administration",
  "manufacturer_name": "Safeguard Industries",
  "serial_number": "SG-2022-001",
  "barcode": "123456789",
  "capacity_kg": 4.5,
  "capacity_text": "4.5 KG",
  "installed_on": "2022-01-15",
  "last_service_on": "2023-12-01",
  "expiry_date": "2025-01-15",
  "serviced_by": "ABC Fire Services",
  "pressure_status": "OK",
  "hose_status": "Good",
  "pin_seal_status": "Intact",
  "body_status": "No Damage",
  "status_bucket": "active",
  "status": "active",
  "readiness_score": 95.5,
  "operational_status": "operational",
  "next_inspection_due": "2024-06-01",
  "remarks": ""
}
```

---

### POST `/equipment/{sosCode}/inspections`
**Purpose:** Submit a checklist inspection.

**Request Body:**
```json
{
  "inspector_name": "John Inspector",
  "remarks": "All items checked and in order.",
  "answers": [
    {
      "checklist_item_id": 1,
      "answer": "true",
      "remarks": ""
    },
    {
      "checklist_item_id": 2,
      "answer": "false",
      "remarks": "Pressure gauge reading low"
    },
    {
      "checklist_item_id": 3,
      "answer": "na",
      "remarks": ""
    }
  ],
  "signature": {
    "meaning": "Inspected and verified",
    "device_id": 1
  }
}
```
> ⚠️ `answer` values are **strings**: `"true"`, `"false"`, `"na"` — not booleans.

**Expected Response:**
```json
{
  "id": 501,
  "sos_code": "FE-CH-001",
  "inspector_name": "John Inspector",
  "created_at": "2024-01-15T14:30:00Z",
  "status": "completed"
}
```

---

## 6. Modules (Safety Types)

### GET `/modules/{id}/summary`
**Expected Response:**
```json
{
  "module_id": 30,
  "name": "Fire Extinguisher",
  "total": 120,
  "total_units": 120,
  "active": 95,
  "expired": 8,
  "needs_service": 5,
  "due_inspection": 12,
  "upcoming": 10,
  "readiness_score": 88.5,
  "health_score": 88.5,
  "score": 88.5
}
```
> ⚠️ **ISSUE:** The UI reads `readiness_score || health_score || score` (all three). Standardize to **one field name** — recommend `readiness_score`.

---

### GET `/modules/{id}/checklists`
**Expected Response:**
```json
[
  {
    "id": 1,
    "question": "Is the extinguisher in its designated location?",
    "item_text": "Is the extinguisher in its designated location?",
    "category": "Accessibility",
    "is_critical": true
  }
]
```
> ⚠️ **ISSUE:** UI reads `item.question || item.item_text || item.checklist_name || item.name` — 4 fallback field names.  
> **Required:** Standardize to `question` as the field name for checklist item text.

---

## 7. Checklists (Admin Configuration)

### GET `/admin/checklists`
**Expected Response:**
```json
[
  {
    "type": "fire_extinguisher",
    "code": "fire_extinguisher",
    "name": "Fire Extinguisher Checklist",
    "item_count": 15
  }
]
```
> ⚠️ **ISSUE:** UI normalizes as `Array.isArray(res) ? res : (res?.data || res?.types || res?.checklists || [])`.  
> **Required:** Return a direct array.

---

### GET `/admin/checklists/{type}`
**Expected Response:**
```json
[
  {
    "id": 1,
    "question": "Is the extinguisher charged?",
    "category": "Mechanical",
    "is_critical": true,
    "item_order": 1
  }
]
```

---

### POST `/admin/checklists/{type}/items`
**Request Body:**
```json
{
  "question": "Is the safety pin intact?",
  "category": "Mechanical",
  "is_critical": false
}
```
**Expected Response:** Created item object with `id`.

---

### PATCH `/admin/checklists/items/{id}`
**Request Body:** Same fields as POST, any subset.  
**Expected Response:** Updated item object.

---

### DELETE `/admin/checklists/items/{id}`
**Expected Response:** `{ "success": true }`

---

## 8. Alerts

### GET `/alerts`
**Request Parameters:**
| Param | Type | Example | Description |
|-------|------|---------|-------------|
| `module_id` | integer | `30` | Filter by module |
| `limit` | integer | `100` | Max results |
| `level` | string | `critical` | Filter by level |

**Expected Response:**
```json
{
  "alerts": [
    {
      "id": 201,
      "sos_code": "FE-CH-001",
      "barcode": "FE-CH-001",
      "alert_level": 1,
      "alert_label": "Expired",
      "alert_reason": "expiry_date_passed",
      "location_name": "Ground Floor - Lobby",
      "building_name": "Main Block",
      "extinguisher_type": "CO2 - 4.5 KG",
      "days_overdue": 15
    }
  ],
  "total": 42
}
```
> ⚠️ **ISSUE (CRITICAL — FIXED IN FRONTEND):** Previously, if the API returned a **bare array** `[{...}, {...}]` instead of `{ "alerts": [...] }`, all 30+ equipment stat pages showed **zero alerts** because `alertsData.alerts` was `undefined`.  
> **Required:** Always return the response wrapped as `{ "alerts": [...] }`.  
> *(Frontend now normalizes this, but the API should still return the correct shape.)*

---

### GET `/alerts/summary`
**Expected Response:**
```json
{
  "total_alerts": 42,
  "level_1": { "count": 20, "label": "Critical", "description": "Immediate action required" },
  "level_2": { "count": 15, "label": "Warning", "description": "Action required within 7 days" },
  "level_3": { "count": 7, "label": "Info", "description": "For awareness" }
}
```

---

## 9. Reports

### GET `/reports/inspections`
**Request Parameters:**
| Param | Type | Required | Example |
|-------|------|----------|---------|
| `start_date` | string | Yes | `2024-01-01` |
| `end_date` | string | Yes | `2024-12-31` |
| `module_id` | integer | No | `30` |

**Expected Response:**
```json
[
  {
    "id": 501,
    "created_at": "2024-01-15T14:30:00Z",
    "inspector_name": "John Inspector",
    "sos_code": "FE-CH-001",
    "equipment_code": "FE-CH-001",
    "module_name": "Fire Extinguisher",
    "status": "pass",
    "remarks": "All OK"
  }
]
```

---

### GET `/reports/equipment-status`
**Request Parameters:** Same as `/reports/inspections`.

**Expected Response:**
```json
[
  {
    "sos_code": "FE-CH-001",
    "equipment_type": "CO2 - 4.5 KG",
    "building_name": "Main Block",
    "operational_status": "operational",
    "readiness_score": 95.5,
    "last_inspection_date": "2024-01-15"
  }
]
```

---

## 10. Missing / Broken APIs

### 🔴 CRITICAL — Broken (Fixed in frontend, still needs backend fix)

| # | Endpoint | Problem | What the Frontend Expects |
|---|----------|---------|--------------------------|
| 1 | `PATCH /admin/companies/:id` | Returns **500** when sending unchanged `company_ref` because uniqueness check doesn't exclude the current record | `WHERE id != :id` in the uniqueness check |
| 2 | `GET /alerts` | Was returning a bare array; `alertsData.alerts` was always `undefined` in all 30+ Stats pages → zero alerts shown | Always return `{ "alerts": [...] }` |

---

### 🟡 Missing Endpoints (Not in apiService.js — need to be added)

| # | Endpoint | Purpose | Used In |
|---|----------|---------|---------|
| 3 | `DELETE /admin/users/:id` | Delete a user from the system | UserManagement (delete button not added yet but will be needed) |
| 4 | `PUT /admin/users/:id/nav-access` | Save which nav modules a user can access (Overview, Reports, Checklists, etc.) | UserManagement → Modules modal. **Currently stored only in localStorage** — lost if user clears browser or logs in on another device |
| 5 | `GET /admin/users/:id/nav-access` | Fetch saved nav module permissions for a user | UserManagement → Modules modal initial load |

---

### 🔵 Exists But Never Called (frontend should use it)

| # | Endpoint | Exists? | Problem |
|---|----------|---------|---------|
| 6 | `GET /admin/modules-list` | ✅ Yes | The Equipment Access "Assign Equipment" dropdown uses a **hardcoded static list** of 29 modules in the frontend code instead of calling this endpoint. If modules change on the server, the dropdown won't update. |

---

## 11. Response Shape Problems

These are inconsistencies in the API responses that cause the frontend to use multiple fallback field names. Each one is a potential silent failure if the expected field is ever removed.

| # | Field | Current Backend Behavior | Frontend Workaround | Required Fix |
|---|-------|--------------------------|--------------------|----|
| 1 | Company reference ID | Returns `company_ref` OR `company_id` OR `companyId` | `company.company_ref \|\| company.company_id \|\| company.companyId` | Standardize to `company_ref` |
| 2 | Module primary key | Returns `module_id` OR `id` | `m.module_id \|\| m.id` | Always return both `id` and `module_id` with the same value |
| 3 | Module code | Returns `code` OR `module_code` | `m.code \|\| m.module_code` | Standardize to `code` |
| 4 | Module name | Returns `name` OR `module_name` | `m.name \|\| m.module_name` | Standardize to `name` |
| 5 | Checklist question text | Returns `question`, `item_text`, `checklist_name`, OR `name` | Tries all four | Standardize to `question` |
| 6 | Equipment health score | Returns `readiness_score`, `health_score`, OR `score` | Tries all three | Standardize to `readiness_score` |
| 7 | List wrappers | Sometimes bare array, sometimes `{ "data": [...] }`, sometimes `{ "companies": [...] }` etc. | Triple fallback on every list endpoint | All list endpoints should return bare arrays |
| 8 | Equipment text identifier | Returns `sos_code` AND/OR `id` | `item.sos_code \|\| item.id` | Always return both |

---

## Summary

| Priority | Count | Description |
|----------|-------|-------------|
| 🔴 Critical (fix now) | 2 | `PATCH /companies/:id` 500 on unchanged fields; `GET /alerts` bare array breaks all stats |
| 🟡 Missing endpoints | 3 | Delete user, save/get nav access per user |
| 🔵 Not called | 1 | `GET /admin/modules-list` exists but frontend uses static data |
| 🟠 Shape inconsistencies | 8 | Field name variants that could silently break |

---

*Document generated from frontend source code analysis.*  
*Project: Fire Extinguisher Safety Dashboard*  
*Frontend stack: React + Vite*
