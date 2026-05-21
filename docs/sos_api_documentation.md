# SOS Emergency Safety Platform — API Documentation
**Base URL:** `https://ehs.garrev.com/app1/v1`

## 1. Authentication APIs
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/auth/login` | POST | Authenticates user and returns JWT token and user profile. |
| `/auth/me` | GET | Returns profile of the currently authenticated user. |
| `/auth/logout` | POST | Invalidates the current session. |

## 2. Dashboard & Summary
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/dashboard` | GET | Fetches dynamic dashboard module configuration and scores. |
| `/health` | GET | Returns system health status. |
| `/alerts/summary` | GET | Returns counts of active alerts. |
| `/alerts` | GET | Fetches list of active alerts (supports `level` and `department` filters). |

## 3. Equipment & Inspections
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/equipment` | GET | Fetches list of all safety equipment. |
| `/equipment/:sosCode` | GET | Fetches details for a specific equipment by SOS code. |
| `/equipment/:sosCode/inspections` | GET | Returns inspection history for specific equipment. |
| `/equipment/:sosCode/inspections` | POST | Submits a new inspection report. |
| `/inspections/:id` | GET | Fetches a specific inspection record. |

## 4. Module Management
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/modules/:id/summary` | GET | Returns readiness score and stats for a module category. |
| `/modules/:id/equipment` | GET | Lists all assets belonging to a specific module. |
| `/modules/:id/checklists` | GET | Fetches the inspection checklist for a module. |
| `/modules/:id/fields` | GET | Returns dynamic fields defined for the module. |

## 5. Administrative Suite (Admin Only)

### User Management & Permissions
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/admin/users` | GET | Lists all system users. |
| `/admin/users` | POST | Creates a new user. |
| `/admin/users/:id` | PATCH | Updates user details (name, email, role, status). |
| `/admin/users/:id` | DELETE | Permanently removes a user account. |
| `/admin/users/:id/nav-access` | GET | Fetches allowed navigation items for a user. |
| `/admin/users/:id/nav-access` | PUT | Updates allowed navigation items (sidebar visibility). |
| `/admin/users/:id/modules` | GET | Lists assigned module permissions and access levels. |
| `/admin/users/:id/modules` | POST | Assigns a new module permission (view, inspect, manage, admin). |
| `/admin/users/:userId/modules/:moduleId` | DELETE | Revokes a specific module permission. |

### Company & Global Setup
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/admin/companies` | GET | Lists all registered companies. |
| `/admin/companies` | POST | Creates a new company profile. |
| `/admin/companies/:id/logo` | POST | Uploads/updates a company logo. |
| `/admin/modules` | GET | Returns the master list of all available modules. |
| `/admin/audit-log` | GET | Returns system-wide audit logs. |

## 6. Device & Sync Workflow
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/devices/register` | POST | Registers a mobile device for offline sync. |
| `/sync/pull` | GET | Pulls latest data since the last sync timestamp. |
| `/sync/push` | POST | Pushes offline inspections and updates to the server. |
| `/admin/devices` | GET | Lists all devices pending approval or registered. |

---
**Document Version:** 1.0.0  
**Generated:** May 12, 2026
