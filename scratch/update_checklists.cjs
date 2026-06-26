const fs = require('fs');

// 1. REPLACE THIS WITH YOUR ACTUAL BEARER TOKEN
// You can get this by logging into your web app, opening DevTools (F12) -> Network tab,
// doing any action, and copying the token from the "Authorization: Bearer ..." header.
const TOKEN = 'YOUR_BEARER_TOKEN_HERE';
const BASE_URL = 'https://ehs.garrev.com/app1/v1';

// 2. PASTE YOUR FULL JSON HERE
const data = {
    "module_id": 39,
    "module_code": "exit_sign",
    "module_name": "Exit Sign",
    "total_items": 22,
    "items": [
        {
            "id": 857,
            "item_order": 1,
            "category": "Physical Condition",
            "question": "Is the exit sign housing free from physical damage, cracks, missing parts, or discolouration? (NFPA 101 §7.10.1 / BS EN 1838 §5.1 / IS 9457)",
            "answer_type": "tna",
            "is_defect": false,
            "is_critical": true,
            "hints": null
        },
        {
            "id": 858,
            "item_order": 2,
            "category": "Physical Condition",
            "question": "Is the sign face, legend, and directional arrow clean, free from obstruction, and not deliberately covered, painted over, or defaced? (NFPA 101 §7.10.1.1 / BS EN 1838 §5.4 / OSHA 29 CFR 1910.37(b)(2))",
            "answer_type": "tna",
            "is_defect": false,
            "is_critical": true,
            "hints": null
        },
        {
            "id": 859,
            "item_order": 3,
            "category": "Physical Condition",
            "question": "Are all pictograms, text, and directional arrows clearly legible and unambiguous throughout the full approach distance — minimum letter height 152 mm (6 in) per NFPA 101 §7.10.1.1.1 or ISO 7010 E001–E004 symbol as approved? (NFPA 101 §7.10.1.1.1 / ISO 7010 E001–E004 / BS EN 1838 §5.4)",
            "answer_type": "tna",
            "is_defect": false,
            "is_critical": true,
            "hints": null
        }
        // ... PASTE THE REST OF YOUR 22 ITEMS HERE ...
    ]
};

async function updateChecklists() {
    if (TOKEN === 'YOUR_BEARER_TOKEN_HERE') {
        console.error("🚨 ERROR: Please update the TOKEN variable with your actual Bearer token before running.");
        return;
    }

    console.log(`Starting update for ${data.items.length} items...`);

    for (const item of data.items) {
        const payload = {
            question: item.question,
            category: item.category,
            is_critical: item.is_critical,
            item_order: item.item_order
        };

        try {
            const response = await fetch(`${BASE_URL}/admin/checklists/items/${item.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TOKEN}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                console.log(`✅ Successfully updated item ID: ${item.id}`);
            } else {
                const errorData = await response.text();
                console.error(`❌ Failed to update item ID: ${item.id}. Status: ${response.status}`, errorData);
            }
        } catch (error) {
            console.error(`🚨 Error updating item ID: ${item.id}`, error.message);
        }

        // Wait 300ms between requests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log("Finished updating checklists.");
}

updateChecklists();
