**Fire Extinguishers**

Amerex Corporation

Ansul

Kidde

Buckeye Fire Equipment

Ceasefire Industries

Minimax

NAFFCO

Strike First

Protec Fire Detection

UTC Fire \& Security

Hose Reels

NAFFCO

Angus Fire

Protek Manufacturing

Delta Fire

Ceasefire Industries

Newage Fire Protection equipment manufacturer"]

Shilla Fire

AWG Fittings

Rapidrop

HD Fire Protect

**Sprinklers**

Tyco Fire Protection Products

Victaulic

Reliable Automatic Sprinkler

Viking Group

Globe Fire Sprinkler

HD Fire Protect

Rapidrop

Johnson Controls

NAFFCO

Minimax

Fire Hydrants

AVK

Mueller

Kennedy Valve

Clow Valve

HD Fire Protect

NAFFCO

Rapidrop

Tyco Fire Protection Products

Newage Fire Protection

Minimax

Alarm Panels

Honeywell

Notifier

Siemens

Bosch

Edwards

Mircom

GST

Hochiki

Apollo Fire Detectors

Johnson Controls

Smoke Detectors

Honeywell

Apollo Fire Detectors

Hochiki

Siemens

Bosch

Notifier

Edwards

System Sensor

GST

Mircom

Heat Detectors

Honeywell

Apollo Fire Detectors

Hochiki

Siemens

Bosch

Notifier

Edwards

System Sensor

GST

Mircom

SCBA (Self-Contained Breathing Apparatus)

MSA Safety

Dräger

Scott Safety

Honeywell

Interspiro

Survitec

Avon Protection

Cam Lock

Shigematsu

Dräger India

First Aid Kits

3M

Johnson \& Johnson

Medline

First Aid Only

Reliance Medical

St John Ambulance

Ceasefire Industries

Safety First Aid

Hartmann

BSN Medical

Eye Wash Stations

Haws

Bradley Corporation

Speakman

Guardian Equipment

Encon Safety

Honeywell

Hughes Safety

Justrite

Surewerx

Ceasefire Industries

Emergency Showers

Haws

Bradley Corporation

Speakman

Guardian Equipment

Hughes Safety

Encon Safety

Honeywell

Justrite

Surewerx

Ceasefire Industries

PPE Stations

MSA Safety

Honeywell

3M

Dräger

Ansell

DuPont

Lakeland Industries

Kimberly-Clark Professional

Delta Plus

Uvex

CO2 Systems

Ansul

Kidde Fire Systems

Minimax

NAFFCO

Tyco Fire Protection Products

Johnson Controls

HD Fire Protect

Ceasefire Industries

Viking Group

Firetrace

Fire Blankets

Firechief

Thomas Glover

Kidde

Ceasefire Industries

Safelincs

Honeywell

Brady

Firexo

Jactone

Seton

CO Detectors

Honeywell

Kidde

First Alert

Siemens

Bosch

Apollo Fire Detectors

System Sensor

Hochiki

Mircom

Edwards

Fire Doors

ASSA ABLOY

Hormann

JELD-WEN

Tata Pravesh

Promat

Vetrotech

Novoferm

Teckentrup

Latham's Steel Doors

NAFFCO

























APIs Required for Equipment Onboarding

1\. GET /admin/companies

When: Page load (Step 1 — company grid)





Response:

\[

&#x20; {

&#x20;   id: 12,

&#x20;   name: "Garrev Industries",

&#x20;   company\_ref: "GRV-001",

&#x20;   address: "Hyderabad",

&#x20;   logo\_url: "/uploads/logo.png"

&#x20; }

]

2\. GET /admin/modules?company\_id=12

When: Company selected (Step 2 — module dropdown)





Response:

\[

&#x20; { id: 3, name: "Fire Extinguisher", is\_active: 1 },

&#x20; { id: 7, name: "CO Detector",       is\_active: 1 }

]

Tell backend: filter only modules assigned to that company, not all global modules.



3\. GET /branches?company\_id=12

When: Company selected (Step 3 — Branch dropdown)





Response:

\[

&#x20; { id: 101, branch\_name: "Hyderabad HQ" },

&#x20; { id: 102, branch\_name: "Pune Office" }

]

4\. GET /buildings?branch\_id=101

When: Branch selected (Step 3 — Building dropdown)





Response:

\[

&#x20; { id: 201, building\_name: "Block A" },

&#x20; { id: 202, building\_name: "Block B" }

]

5\. GET /floors?building\_id=201

When: Building selected (Step 3 — Floor dropdown)





Response:

\[

&#x20; { id: 301, floor\_name: "Ground Floor" },

&#x20; { id: 302, floor\_name: "First Floor" }

]

6\. GET /zones?floor\_id=301

When: Floor selected (Step 3 — Zone dropdown)





Response:

\[

&#x20; { id: 401, zone\_name: "North Wing" },

&#x20; { id: 402, zone\_name: "South Wing" }

]

7\. GET /departments?zone\_id=401

When: Zone selected (Step 3 — Department dropdown, optional)





Response:

\[

&#x20; { id: 501, department\_name: "Production" },

&#x20; { id: 502, department\_name: "Maintenance" }

]

8\. POST /equipment — the main submit

When: Step 4 — user certifies and clicks Submit





Request body:

{

&#x20; "serial\_number": "FE-2025-501",

&#x20; "module\_id": 3,

&#x20; "equipment\_type": "Fire Extinguisher",

&#x20; "manufacturer\_name": "Tyco",

&#x20; "company\_id": 12,



&#x20; "location\_id": 101,

&#x20; "building\_id": 201,

&#x20; "floor\_id": 301,

&#x20; "zone\_id": 401,

&#x20; "department\_id": 501,

&#x20; "exact\_location\_description": "Left wall, Block B exit",

&#x20; "latitude": 17.385044,

&#x20; "longitude": 78.486671,

&#x20; "geo\_accuracy\_m": 4,



&#x20; "details": {

&#x20;   "barcode": "FE-2025-501",

&#x20;   "equipment\_code": "FE-2025-501",

&#x20;   "extinguisher\_type": "ABC DCP",

&#x20;   "capacity\_kg": 9,

&#x20;   "pressure\_status": "OK",

&#x20;   "body\_status": "OK",

&#x20;   "hose\_status": "OK",

&#x20;   "pin\_seal\_status": "OK"

&#x20; },



&#x20; "installed\_on": "01-06-2025",

&#x20; "last\_service\_on": "01-06-2025",

&#x20; "expiry\_date": "01-06-2030",

&#x20; "operational\_status": "active",

&#x20; "remarks": null,



&#x20; "auto\_generate\_qr": true,

&#x20; "fda\_21\_cfr\_part\_11\_certified": true

}



Response (success):

{

&#x20; "id": 890,

&#x20; "sos\_code": "SOS-FE-2025-501",

&#x20; "qr\_url": "https://ehs.garrev.com/qr/SOS-FE-2025-501.png",

&#x20; "message": "Equipment onboarded successfully"

}

9\. GET /equipment/:sos\_code

When: Immediately after POST succeeds — used to verify the record was saved and show the success screen.





Response: full equipment record (same as what stats detail views fetch)

Must include: latitude, longitude, geo\_accuracy\_m, exact\_location\_description,

&#x20;             location\_id, building\_id, floor\_id, zone\_id, department\_id

What to ask the backend team

\#	Question

1	Does GET /admin/modules?company\_id=X filter modules by what's assigned to that company, or does it return all modules?

2	Are latitude, longitude, geo\_accuracy\_m, exact\_location\_description columns already on the equipment table? If not, add them.

3	Does POST /equipment accept a details JSONB field for equipment-type-specific attributes?

4	Dates — does the backend expect DD-MM-YYYY or YYYY-MM-DD? (Frontend currently sends DD-MM-YYYY)

5	Does GET /equipment/:sos\_code return latitude, longitude, geo\_accuracy\_m in the response?

6	What are the valid values for operational\_status? (Frontend sends: active, inactive, under\_maintenance, decommissioned)



