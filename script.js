/**
 * Campus Smart Service Portal — script.js
 * ─────────────────────────────────────────
 * Handles:
 *  • Form submission → POST API request
 *  • Dynamic table rendering on view page → GET API request
 *  • Navbar scroll effect on home page
 *  • Toast notifications
 */

// ─── Constants ───────────────────────
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
    ? 'http://localhost:3000/api' 
    : 'https://campus-portal-api-qqj6.onrender.com/api'; // Live Render backend

// ─── Helpers ─────────────────────────
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// ─── Toast Notification ─────────────
function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = '✅ ' + message;
    document.body.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) toast.remove();
    }, 3200);
}

function showErrorToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = '❌ ' + message;
    toast.style.background = 'rgba(239, 68, 68, 0.9)'; // Red
    document.body.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) toast.remove();
    }, 3200);
}

// ─── Badge Class Mapping ────────────
function getBadgeClass(category) {
    const map = {
        'WiFi': 'badge-wifi',
        'Hostel': 'badge-hostel',
        'Canteen': 'badge-canteen',
        'Classroom': 'badge-classroom'
    };
    return map[category] || '';
}

// ─── Navbar Scroll Effect (Home Page) ───
const navbar = document.getElementById('mainNav');
if (navbar && !navbar.classList.contains('scrolled')) {
    window.addEventListener('scroll', function () {
        if (window.scrollY > 60) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// ─── Submit Page: Form Handler ──────
const form = document.getElementById('requestForm');
if (form) {
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Validate basic fields
        const name = document.getElementById('name').value.trim();
        const category = document.getElementById('category').value;
        const issue = document.getElementById('issue').value.trim();

        if (!name || !category || !issue) return;

        // Use FormData to send all fields + file
        const formData = new FormData(form);

        const btn = document.getElementById('submitBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '🚀 Submitting...';
        btn.style.pointerEvents = 'none';

        try {
            const response = await fetch(`${API_URL}/requests`, {
                method: 'POST',
                body: formData // multer handles multipart/form-data directly
            });

            if (!response.ok) {
                throw new Error('Failed to submit request');
            }

            form.reset();
            showToast('Request submitted successfully!');

            // Redirect to view page after a short delay
            setTimeout(function () {
                window.location.href = 'view.html';
            }, 1500);

        } catch(err) {
            showErrorToast('Error saving request. Is the server running?');
            btn.innerHTML = originalText;
            btn.style.pointerEvents = 'auto';
        }
    });
}

// ─── View Page: Table Renderer ──────
const tbody = document.getElementById('requestsBody');
const emptyState = document.getElementById('emptyState');
const tableWrap = document.getElementById('tableWrap');

if (tbody) {
    // Fetch requests dynamically
    async function loadRequests() {
        try {
            const response = await fetch(`${API_URL}/requests`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch requests');
            }

            const requests = await response.json();

            if (requests.length === 0) {
                if (tableWrap) tableWrap.style.display = 'none';
                if (emptyState) emptyState.style.display = 'block';
            } else {
                if (emptyState) emptyState.style.display = 'none';
                if (tableWrap) tableWrap.style.display = 'block';

                tbody.innerHTML = ''; // clear out

                requests.forEach(function (req, index) {
                    const row = document.createElement('tr');
                    
                    // Add badge class logic, and small image preview if uploaded
                    let imageHTML = '';
                    if (req.image) {
                        const BASE_SERVER_URL = API_URL.replace('/api', '');
                        imageHTML = ` <br/><a href="${BASE_SERVER_URL}/uploads/${req.image}" target="_blank" style="font-size: 12px; color: #3b82f6;">📎 View Evidence</a>`;
                    }

                    row.innerHTML =
                        '<td>' + (index + 1) + '</td>' +
                        '<td>' + escapeHTML(req.name) + '</td>' +
                        '<td><span class="badge ' + getBadgeClass(req.category) + '">' + escapeHTML(req.category) + '</span></td>' +
                        '<td>' + escapeHTML(req.issue) + imageHTML + '</td>';
                    tbody.appendChild(row);
                });
            }

        } catch(err) {
            console.error(err);
            if (tableWrap) tableWrap.style.display = 'none';
            if (emptyState) {
                emptyState.style.display = 'block';
                emptyState.querySelector('h2').textContent = 'Error loading requests.';
                emptyState.querySelector('p').textContent = 'Make sure the Node.js server is running on port 3000.';
            }
        }
    }

    loadRequests();
}

const yearSelect = document.getElementById("year");
const hostelSelect = document.getElementById("hostel");

if (yearSelect && hostelSelect) {

    const hostels = {
        "1": [
            "Father Duraisamy Residency",
            "Edward George Residency"
        ],
        "2": [
            "Angelina Residency",
            "Hephzibah Residency"
        ],
        "3": [
            "Jerry Manuel Residency",
            "S G Bobraj Residency"
        ],
        "4": [
            "Bethany Residency",
            "Johnson Victor Residency"
        ]
    };

    yearSelect.addEventListener("change", function () {
        const selectedYear = this.value;

        hostelSelect.innerHTML = `<option disabled selected>Select hostel</option>`;

        hostels[selectedYear].forEach(hostel => {
            const option = document.createElement("option");
            option.value = hostel;
            option.textContent = hostel;
            hostelSelect.appendChild(option);
        });
    });

}
const categorySelect = document.getElementById("category");
const evidenceField = document.getElementById("evidence");
const evidenceWrap = evidenceField ? evidenceField.parentElement : null;

if (categorySelect && evidenceWrap) {
    // hide initially
    evidenceWrap.style.display = "none";

    categorySelect.addEventListener("change", function () {
        if (this.value === "Ragging") {
            evidenceWrap.style.display = "block";
        } else {
            evidenceWrap.style.display = "none";
        }
    });
}
