Yes — there are several similar open-source applications available on GitHub that can help you as a starting point.
But your pharma inspection use case is more advanced because you need:

* Periodic inspection scheduling
* Shift-based assignment
* Checklist management
* QR scanning
* Auto workload balancing
* Equipment-wise rules
* Audit compliance

Most GitHub projects solve only 40–60% of your requirement, but they are excellent starting references.

---

# BEST MATCH FOR YOUR USE CASE

## 1. [Shelf.nu GitHub Repository](https://github.com/Shelf-nu/shelf.nu?utm_source=chatgpt.com)

This is probably the closest open-source foundation for your system.

Features already available:

* QR code equipment tracking
* Location hierarchy
* Asset scheduling
* Mobile scanning
* Audit trail
* User roles
* Equipment assignment
* CSV import
* Notifications
* Booking workflows
* Multi-location support

Tech Stack:

| Layer    | Technology |
| -------- | ---------- |
| Frontend | React      |
| Backend  | TypeScript |
| Database | PostgreSQL |
| ORM      | Prisma     |
| UI       | Tailwind   |

Good for:

* Equipment tracking
* QR workflows
* Location management
* Scheduling foundation

Missing for your use case:

* Pharma inspection logic
* Checklist engine
* Shift-aware scheduling
* Periodic compliance logic
* Auto-balanced assignment

But this is the BEST reference architecture. ([GitHub][1])

---

# SECOND BEST OPTION

## [Snipe-IT Official Website](https://snipeitapp.com/?utm_source=chatgpt.com)

GitHub:

## [Snipe-IT GitHub Repository](https://github.com/snipe/snipe-it?utm_source=chatgpt.com)

Very famous open-source asset management platform.

Features:

* QR codes
* Asset tracking
* User assignment
* Audit logs
* Notifications
* Maintenance scheduling
* APIs

Good for:

* Equipment inventory
* Audit trail
* QR asset tracking

Weak for:

* Inspection checklist workflows
* Smart scheduling
* Shift-based assignment

Still a very strong base system.

Reddit users heavily recommend it for QR-based inventory systems. ([Reddit][2])

---

# THIRD OPTION

## [ERPNext](https://erpnext.com/?utm_source=chatgpt.com)

GitHub:

## [ERPNext GitHub Repository](https://github.com/frappe/erpnext?utm_source=chatgpt.com)

This is HUGE.

It already supports:

* Maintenance scheduling
* Asset lifecycle
* Work orders
* Inspections
* Preventive maintenance
* Shift employees
* Mobile support

Actually very close to industrial inspection systems.

BUT:

* Heavy system
* Complex customization
* More ERP than inspection app

Still worth studying.

---

# FOURTH OPTION

## [OpenMAINT](https://www.openmaint.org/en?utm_source=chatgpt.com)

GitHub:

## [OpenMAINT GitHub Repository](https://github.com/openmaint/openmaint?utm_source=chatgpt.com)

Industrial maintenance platform.

Supports:

* Facility management
* Maintenance workflows
* Asset management
* Preventive scheduling

Very enterprise-focused.

---

# FIFTH OPTION (Inspection-Focused)

## [TARGPatrol Inspections Platform](https://targpatrol.com/inspections-and-audit/?utm_source=chatgpt.com)

Not fully open-source, but excellent for inspiration.

Features:

* QR scanning
* Checklist engine
* Scheduling
* GPS
* Inspection reports
* Mobile workflows

This is visually close to what you want. ([TargPatrol][3])

---

# What I Recommend for YOU

You should NOT directly use these systems fully.

Instead:

# Recommended Strategy

## Use Existing Open Source ONLY AS:

* Reference architecture
* UI inspiration
* QR workflow reference
* Scheduling logic reference
* Database structure reference

---

# Build Your Own Core Logic

Because your pharma workflow is unique:

You need:

| Feature                   | Standard Open Source | Your Need |
| ------------------------- | -------------------- | --------- |
| QR Asset Tracking         | Yes                  | Yes       |
| Equipment Locations       | Yes                  | Yes       |
| Checklist Engine          | Partial              | Advanced  |
| Shift Restrictions        | Rare                 | Mandatory |
| Periodic Compliance       | Limited              | Critical  |
| Auto Workload Balancing   | No                   | Mandatory |
| Pharma Audit Trail        | Limited              | Mandatory |
| Operator Assignment Logic | Weak                 | Advanced  |
| Nearby Equipment Grouping | No                   | Needed    |

---

# BEST ARCHITECTURE FOR YOU

---

# Backend

Recommended:

## Laravel

Why:

* Fast development
* Excellent scheduling support
* Easy APIs
* Easy admin panel
* Strong MySQL support

---

# Mobile App

Recommended:

## Flutter

Why:

* QR scanner easy
* Offline support
* Android friendly
* Fast checklist forms

---

# Database

## PostgreSQL

OR

## MySQL

---

# Scheduler

You should create your own scheduler logic.

Pseudo logic:

```text
FOR each equipment:
   IF due_for_inspection:
      FIND eligible operators
      FILTER by shift compatibility
      SORT by least workload
      ASSIGN inspection
```

---

# What You Can Reuse From GitHub

You can directly reuse:

| Component          | Reuse |
| ------------------ | ----- |
| QR Scanner         | Yes   |
| Authentication     | Yes   |
| User Roles         | Yes   |
| Asset CRUD         | Yes   |
| Location hierarchy | Yes   |
| Notifications      | Yes   |
| CSV import         | Yes   |

---

# What You MUST Build Yourself

| Component           |
| ------------------- |
| Inspection engine   |
| Checklist logic     |
| Pharma compliance   |
| Shift scheduler     |
| Auto balancing      |
| Due-date recurrence |
| Inspection reports  |
| Audit dashboards    |

---

# Strong Practical Suggestion

Do NOT begin with:

* AI
* IoT
* SAP integration
* Predictive analytics

Start with:

## Version 1

* Equipment master
* QR codes
* Checklists
* Scheduling
* Assignment
* Mobile inspection
* Reports

That alone becomes a very strong industrial product.

---

# Final Recommendation

If I were designing this for your pharma company:

## I would:

### Use:

* [Shelf.nu](https://github.com/Shelf-nu/shelf.nu?utm_source=chatgpt.com) as architectural inspiration
* Laravel backend
* Flutter mobile app
* Custom scheduling engine
* QR-based inspection workflow

### And build:

* Pharma-specific inspection logic
* Smart scheduler
* Shift balancing
* Compliance reporting

This will give you a scalable enterprise-grade inspection system.

[1]: https://github.com/Shelf-nu/shelf.nu?utm_source=chatgpt.com "GitHub - Shelf-nu/shelf.nu: A free open source IT asset / Equipment / management and scheduling system. · GitHub"
[2]: https://www.reddit.com/r/sysadmin/comments/jy1f36?utm_source=chatgpt.com "QR Code Management, but Not for Inventory (necessarily)"
[3]: https://targpatrol.com/inspections-and-audit/?utm_source=chatgpt.com "QR Code Inspection App with Checklist | TARGPatrol"
