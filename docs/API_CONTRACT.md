# API Contract — SOS Emergency Safety Equipment Platform

> **Single source of truth for all API endpoints.**
> Update this file every time an endpoint is added, changed, or removed.
> Reference: [PROJECT_LOG.md](./PROJECT_LOG.md)

---

## Document Info

| Item | Detail |
|---|---|
| Project | SOS — Emergency Safety Equipment Monitoring Platform |
| Version | v3.1 |
| Last Updated | 2026-05-09 |
| Base URL (production) | `https://ehs.garrev.com/app1/v1` |
| Base URL (LAN) | `http://192.168.1.199/app1/v1` |
| Auth | Bearer token — DB-backed JWT sessions (90-day rolling refresh) |
| Data Format | JSON (`application/json`) |
| Date Format | ISO 8601 — `YYYY-MM-DD` for dates, `YYYY-MM-DDTHH:mm:ss.sssZ` for timestamps |

> **Important:** The `/api/*` prefix has been permanently removed. Only `/app1/v1/*` is active.

---

## Environments

| Environment | Base URL |
|---|---|
| Production (HTTPS via Cloudflare) | `https://ehs.garrev.com/app1/v1` |
| LAN direct | `http://192.168.1.199/app1/v1` |
| Dashboard (React) | `https://pro.garrev.com` |
| SafeHydra | `https://sh.garrev.com` |

---

## Global Response Codes

| HTTP | Meaning |
|---|---|
| 200 | Success |
| 201 | Record created |
| 400 | Bad request — missing or invalid field |
| 401 | Missing or invalid Bearer token |
| 403 | Authenticated but role not permitted |
| 404 | Record not found |
| 409 | Conflict — action not valid for current state |
| 500 | Server or database error — `{ "error": "message" }` |

---

## Authentication

All protected endpoints require:
```
Authorization: Bearer <token>
```

Login to get a token: `POST /app1/v1/auth/login`

**Standard User Accounts**

| Username | Password | Role | Module Access |
|---|---|---|---|
| `Admin1` | `Eltrive@0011` | superadmin | ALL (wildcard) |
| `Admin` | `Eltrive@0011` | admin | All active modules |
| `user` | `Eltrive@0011` | user | Assigned modules |
| `eltrive` | `Eltrive@0011` | user | Assigned modules |

---

## User Roles (v3.0 — 5 Roles)

| Role | Code | Can Manage Users | Can Inspect | Can Admin Modules | Scope |
|---|---|---|---|---|---|
| Super Admin | `superadmin` | Yes (all) | Yes | Yes | Global |
| Admin | `admin` | Yes (company) | Yes | Yes | Company |
| Supervisor | `supervisor` | No | Yes | Partial | Module |
| Inspector | `inspector` | No | Yes | No | Module |
| User | `user` | No | No | No | Module |

## Module Access Levels (user_modules.access_level)

| Level | View | Inspect | Edit Equipment | Manage Module |
|---|---|---|---|---|
| `view` | Yes | No | No | No |
| `inspect` | Yes | Yes | No | No |
| `manage` | Yes | Yes | Yes | No |
| `admin` | Yes | Yes | Yes | Yes |

---

## Part 11 Compliance Notes

This platform targets 21 CFR Part 11 compliance for use in pharmaceutical and regulated industrial sites.

- All deletes are **soft-delete only** (`is_active = false`). Inspection records are never deleted.
- Every inspection submission requires an **electronic signature block** (gmp_signatures table).
- All data changes are tracked in the **audit_log** table.
- Devices must be **approved by an admin** before they can sync data.
- Timestamps are always **server-side** — device-supplied timestamps are not accepted.

---

## Status Buckets

| status_bucket | Condition | Colour |
|---|---|---|
| `expired` | `expiry_date < today` | Red |
| `needs-service` | `operational_status = 'needs-service'` | Red |
| `due-inspection` | `next_inspection_due < today` | Red |
| `upcoming` | `next_inspection_due` within next 30 days | Amber |
| `active` | None of the above | Green |

---

## Readiness Score

| Score | Meaning |
|---|---|
| 90–100 | Healthy |
| 80–89 | Good — upcoming inspection |
| 60–79 | Fair — overdue inspection |
| 35–59 | Poor — needs service |
| 0–34 | Critical — expired or failed |

---

## Alert Levels

| Level | Label | Condition |
|---|---|---|
| 1 | Warning | Inspection 1–7 days overdue |
| 2 | Critical | Inspection 8–30 days overdue OR `operational_status = needs-service` |
| 3 | Emergency | Inspection 30+ days overdue OR `expiry_date` in the past |

---

## Module Reference

| ID | Code | Name | Category |
|---|---|---|---|
| 30 | fire_extinguisher | Fire Extinguisher | fire |
| 31 | sprinkler | Sprinkler System | fire |
| ... | ... | ... | ... |
| 55 | fire_trolley | Fire Trolley | emergency |

---

## 1. Health Check
`GET /app1/v1/health`

## 2. Login
`POST /app1/v1/auth/login`

## 6. Platform Dashboard
`GET /app1/v1/dashboard`

## 15. Module Summary
`GET /app1/v1/modules/:moduleId/summary`

## 16. Module Checklist Template
`GET /app1/v1/modules/:moduleId/checklists`

## 64. Create Company
`POST /app1/v1/admin/companies`

## 65. List All Companies
`GET /app1/v1/admin/companies`

---
*(Full details available in documentation)*
