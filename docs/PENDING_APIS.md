# Pending Backend APIs — SOS Platform
**Version:** 1.0  
**Date:** 2025-05-30  
**Scope:** New + Extended endpoints required for Supervisor → AGM workflow  
*(Work Orders, Auto Scheduler, Onboarding excluded)*

---

## Overview

These are the APIs that do not yet exist on the backend (or need to be extended) to support the full role-based workflow:

```
Superadmin
  └── Admin (Apitoria)
        ├── AGM 1
        │     ├── Supervisor 1A → Users (3–4)
        │     └── Supervisor 1B → Users (3–4)
        └── AGM 2
              ├── Supervisor 2A → Users (3–4)
              └── Supervisor 2B → Users (3–4)
```

**Workflow:**
1. User submits checklist → routed to their assigned Supervisor
2. Supervisor approves / rejects → User gets notified
3. Supervisor's action → AGM gets notified

---

## Table of Pending APIs

| # | Type | Method | Endpoint | Description |
|---|---|---|---|---|
| 1 | Filter | GET | `/admin/users?role=` | Filter users by role |
| 2 | Extend | PATCH | `/admin/users/{id}` | Accept `supervisor_id` and `agm_id` |
| 3 | New | GET | `/admin/users/{id}/team` | Get team under a supervisor or AGM |
| 4 | New | POST | `/notifications` | Send targeted notification to one user |
| 5 | New | GET | `/notifications/unread-count` | Unread badge count |
| 6 | New | PATCH | `/notifications/read-all` | Mark all notifications as read |
| 7 | New | DELETE | `/notifications/{id}` | Delete a single notification |
| 8 | Filter | GET | `/reports/inspections` | Add `supervisor_id`, `agm_id`, `submitted_by`, `status` params |
| 9 | New | GET | `/dashboard/supervisor` | Supervisor home stats |
| 10 | New | GET | `/dashboard/agm` | AGM home stats |
| 11 | Extend | PATCH | `/inspections/{id}/approve` | Return `submitted_by_id`, `agm_id`, `sos_code` in response |
| 12 | Extend | PATCH | `/inspections/{id}/reject` | Return `submitted_by_id`, `agm_id`, `sos_code` in response |

---

## 1. Filter Users by Role

**`GET /admin/users?role={role}`**  
**Type:** Filter (extend existing endpoint)  
**Access:** Admin, Superadmin

Add support for the `role` query parameter on the existing user listing endpoint so the frontend can populate dropdowns for assigning supervisors and AGMs.

### Query Parameters

| Param | Type | Required | Values |
|---|---|---|---|
| `role` | string | No | `superadmin`, `admin`, `agm`, `supervisor`, `user` |
| `status` | string | No | `active`, `inactive` |
| `company_id` | integer | No | Company ID |

### Request
No body.

### Response `200 OK`
```json
{
  "users": [
    {
      "id": 12,
      "name": "John Doe",
      "username": "john_doe",
      "email": "john@apitoria.com",
      "role": "supervisor",
      "status": "active",
      "company_id": 1,
      "supervisor_id": null,
      "agm_id": 5,
      "agm_name": "Priya Nair",
      "created_at": "2025-01-15T08:00:00Z"
    },
    {
      "id": 13,
      "name": "Arjun Mehta",
      "username": "arjun_m",
      "email": "arjun@apitoria.com",
      "role": "supervisor",
      "status": "active",
      "company_id": 1,
      "supervisor_id": null,
      "agm_id": 5,
      "agm_name": "Priya Nair",
      "created_at": "2025-02-10T08:00:00Z"
    }
  ],
  "total": 2
}
```

---

## 2. Update User — Accept Hierarchy Fields

**`PATCH /admin/users/{id}`**  
**Type:** Extend (existing endpoint)  
**Access:** Admin, Superadmin

Extend the existing update user endpoint to accept and persist `supervisor_id` (for users) and `agm_id` (for supervisors). These link users to their manager in the org hierarchy.

### Path Parameters

| Param | Type | Required |
|---|---|---|
| `id` | integer | Yes |

### Request Body
```json
{
  "name": "Ravi Kumar",
  "email": "ravi@apitoria.com",
  "role": "user",
  "status": "active",
  "company_id": 1,
  "supervisor_id": 12,
  "agm_id": 5
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | No | Full name |
| `email` | string | No | Email address |
| `role` | string | No | `superadmin`, `admin`, `agm`, `supervisor`, `user` |
| `status` | string | No | `active`, `inactive` |
| `company_id` | integer | No | Company ID |
| `supervisor_id` | integer | No | ID of the supervisor this user reports to (for role=user) |
| `agm_id` | integer | No | ID of the AGM this supervisor reports to (for role=supervisor) |
| `password` | string | No | Only if changing password |

### Response `200 OK`
```json
{
  "id": 22,
  "name": "Ravi Kumar",
  "username": "ravi_kumar",
  "email": "ravi@apitoria.com",
  "role": "user",
  "status": "active",
  "company_id": 1,
  "supervisor_id": 12,
  "supervisor_name": "John Doe",
  "agm_id": 5,
  "agm_name": "Priya Nair",
  "updated_at": "2025-05-30T10:00:00Z"
}
```

### Response `404 Not Found`
```json
{ "error": "User not found" }
```

### Response `400 Bad Request`
```json
{ "error": "supervisor_id does not belong to a user with role supervisor" }
```

---

## 3. Get Team Under a User

**`GET /admin/users/{id}/team`**  
**Type:** New endpoint  
**Access:** Admin, Superadmin, AGM (own team only), Supervisor (own team only)

Returns the direct team under a supervisor (their users) or under an AGM (their supervisors + total user count). Response shape differs based on the role of the user whose `{id}` is provided.

### Path Parameters

| Param | Type | Required |
|---|---|---|
| `id` | integer | Yes |

### Request
No body.

### Response `200 OK` — When called on a Supervisor
```json
{
  "user_id": 12,
  "user_name": "John Doe",
  "role": "supervisor",
  "team": [
    {
      "id": 22,
      "name": "Ravi Kumar",
      "username": "ravi_kumar",
      "email": "ravi@apitoria.com",
      "role": "user",
      "status": "active",
      "submissions_this_week": 3
    },
    {
      "id": 23,
      "name": "Sneha Patel",
      "username": "sneha_p",
      "email": "sneha@apitoria.com",
      "role": "user",
      "status": "active",
      "submissions_this_week": 2
    }
  ],
  "total": 2
}
```

### Response `200 OK` — When called on an AGM
```json
{
  "user_id": 5,
  "user_name": "Priya Nair",
  "role": "agm",
  "supervisors": [
    {
      "id": 12,
      "name": "John Doe",
      "username": "john_doe",
      "email": "john@apitoria.com",
      "role": "supervisor",
      "status": "active",
      "team_count": 3,
      "pending_approvals": 2,
      "compliance_rate": 91
    },
    {
      "id": 13,
      "name": "Arjun Mehta",
      "username": "arjun_m",
      "email": "arjun@apitoria.com",
      "role": "supervisor",
      "status": "active",
      "team_count": 4,
      "pending_approvals": 3,
      "compliance_rate": 85
    }
  ],
  "total_supervisors": 2,
  "total_users": 7
}
```

### Response `404 Not Found`
```json
{ "error": "User not found" }
```

---

## 4. Send Targeted Notification

**`POST /notifications`**  
**Type:** New endpoint  
**Access:** Admin, Superadmin, Supervisor (via system trigger)

Sends a notification to a specific user by `user_id`. This is different from `/notifications/broadcast` which sends to everyone. Used by the approval flow to notify the submitting User and the AGM separately.

### Request Body
```json
{
  "user_id": 22,
  "title": "Inspection Approved",
  "message": "Your inspection for SOS-FE-001 was approved by John Doe.",
  "type": "inspection_approved",
  "reference_id": 789,
  "reference_type": "inspection"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `user_id` | integer | Yes | Recipient user ID |
| `title` | string | Yes | Short heading shown in notification |
| `message` | string | Yes | Full notification message |
| `type` | string | Yes | `inspection_approved`, `inspection_rejected`, `inspection_submitted`, `general` |
| `reference_id` | integer | No | ID of the related record (inspection ID, equipment ID, etc.) |
| `reference_type` | string | No | `inspection`, `equipment`, `work_order` |

### Response `201 Created`
```json
{
  "id": 301,
  "user_id": 22,
  "title": "Inspection Approved",
  "message": "Your inspection for SOS-FE-001 was approved by John Doe.",
  "type": "inspection_approved",
  "reference_id": 789,
  "reference_type": "inspection",
  "is_read": false,
  "created_at": "2025-05-30T11:00:00Z"
}
```

### Response `404 Not Found`
```json
{ "error": "Recipient user not found" }
```

---

## 5. Get Unread Notification Count

**`GET /notifications/unread-count`**  
**Type:** New endpoint  
**Access:** All roles (returns count for the logged-in user only)

Returns the unread notification count for the currently authenticated user. Used to display the badge on the bell icon in the header.

### Request
No body.

### Response `200 OK`
```json
{
  "unread_count": 4
}
```

---

## 6. Mark All Notifications as Read

**`PATCH /notifications/read-all`**  
**Type:** New endpoint  
**Access:** All roles (acts on logged-in user's notifications only)

Marks every unread notification for the logged-in user as read. Used when the user clicks "Mark all as read" in the notification center.

### Request
No body.

### Response `200 OK`
```json
{
  "success": true,
  "marked_count": 4
}
```

---

## 7. Delete a Notification

**`DELETE /notifications/{id}`**  
**Type:** New endpoint  
**Access:** All roles (can only delete own notifications)

Permanently removes a single notification. Used when the user dismisses a notification from the notification center.

### Path Parameters

| Param | Type | Required |
|---|---|---|
| `id` | integer | Yes |

### Request
No body.

### Response `200 OK`
```json
{ "success": true }
```

### Response `404 Not Found`
```json
{ "error": "Notification not found" }
```

### Response `403 Forbidden`
```json
{ "error": "You can only delete your own notifications" }
```

---

## 8. Inspection Reports — Additional Filters

**`GET /reports/inspections`**  
**Type:** Filter (extend existing endpoint)  
**Access:** All roles (results scoped to role — supervisor sees only their team, AGM sees their supervisors' teams)

Add the following query parameters to the existing inspection reports endpoint. The backend should automatically scope results based on the logged-in user's role even when no filter is passed.

### New Query Parameters to Add

| Param | Type | Notes |
|---|---|---|
| `supervisor_id` | integer | Return only inspections submitted by users under this supervisor |
| `agm_id` | integer | Return inspections across all supervisors under this AGM |
| `submitted_by` | integer | Return inspections submitted by a specific user ID |
| `status` | string | `PENDING`, `APPROVED`, `REJECTED` |

*(Existing params `start_date`, `end_date`, `module_id`, `sos_code` remain unchanged)*

### Example Requests
```
GET /reports/inspections?supervisor_id=12&status=PENDING
GET /reports/inspections?agm_id=5&start_date=2025-05-01&end_date=2025-05-30
GET /reports/inspections?submitted_by=22
```

### Response `200 OK`
```json
{
  "inspections": [
    {
      "id": 789,
      "sos_code": "SOS-FE-001",
      "equipment_name": "Fire Extinguisher — Block A",
      "module_id": 30,
      "module_name": "Fire Extinguishers",
      "status": "PENDING",
      "approval_status": "PENDING",
      "inspector_name": "Ravi Kumar",
      "submitted_by_id": 22,
      "submitted_by_name": "Ravi Kumar",
      "assigned_supervisor_id": 12,
      "assigned_supervisor_name": "John Doe",
      "agm_id": 5,
      "agm_name": "Priya Nair",
      "score": 94,
      "remarks": "All items passed.",
      "inspected_at": "2025-05-30T10:30:00Z",
      "created_at": "2025-05-30T10:31:00Z"
    }
  ],
  "total": 1
}
```

---

## 9. Supervisor Dashboard

**`GET /dashboard/supervisor`**  
**Type:** New endpoint  
**Access:** Supervisor only (scoped to logged-in supervisor via JWT)

Returns all stats a supervisor needs on their home screen: pending approval count, team activity, and weekly compliance.

### Request
No body.

### Response `200 OK`
```json
{
  "supervisor_id": 12,
  "supervisor_name": "John Doe",
  "pending_approvals": 3,
  "approved_this_week": 11,
  "rejected_this_week": 1,
  "total_submissions_this_week": 15,
  "compliance_rate": 91,
  "team_members": 4,
  "team": [
    {
      "id": 22,
      "name": "Ravi Kumar",
      "role": "user",
      "status": "active",
      "submissions_this_week": 5,
      "last_submission_at": "2025-05-30T10:30:00Z"
    },
    {
      "id": 23,
      "name": "Sneha Patel",
      "role": "user",
      "status": "active",
      "submissions_this_week": 4,
      "last_submission_at": "2025-05-29T14:00:00Z"
    },
    {
      "id": 24,
      "name": "Anil Sharma",
      "role": "user",
      "status": "active",
      "submissions_this_week": 3,
      "last_submission_at": "2025-05-29T09:00:00Z"
    },
    {
      "id": 25,
      "name": "Deepa Raj",
      "role": "user",
      "status": "active",
      "submissions_this_week": 3,
      "last_submission_at": "2025-05-28T16:00:00Z"
    }
  ]
}
```

---

## 10. AGM Dashboard

**`GET /dashboard/agm`**  
**Type:** New endpoint  
**Access:** AGM only (scoped to logged-in AGM via JWT)

Returns the AGM's full team overview — supervisor-level compliance breakdown, total pending approvals across all teams, and rejection rates.

### Request
No body.

### Response `200 OK`
```json
{
  "agm_id": 5,
  "agm_name": "Priya Nair",
  "total_supervisors": 2,
  "total_users": 7,
  "pending_approvals_across_team": 5,
  "approved_this_week": 24,
  "rejected_this_week": 2,
  "total_submissions_this_week": 31,
  "compliance_rate": 88,
  "supervisors": [
    {
      "id": 12,
      "name": "John Doe",
      "role": "supervisor",
      "status": "active",
      "team_count": 3,
      "pending_approvals": 3,
      "approved_this_week": 11,
      "rejected_this_week": 1,
      "compliance_rate": 91
    },
    {
      "id": 13,
      "name": "Arjun Mehta",
      "role": "supervisor",
      "status": "active",
      "team_count": 4,
      "pending_approvals": 2,
      "approved_this_week": 13,
      "rejected_this_week": 1,
      "compliance_rate": 85
    }
  ]
}
```

---

## 11. Approve Inspection — Extended Response

**`PATCH /inspections/{id}/approve`**  
**Type:** Extend (existing endpoint)  
**Access:** Supervisor, Admin, Superadmin

The request body is unchanged. The response must additionally include `submitted_by_id`, `agm_id`, and `sos_code` so the frontend can trigger targeted notifications to the User and AGM without making a second API call.

### Path Parameters

| Param | Type | Required |
|---|---|---|
| `id` | integer | Yes |

### Request Body (unchanged)
```json
{
  "remarks": "Inspection looks good. Approved."
}
```

### Response `200 OK` — Extended Fields Added
```json
{
  "id": 789,
  "status": "APPROVED",
  "approval_status": "APPROVED",
  "approved_by_id": 12,
  "approved_by_name": "John Doe",
  "review_remarks": "Inspection looks good. Approved.",
  "approved_at": "2025-05-30T11:00:00Z",
  "submitted_by_id": 22,
  "submitted_by_name": "Ravi Kumar",
  "agm_id": 5,
  "agm_name": "Priya Nair",
  "sos_code": "SOS-FE-001",
  "equipment_name": "Fire Extinguisher — Block A"
}
```

> **Why these fields are needed:**
> After approval the frontend must immediately send two notifications:
> - To `submitted_by_id` (User): "Your inspection was approved"
> - To `agm_id` (AGM): "Supervisor approved an inspection in your team"
> Without these in the response, the frontend would need an extra `GET /inspections/{id}` call.

### Response `404 Not Found`
```json
{ "error": "Inspection not found" }
```

### Response `400 Bad Request`
```json
{ "error": "Inspection is already approved" }
```

---

## 12. Reject Inspection — Extended Response

**`PATCH /inspections/{id}/reject`**  
**Type:** Extend (existing endpoint)  
**Access:** Supervisor, Admin, Superadmin

Same logic as approve — response must include `submitted_by_id`, `agm_id`, and `sos_code`.

### Path Parameters

| Param | Type | Required |
|---|---|---|
| `id` | integer | Yes |

### Request Body (unchanged)
```json
{
  "reason": "Safety pin missing. Re-inspect after fixing."
}
```

### Response `200 OK` — Extended Fields Added
```json
{
  "id": 789,
  "status": "REJECTED",
  "approval_status": "REJECTED",
  "rejected_by_id": 12,
  "rejected_by_name": "John Doe",
  "rejection_reason": "Safety pin missing. Re-inspect after fixing.",
  "rejected_at": "2025-05-30T11:05:00Z",
  "submitted_by_id": 22,
  "submitted_by_name": "Ravi Kumar",
  "agm_id": 5,
  "agm_name": "Priya Nair",
  "sos_code": "SOS-FE-001",
  "equipment_name": "Fire Extinguisher — Block A"
}
```

### Response `404 Not Found`
```json
{ "error": "Inspection not found" }
```

### Response `400 Bad Request`
```json
{ "error": "Inspection is already rejected" }
```

---

## Notification Flow Reference

This shows how the frontend uses the above APIs together after a supervisor acts on an inspection:

```
Supervisor clicks Approve
        │
        ▼
PATCH /inspections/{id}/approve
        │
        ▼
Response includes submitted_by_id + agm_id
        │
        ├──► POST /notifications  { user_id: submitted_by_id, type: "inspection_approved" }
        │         → User sees: "Your inspection was approved ✅"
        │
        └──► POST /notifications  { user_id: agm_id, type: "inspection_submitted" }
                  → AGM sees: "Supervisor John Doe approved an inspection"
```

```
Supervisor clicks Reject
        │
        ▼
PATCH /inspections/{id}/reject
        │
        ▼
Response includes submitted_by_id + agm_id
        │
        ├──► POST /notifications  { user_id: submitted_by_id, type: "inspection_rejected" }
        │         → User sees: "Your inspection was rejected ❌ — reason: ..."
        │
        └──► POST /notifications  { user_id: agm_id, type: "inspection_submitted" }
                  → AGM sees: "Supervisor John Doe rejected an inspection"
```

---

## Notification Types Reference

| Type | Triggered When | Sent To |
|---|---|---|
| `inspection_submitted` | User submits a checklist | Supervisor |
| `inspection_approved` | Supervisor approves | User + AGM |
| `inspection_rejected` | Supervisor rejects | User + AGM |
| `general` | Admin broadcasts a message | All / specific user |

---

*Document prepared for backend team — SOS Emergency Safety Platform*  
*Frontend repo: Fire_Extinguisher | API Base: https://ehs.garrev.com/app1/v1*
