import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, AlignmentType, BorderStyle,
  WidthType, ShadingType, TableLayoutType, convertInchesToTwip,
  PageOrientation
} from 'docx';
import { writeFileSync } from 'fs';

const BLUE       = '1e40af';
const LIGHT_BLUE = 'dbeafe';
const DARK       = '1e293b';
const GRAY       = '64748b';
const GREEN_BG   = 'd1fae5';
const GREEN_TXT  = '065f46';
const ORANGE_BG  = 'ffedd5';
const ORANGE_TXT = '9a3412';
const PURPLE_BG  = 'ede9fe';
const PURPLE_TXT = '5b21b6';
const WHITE      = 'FFFFFF';
const CODE_BG    = 'f1f5f9';

// ─── helpers ───────────────────────────────────────────────────────────────

const bold = (text, color = DARK, size = 20) =>
  new TextRun({ text, bold: true, color, size });

const normal = (text, color = DARK, size = 19) =>
  new TextRun({ text, color, size });

const code = (text) =>
  new TextRun({ text, font: 'Courier New', color: '0f172a', size: 17 });

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 320, after: 120 },
  children: [new TextRun({ text, bold: true, color: BLUE, size: 36 })],
});

const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 280, after: 100 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE } },
  children: [new TextRun({ text, bold: true, color: BLUE, size: 26 })],
});

const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 200, after: 80 },
  children: [new TextRun({ text, bold: true, color: DARK, size: 22 })],
});

const para = (text, color = DARK) => new Paragraph({
  spacing: { after: 80 },
  children: [normal(text, color)],
});

const note = (text) => new Paragraph({
  spacing: { before: 100, after: 100 },
  indent: { left: convertInchesToTwip(0.2) },
  shading: { type: ShadingType.SOLID, fill: LIGHT_BLUE },
  children: [new TextRun({ text: '  ℹ  ' + text, color: '1e40af', size: 18, italics: true })],
});

const spacer = (lines = 1) => new Paragraph({
  spacing: { after: lines * 80 },
  children: [new TextRun({ text: '' })],
});

const methodBadge = (method) => {
  const colors = {
    GET:    { bg: GREEN_BG,  txt: GREEN_TXT },
    POST:   { bg: ORANGE_BG, txt: ORANGE_TXT },
    PATCH:  { bg: PURPLE_BG, txt: PURPLE_TXT },
    DELETE: { bg: 'fee2e2',  txt: '991b1b' },
    PUT:    { bg: 'fef3c7',  txt: '92400e' },
  };
  const c = colors[method] || colors.GET;
  return new TextRun({ text: ` ${method} `, bold: true, color: c.txt, size: 18 });
};

const endpointHeading = (method, path, summary) => new Paragraph({
  spacing: { before: 240, after: 100 },
  children: [
    methodBadge(method),
    new TextRun({ text: '  ' }),
    new TextRun({ text: path, font: 'Courier New', bold: true, color: BLUE, size: 22 }),
    new TextRun({ text: summary ? `   —   ${summary}` : '', color: GRAY, size: 18, italics: true }),
  ],
});

const codePara = (lines) => {
  const children = [];
  lines.split('\n').forEach((line, i) => {
    if (i > 0) children.push(new TextRun({ text: '\n', break: 1 }));
    children.push(code(line));
  });
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    shading: { type: ShadingType.SOLID, fill: CODE_BG },
    indent: { left: convertInchesToTwip(0.2) },
    children,
  });
};

const labeledCode = (label, lines) => [
  new Paragraph({
    spacing: { before: 120, after: 40 },
    children: [bold(label, GRAY, 17)],
  }),
  codePara(lines),
];

// ─── table helpers ──────────────────────────────────────────────────────────

const cell = (text, isHeader = false, width = null, bgColor = null) =>
  new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading: isHeader
      ? { type: ShadingType.SOLID, fill: BLUE }
      : bgColor ? { type: ShadingType.SOLID, fill: bgColor } : undefined,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [new Paragraph({
      children: [new TextRun({
        text,
        bold: isHeader,
        color: isHeader ? WHITE : DARK,
        size: isHeader ? 18 : 17,
      })],
    })],
  });

const tableRow = (cells, isHeader = false, bg = null) =>
  new TableRow({
    tableHeader: isHeader,
    children: cells.map((c, i) =>
      typeof c === 'string' ? cell(c, isHeader, null, bg) : c
    ),
  });

const simpleTable = (headers, rows, widths = null) => new Table({
  layout: TableLayoutType.FIXED,
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    tableRow(headers, true),
    ...rows.map((r, i) => tableRow(r, false, i % 2 === 1 ? 'f8fafc' : null)),
  ],
});

// ─── DOCUMENT SECTIONS ─────────────────────────────────────────────────────

const coverPage = [
  spacer(4),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 160 },
    children: [new TextRun({ text: 'SOS Emergency Safety Platform', bold: true, color: BLUE, size: 52 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: 'Pending Backend APIs', bold: true, color: DARK, size: 36 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: 'Request & Response Contract', color: GRAY, size: 24 })],
  }),
  spacer(2),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [normal('Version: 1.0   |   Date: 2025-05-30', GRAY, 20)],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [normal('Base URL: https://ehs.garrev.com/app1/v1', GRAY, 20)],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [normal('Scope: New + Extended endpoints for Supervisor → AGM workflow', GRAY, 20)],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [normal('(Work Orders, Auto Scheduler, Onboarding excluded)', GRAY, 18)],
  }),
];

const overviewSection = [
  h1('Overview'),
  para('These are the 12 APIs that either do not exist on the backend yet, or need to be extended, to support the full role-based inspection approval workflow.'),
  spacer(),
  h3('Organisation Hierarchy'),
  codePara(
`Superadmin
  └── Admin (Apitoria)
        ├── AGM 1
        │     ├── Supervisor 1A  →  Users (3–4)
        │     └── Supervisor 1B  →  Users (3–4)
        └── AGM 2
              ├── Supervisor 2A  →  Users (3–4)
              └── Supervisor 2B  →  Users (3–4)`),
  spacer(),
  h3('Approval Workflow'),
  para('1.  User submits checklist  →  routed to their assigned Supervisor'),
  para('2.  Supervisor approves / rejects  →  User gets notified (success or failure)'),
  para('3.  Supervisor action  →  AGM gets notified'),
  spacer(),
  h3('Summary Table'),
  simpleTable(
    ['#', 'Type', 'Method', 'Endpoint', 'Description'],
    [
      ['1',  'Filter', 'GET',    '/admin/users?role=',            'Filter users by role'],
      ['2',  'Extend', 'PATCH',  '/admin/users/{id}',             'Accept supervisor_id and agm_id'],
      ['3',  'New',    'GET',    '/admin/users/{id}/team',        'Get team under a supervisor or AGM'],
      ['4',  'New',    'POST',   '/notifications',                'Send targeted notification to one user'],
      ['5',  'New',    'GET',    '/notifications/unread-count',   'Unread badge count'],
      ['6',  'New',    'PATCH',  '/notifications/read-all',       'Mark all notifications as read'],
      ['7',  'New',    'DELETE', '/notifications/{id}',           'Delete a single notification'],
      ['8',  'Filter', 'GET',    '/reports/inspections',          'Add supervisor_id, agm_id, submitted_by, status params'],
      ['9',  'New',    'GET',    '/dashboard/supervisor',         'Supervisor home stats'],
      ['10', 'New',    'GET',    '/dashboard/agm',                'AGM home stats'],
      ['11', 'Extend', 'PATCH',  '/inspections/{id}/approve',    'Return submitted_by_id, agm_id, sos_code'],
      ['12', 'Extend', 'PATCH',  '/inspections/{id}/reject',     'Return submitted_by_id, agm_id, sos_code'],
    ]
  ),
];

// ─── API detail sections ────────────────────────────────────────────────────

const api1 = [
  h2('1.  Filter Users by Role'),
  endpointHeading('GET', '/admin/users?role={role}', 'Extend existing endpoint'),
  para('Add support for the role query parameter on the existing user listing endpoint so the frontend can populate dropdowns when assigning supervisors and AGMs to users.'),
  para('Access: Admin, Superadmin', GRAY),
  spacer(),
  h3('Query Parameters'),
  simpleTable(
    ['Parameter', 'Type', 'Required', 'Values'],
    [
      ['role',       'string',  'No', 'superadmin, admin, agm, supervisor, user'],
      ['status',     'string',  'No', 'active, inactive'],
      ['company_id', 'integer', 'No', 'Company ID'],
    ]
  ),
  spacer(),
  ...labeledCode('Request', 'No body — query parameter only\nExample: GET /admin/users?role=supervisor'),
  ...labeledCode('Response  200 OK',
`{
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
    }
  ],
  "total": 1
}`),
];

const api2 = [
  h2('2.  Update User — Accept Hierarchy Fields'),
  endpointHeading('PATCH', '/admin/users/{id}', 'Extend existing endpoint'),
  para('Extend the existing update user endpoint to accept and persist supervisor_id (for users) and agm_id (for supervisors). These fields link users to their manager in the org hierarchy.'),
  para('Access: Admin, Superadmin', GRAY),
  spacer(),
  h3('Path Parameters'),
  simpleTable(['Parameter', 'Type', 'Required'], [['id', 'integer', 'Yes']]),
  spacer(),
  h3('Request Body Fields'),
  simpleTable(
    ['Field', 'Type', 'Required', 'Notes'],
    [
      ['name',          'string',  'No', 'Full name'],
      ['email',         'string',  'No', 'Email address'],
      ['role',          'string',  'No', 'superadmin | admin | agm | supervisor | user'],
      ['status',        'string',  'No', 'active | inactive'],
      ['company_id',    'integer', 'No', 'Company ID'],
      ['supervisor_id', 'integer', 'No', 'ID of supervisor this user reports to (role=user)'],
      ['agm_id',        'integer', 'No', 'ID of AGM this supervisor reports to (role=supervisor)'],
      ['password',      'string',  'No', 'Only if changing password'],
    ]
  ),
  spacer(),
  ...labeledCode('Request Body',
`{
  "name": "Ravi Kumar",
  "email": "ravi@apitoria.com",
  "role": "user",
  "status": "active",
  "company_id": 1,
  "supervisor_id": 12,
  "agm_id": 5
}`),
  ...labeledCode('Response  200 OK',
`{
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
}`),
  ...labeledCode('Response  404 Not Found', '{ "error": "User not found" }'),
  ...labeledCode('Response  400 Bad Request',
    '{ "error": "supervisor_id does not belong to a user with role supervisor" }'),
];

const api3 = [
  h2('3.  Get Team Under a User'),
  endpointHeading('GET', '/admin/users/{id}/team', 'New endpoint'),
  para('Returns the direct team under a supervisor (their users) or under an AGM (their supervisors + total user count). Response shape differs based on the role of the user whose {id} is provided.'),
  para('Access: Admin, Superadmin, AGM (own team only), Supervisor (own team only)', GRAY),
  spacer(),
  h3('Path Parameters'),
  simpleTable(['Parameter', 'Type', 'Required'], [['id', 'integer', 'Yes']]),
  spacer(),
  ...labeledCode('Request', 'No body'),
  ...labeledCode('Response  200 OK  —  When called on a Supervisor',
`{
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
}`),
  ...labeledCode('Response  200 OK  —  When called on an AGM',
`{
  "user_id": 5,
  "user_name": "Priya Nair",
  "role": "agm",
  "supervisors": [
    {
      "id": 12,
      "name": "John Doe",
      "username": "john_doe",
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
      "role": "supervisor",
      "status": "active",
      "team_count": 4,
      "pending_approvals": 3,
      "compliance_rate": 85
    }
  ],
  "total_supervisors": 2,
  "total_users": 7
}`),
  ...labeledCode('Response  404 Not Found', '{ "error": "User not found" }'),
];

const api4 = [
  h2('4.  Send Targeted Notification'),
  endpointHeading('POST', '/notifications', 'New endpoint'),
  para('Sends a notification to a specific user by user_id. This is different from /notifications/broadcast which sends to everyone. Used by the approval flow to notify the submitting User and the AGM separately after a supervisor acts on an inspection.'),
  para('Access: Admin, Superadmin, System (triggered after approve/reject)', GRAY),
  spacer(),
  h3('Request Body Fields'),
  simpleTable(
    ['Field', 'Type', 'Required', 'Notes'],
    [
      ['user_id',        'integer', 'Yes', 'Recipient user ID'],
      ['title',          'string',  'Yes', 'Short heading shown in notification center'],
      ['message',        'string',  'Yes', 'Full notification message body'],
      ['type',           'string',  'Yes', 'inspection_approved | inspection_rejected | inspection_submitted | general'],
      ['reference_id',   'integer', 'No',  'ID of the related record (inspection ID, equipment ID)'],
      ['reference_type', 'string',  'No',  'inspection | equipment | work_order'],
    ]
  ),
  spacer(),
  ...labeledCode('Request Body',
`{
  "user_id": 22,
  "title": "Inspection Approved",
  "message": "Your inspection for SOS-FE-001 was approved by John Doe.",
  "type": "inspection_approved",
  "reference_id": 789,
  "reference_type": "inspection"
}`),
  ...labeledCode('Response  201 Created',
`{
  "id": 301,
  "user_id": 22,
  "title": "Inspection Approved",
  "message": "Your inspection for SOS-FE-001 was approved by John Doe.",
  "type": "inspection_approved",
  "reference_id": 789,
  "reference_type": "inspection",
  "is_read": false,
  "created_at": "2025-05-30T11:00:00Z"
}`),
  ...labeledCode('Response  404 Not Found', '{ "error": "Recipient user not found" }'),
];

const api5 = [
  h2('5.  Get Unread Notification Count'),
  endpointHeading('GET', '/notifications/unread-count', 'New endpoint'),
  para('Returns the unread notification count for the currently authenticated user. Used to display the badge number on the bell icon in the header. Scoped automatically to the logged-in user via JWT.'),
  para('Access: All roles', GRAY),
  spacer(),
  ...labeledCode('Request', 'No body'),
  ...labeledCode('Response  200 OK',
`{
  "unread_count": 4
}`),
];

const api6 = [
  h2('6.  Mark All Notifications as Read'),
  endpointHeading('PATCH', '/notifications/read-all', 'New endpoint'),
  para('Marks every unread notification for the logged-in user as read in one call. Used when the user clicks "Mark all as read" in the notification center. Scoped automatically to logged-in user via JWT.'),
  para('Access: All roles', GRAY),
  spacer(),
  ...labeledCode('Request', 'No body'),
  ...labeledCode('Response  200 OK',
`{
  "success": true,
  "marked_count": 4
}`),
];

const api7 = [
  h2('7.  Delete a Notification'),
  endpointHeading('DELETE', '/notifications/{id}', 'New endpoint'),
  para('Permanently removes a single notification. Used when the user dismisses a notification from the notification center. A user can only delete their own notifications.'),
  para('Access: All roles (own notifications only)', GRAY),
  spacer(),
  h3('Path Parameters'),
  simpleTable(['Parameter', 'Type', 'Required'], [['id', 'integer', 'Yes']]),
  spacer(),
  ...labeledCode('Request', 'No body'),
  ...labeledCode('Response  200 OK', '{ "success": true }'),
  ...labeledCode('Response  404 Not Found', '{ "error": "Notification not found" }'),
  ...labeledCode('Response  403 Forbidden', '{ "error": "You can only delete your own notifications" }'),
];

const api8 = [
  h2('8.  Inspection Reports — Additional Filters'),
  endpointHeading('GET', '/reports/inspections', 'Extend existing endpoint'),
  para('Add the following query parameters to the existing inspection reports endpoint. The backend should also automatically scope results based on the logged-in user\'s role — a supervisor should only see their team\'s inspections even without passing supervisor_id explicitly.'),
  para('Access: All roles (auto-scoped by role)', GRAY),
  spacer(),
  h3('New Query Parameters to Add'),
  simpleTable(
    ['Parameter', 'Type', 'Notes'],
    [
      ['supervisor_id', 'integer', 'Return only inspections under this supervisor\'s users'],
      ['agm_id',        'integer', 'Return inspections across all supervisors under this AGM'],
      ['submitted_by',  'integer', 'Return inspections submitted by a specific user ID'],
      ['status',        'string',  'PENDING | APPROVED | REJECTED'],
    ]
  ),
  note('Existing params start_date, end_date, module_id, sos_code remain unchanged.'),
  spacer(),
  ...labeledCode('Example Requests',
`GET /reports/inspections?supervisor_id=12&status=PENDING
GET /reports/inspections?agm_id=5&start_date=2025-05-01&end_date=2025-05-30
GET /reports/inspections?submitted_by=22`),
  ...labeledCode('Response  200 OK',
`{
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
}`),
];

const api9 = [
  h2('9.  Supervisor Dashboard'),
  endpointHeading('GET', '/dashboard/supervisor', 'New endpoint'),
  para('Returns all stats a supervisor needs on their home screen: pending approval count, team member activity, and weekly compliance. Automatically scoped to the logged-in supervisor via JWT — no ID parameter needed.'),
  para('Access: Supervisor only', GRAY),
  spacer(),
  ...labeledCode('Request', 'No body'),
  ...labeledCode('Response  200 OK',
`{
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
    }
  ]
}`),
];

const api10 = [
  h2('10.  AGM Dashboard'),
  endpointHeading('GET', '/dashboard/agm', 'New endpoint'),
  para('Returns the AGM\'s full team overview — supervisor-level compliance breakdown, total pending approvals across all teams, and weekly rejection rates. Automatically scoped to the logged-in AGM via JWT.'),
  para('Access: AGM only', GRAY),
  spacer(),
  ...labeledCode('Request', 'No body'),
  ...labeledCode('Response  200 OK',
`{
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
}`),
];

const api11 = [
  h2('11.  Approve Inspection — Extended Response'),
  endpointHeading('PATCH', '/inspections/{id}/approve', 'Extend existing endpoint'),
  para('The request body is unchanged. The response must additionally include submitted_by_id, agm_id, and sos_code so the frontend can trigger targeted notifications to the User and AGM without making a second API call.'),
  para('Access: Supervisor, Admin, Superadmin', GRAY),
  spacer(),
  h3('Path Parameters'),
  simpleTable(['Parameter', 'Type', 'Required'], [['id', 'integer', 'Yes']]),
  spacer(),
  ...labeledCode('Request Body  (unchanged)',
`{
  "remarks": "Inspection looks good. Approved."
}`),
  ...labeledCode('Response  200 OK  —  New fields highlighted',
`{
  "id": 789,
  "status": "APPROVED",
  "approval_status": "APPROVED",
  "approved_by_id": 12,
  "approved_by_name": "John Doe",
  "review_remarks": "Inspection looks good. Approved.",
  "approved_at": "2025-05-30T11:00:00Z",
  "submitted_by_id": 22,          ← NEW — needed to notify User
  "submitted_by_name": "Ravi Kumar",
  "agm_id": 5,                    ← NEW — needed to notify AGM
  "agm_name": "Priya Nair",
  "sos_code": "SOS-FE-001",       ← NEW — used in notification message
  "equipment_name": "Fire Extinguisher — Block A"
}`),
  note('submitted_by_id and agm_id must be in the response so the frontend can fire two POST /notifications calls immediately — one to the User, one to the AGM — without a follow-up GET request.'),
  ...labeledCode('Response  404 Not Found', '{ "error": "Inspection not found" }'),
  ...labeledCode('Response  400 Bad Request', '{ "error": "Inspection is already approved" }'),
];

const api12 = [
  h2('12.  Reject Inspection — Extended Response'),
  endpointHeading('PATCH', '/inspections/{id}/reject', 'Extend existing endpoint'),
  para('Same logic as approve — the response must include submitted_by_id, agm_id, and sos_code so the frontend can fire targeted notifications without a second API call.'),
  para('Access: Supervisor, Admin, Superadmin', GRAY),
  spacer(),
  h3('Path Parameters'),
  simpleTable(['Parameter', 'Type', 'Required'], [['id', 'integer', 'Yes']]),
  spacer(),
  ...labeledCode('Request Body  (unchanged)',
`{
  "reason": "Safety pin missing. Re-inspect after fixing."
}`),
  ...labeledCode('Response  200 OK  —  New fields highlighted',
`{
  "id": 789,
  "status": "REJECTED",
  "approval_status": "REJECTED",
  "rejected_by_id": 12,
  "rejected_by_name": "John Doe",
  "rejection_reason": "Safety pin missing. Re-inspect after fixing.",
  "rejected_at": "2025-05-30T11:05:00Z",
  "submitted_by_id": 22,          ← NEW — needed to notify User
  "submitted_by_name": "Ravi Kumar",
  "agm_id": 5,                    ← NEW — needed to notify AGM
  "agm_name": "Priya Nair",
  "sos_code": "SOS-FE-001",       ← NEW — used in notification message
  "equipment_name": "Fire Extinguisher — Block A"
}`),
  note('submitted_by_id and agm_id must be in the response so the frontend can fire two POST /notifications calls immediately — one to the User, one to the AGM — without a follow-up GET request.'),
  ...labeledCode('Response  404 Not Found', '{ "error": "Inspection not found" }'),
  ...labeledCode('Response  400 Bad Request', '{ "error": "Inspection is already rejected" }'),
];

const flowSection = [
  h1('Notification Flow Reference'),
  para('This shows how the frontend chains the above APIs together after a supervisor acts on an inspection.'),
  spacer(),
  h3('On Approve'),
  codePara(
`Supervisor clicks Approve
        │
        ▼
PATCH /inspections/{id}/approve
        │
        ▼
Response includes: submitted_by_id + agm_id + sos_code
        │
        ├──► POST /notifications
        │    { user_id: submitted_by_id, type: "inspection_approved" }
        │    → User sees: "Your inspection was approved ✅"
        │
        └──► POST /notifications
             { user_id: agm_id, type: "inspection_submitted" }
             → AGM sees: "Supervisor John Doe approved an inspection"`),
  spacer(),
  h3('On Reject'),
  codePara(
`Supervisor clicks Reject
        │
        ▼
PATCH /inspections/{id}/reject
        │
        ▼
Response includes: submitted_by_id + agm_id + sos_code
        │
        ├──► POST /notifications
        │    { user_id: submitted_by_id, type: "inspection_rejected" }
        │    → User sees: "Your inspection was rejected ❌  Reason: ..."
        │
        └──► POST /notifications
             { user_id: agm_id, type: "inspection_submitted" }
             → AGM sees: "Supervisor John Doe rejected an inspection"`),
  spacer(),
  h3('Notification Types Reference'),
  simpleTable(
    ['Type', 'Triggered When', 'Sent To'],
    [
      ['inspection_submitted', 'User submits a checklist',  'Supervisor'],
      ['inspection_approved',  'Supervisor approves',       'User  +  AGM'],
      ['inspection_rejected',  'Supervisor rejects',        'User  +  AGM'],
      ['general',              'Admin broadcasts a message', 'All / specific user'],
    ]
  ),
];

// ─── assemble & write ────────────────────────────────────────────────────────

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: 'Calibri', size: 20, color: DARK },
      },
    },
  },
  sections: [{
    properties: {
      page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } },
    },
    children: [
      ...coverPage,
      new Paragraph({ pageBreakBefore: true, children: [] }),
      ...overviewSection,
      new Paragraph({ pageBreakBefore: true, children: [] }),
      ...api1,
      ...api2,
      new Paragraph({ pageBreakBefore: true, children: [] }),
      ...api3,
      ...api4,
      new Paragraph({ pageBreakBefore: true, children: [] }),
      ...api5,
      ...api6,
      ...api7,
      new Paragraph({ pageBreakBefore: true, children: [] }),
      ...api8,
      new Paragraph({ pageBreakBefore: true, children: [] }),
      ...api9,
      ...api10,
      new Paragraph({ pageBreakBefore: true, children: [] }),
      ...api11,
      new Paragraph({ pageBreakBefore: true, children: [] }),
      ...api12,
      new Paragraph({ pageBreakBefore: true, children: [] }),
      ...flowSection,
    ],
  }],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync('../../docs/PENDING_APIS.docx', buffer);
console.log('Done — docs/PENDING_APIS.docx created');
