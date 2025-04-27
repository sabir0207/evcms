// Consumer Page JavaScript

// DOM Elements
const manualEntryTab = document.getElementById('manualEntryTab');
const scanQrTab = document.getElementById('scanQrTab');
const qrScannerSection = document.getElementById('qrScannerSection');
const complaintFormSection = document.getElementById('complaintFormSection');
const consumerComplaintForm = document.getElementById('consumerComplaintForm');
const complaintConfirmationModal = document.getElementById('complaintConfirmationModal');
const complaintType = document.getElementById('complaintType');
const subIssueContainer = document.getElementById('subIssueContainer');
const subIssueType = document.getElementById('subIssueType');
const stationId = document.getElementById('stationId');
const chargerInfoDisplay = document.getElementById('chargerInfoDisplay');
const chargerLocationInfo = document.getElementById('chargerLocationInfo');

// Global variables
let qrScannerInterval = null;

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    setupComplaintForm();
    setupQRScanner();
    setupConfirmationModal();
});

// Setup tab switching
function setupTabs() {
    if (manualEntryTab && scanQrTab) {
        manualEntryTab.addEventListener('click', () => {
            manualEntryTab.classList.add('active');
            scanQrTab.classList.remove('active');
            complaintFormSection.classList.remove('hidden');
            qrScannerSection.classList.add('hidden');
            
            // Stop scanner if running
            stopQRScanner();
        });
        
        scanQrTab.addEventListener('click', () => {
            scanQrTab.classList.add('active');
            manualEntryTab.classList.remove('active');
            qrScannerSection.classList.remove('hidden');
            complaintFormSection.classList.add('hidden');
            
            // Start scanner
            startQRScanner();
        });
    }
    
    // Cancel scan button
    const cancelScanBtn = document.getElementById('cancelScanBtn');
    if (cancelScanBtn) {
        cancelScanBtn.addEventListener('click', () => {
            manualEntryTab.click();
        });
    }
}

// Complaint form functionality
function setupComplaintForm() {
    // Load sub-issues on complaint type change
    if (complaintType) {
        complaintType.addEventListener('change', () => {
            const selectedType = complaintType.value;
            if (selectedType) {
                loadSubIssues(selectedType);
            } else {
                subIssueContainer.classList.add('hidden');
            }
        });
    }
    
    // Auto-detect charger on station ID entry
    if (stationId) {
        stationId.addEventListener('input', debounce(function() {
            const id = stationId.value.trim();
            if (id.length >= 4) {
                fetchChargerInfo(id);
            } else {
                chargerInfoDisplay.classList.add('hidden');
            }
        }, 500));
    }
    
    // Handle form submission
    if (consumerComplaintForm) {
        consumerComplaintForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Collect form data
            const formData = {
                stationId: stationId.value.trim(),
                name: document.getElementById('consumerName').value.trim(),
                phone: document.getElementById('consumerPhone').value.trim(),
                email: document.getElementById('consumerEmail').value.trim() || 'Not provided',
                type: complaintType.options[complaintType.selectedIndex].text,
                subType: subIssueType && !subIssueContainer.classList.contains('hidden') 
                    ? subIssueType.options[subIssueType.selectedIndex].text 
                    : '',
                description: document.getElementById('complaintDescription').value.trim()
            };
            
            // Basic validation
            if (!formData.stationId || !formData.name || !formData.phone || !formData.type) {
                showToast('error', 'Form Error', 'Please fill all required fields');
                return;
            }
            
            // Validate phone number
            const phoneRegex = /^\+?[0-9]{10,15}$/;
            if (!phoneRegex.test(formData.phone.replace(/[\s-]/g, ''))) {
                showToast('error', 'Invalid Phone Number', 'Please enter a valid phone number (10-15 digits)');
                return;
            }
            
            // Save complaint
            saveComplaint(formData);
        });
    }
}

// Fetch charger information
function fetchChargerInfo(chargerId) {
    const chargers = JSON.parse(localStorage.getItem('chargers') || '[]');
    const charger = chargers.find(c => c.id === chargerId);
    
    if (charger) {
        chargerLocationInfo.textContent = charger.location || 'Unknown Location';
        chargerInfoDisplay.classList.remove('hidden');
        
        // Store division for auto-assignment (hidden field)
        const divisionHidden = document.getElementById('chargerDivisionHidden') || document.createElement('input');
        divisionHidden.type = 'hidden';
        divisionHidden.id = 'chargerDivisionHidden';
        divisionHidden.value = charger.division || '';
        
        if (!document.getElementById('chargerDivisionHidden')) {
            consumerComplaintForm.appendChild(divisionHidden);
        }
    } else {
        chargerLocationInfo.textContent = 'Unknown Charger';
        chargerInfoDisplay.classList.remove('hidden');
    }
}

// QR Scanner functionality
function setupQRScanner() {
    // Setup cancel scan button
    const cancelScanBtn = document.getElementById('cancelScanBtn');
    if (cancelScanBtn) {
        cancelScanBtn.addEventListener('click', () => {
            stopQRScanner();
            manualEntryTab.click();
        });
    }
}

function startQRScanner() {
    const videoElem = document.getElementById('qrVideo');
    if (!videoElem) return;
    
    // Request camera access
    navigator.mediaDevices.getUserMedia({ 
        video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
        } 
    })
    .then(stream => {
        videoElem.srcObject = stream;
        videoElem.setAttribute('playsinline', true); // Required for iPhone
        videoElem.play();
        
        // Start scanning
        qrScannerInterval = setInterval(() => {
            scanQRCode(videoElem);
        }, 500);
    })
    .catch(err => {
        console.error('Error accessing camera:', err);
        showToast('error', 'Camera Error', 'Could not access your camera. Please check permissions.');
        manualEntryTab.click();
    });
}

function scanQRCode(videoElem) {
    if (!videoElem || !videoElem.videoWidth) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = videoElem.videoWidth;
    canvas.height = videoElem.videoHeight;
    
    // Draw video frame to canvas
    ctx.drawImage(videoElem, 0, 0, canvas.width, canvas.height);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Check if jsQR is available
    if (typeof jsQR === 'function') {
        // Scan for QR code
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert"
        });
        
        if (code) {
            // QR code detected
            console.log('QR Code detected:', code.data);
            
            // Check if it's a valid charger ID format
            if (isValidChargerID(code.data)) {
                stopQRScanner();
                
                // Set the value in the input and switch to form
                stationId.value = code.data;
                fetchChargerInfo(code.data);
                manualEntryTab.click();
                
                showToast('success', 'QR Code Detected', `Charger ID: ${code.data}`);
            }
        }
    }
}

function stopQRScanner() {
    clearInterval(qrScannerInterval);
    qrScannerInterval = null;
    
    const videoElem = document.getElementById('qrVideo');
    if (videoElem && videoElem.srcObject) {
        const tracks = videoElem.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoElem.srcObject = null;
    }
}

function isValidChargerID(id) {
    // Basic check if the ID format is valid (e.g., "EVC-1234")
    return /^[A-Za-z]+-[A-Za-z0-9]+$/.test(id);
}

// Load sub-issues for complaint types
function loadSubIssues(issueType) {
    if (!subIssueSelect || !subIssueContainer) return;
    
    // Clear existing options
    subIssueSelect.innerHTML = '';
    
    // Define sub-issues
    const subIssues = {
        'charger_not_working': [
            'No power', 'Won\'t start charging', 'Stops unexpectedly', 'Error on display'
        ],
        'display_issue': [
            'Blank screen', 'Frozen display', 'Error messages', 'Unreadable display'
        ],
        'connector_problem': [
            'Physical damage', 'Won\'t lock', 'Cable issues', 'Connector broken'
        ],
        'payment_problem': [
            'Card declined', 'Double charged', 'No receipt', 'Payment not processing'
        ],
        'charging_slow': [
            'Very slow charging', 'Charging below rated power', 'Inconsistent charging speed'
        ],
        'charging_interrupted': [
            'Cuts off randomly', 'Safety disconnect', 'Network disconnection'
        ],
        'billing_issue': [
            'Incorrect amount', 'Not billed', 'Receipt issues', 'Refund request'
        ],
        'error_code': [
            'Error code displayed', 'System error', 'Connection error', 'Hardware error'
        ],
        'physical_damage': [
            'Vandalism', 'Weather damage', 'Cover broken', 'Screen damaged'
        ],
        'other': ['General issue', 'Other problem', 'Feedback', 'Suggestion']
    };
    
    // Get sub-issues for selected type
    const issues = subIssues[issueType] || [];
    
    if (issues.length > 0) {
        issues.forEach(issue => {
            const option = document.createElement('option');
            option.value = issue.toLowerCase().replace(/\s+/g, '_');
            option.textContent = issue;
            subIssueType.appendChild(option);
        });
        
        subIssueContainer.classList.remove('hidden');
    } else {
        subIssueContainer.classList.add('hidden');
    }
}

// Save complaint to localStorage
function saveComplaint(formData) {
    // Get existing complaints
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    
    // Get division from hidden field if it exists
    const divisionHidden = document.getElementById('chargerDivisionHidden');
    const division = divisionHidden ? divisionHidden.value : '';
    
    // Check if the charger exists and get its location
    const chargers = JSON.parse(localStorage.getItem('chargers') || '[]');
    const charger = chargers.find(c => c.id === formData.stationId);
    let chargerLocation = '';
    
    if (charger) {
        chargerLocation = charger.location || '';
    }
    
    // Generate tracking ID with date format: CP-YYYYMMDD-XXX (XXX is random 3-digit number)
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randomPart = Math.floor(Math.random() * 900 + 100); // Random 3-digit number
    const trackingId = `CP-${datePart}-${randomPart}`;
    
    // Create complaint object
    const newComplaint = {
        trackingId,
        chargerID: formData.stationId,
        location: chargerLocation,
        division: division,
        type: formData.type,
        subType: formData.subType,
        status: 'Open',
        consumerName: formData.name,
        consumerPhone: formData.phone,
        consumerEmail: formData.email,
        description: formData.description,
        createdDate: now.toISOString(),
        lastUpdated: now.toISOString(),
        timeline: [
            {
                status: 'Complaint Received',
                timestamp: now.toISOString(),
                description: 'Complaint has been registered in the system.'
            }
        ]
    };
    
    // Add auto-assignment note to timeline if division exists
    if (division) {
        newComplaint.timeline.push({
            status: 'Assigned to Division',
            timestamp: now.toISOString(),
            description: `Complaint automatically assigned to ${division}`
        });
    }
    
    // Add to complaints array
    complaints.push(newComplaint);
    
    // Save back to localStorage
    localStorage.setItem('complaints', JSON.stringify(complaints));
    
    // Show confirmation modal
    showConfirmation(trackingId);
}

// Show confirmation modal
function showConfirmation(trackingId) {
    document.getElementById('generatedTrackingId').textContent = trackingId;
    complaintConfirmationModal.classList.add('active');
}

// Setup confirmation modal
function setupConfirmationModal() {
    const closeConfirmationModal = document.getElementById('closeConfirmationModal');
    const closeConfirmation = document.getElementById('closeConfirmation');
    const closeAndTrack = document.getElementById('closeAndTrack');
    
    if (closeConfirmationModal) {
        closeConfirmationModal.addEventListener('click', () => {
            complaintConfirmationModal.classList.remove('active');
        });
    }
    
    if (closeConfirmation) {
        closeConfirmation.addEventListener('click', () => {
            complaintConfirmationModal.classList.remove('active');
            // Reset form
            consumerComplaintForm.reset();
            chargerInfoDisplay.classList.add('hidden');
        });
    }
    
    if (closeAndTrack) {
        closeAndTrack.addEventListener('click', () => {
            complaintConfirmationModal.classList.remove('active');
            // Redirect to tracking page
            window.location.href = 'index.html?track=true&phone=' + encodeURIComponent(document.getElementById('consumerPhone').value);
        });
    }
}

// Utility: Debounce function to limit input event frequency
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// Show toast notification
function showToast(type, title, message, duration = 3000) {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconClass = 
        type === 'success' ? 'fa-check-circle' : 
        type === 'error' ? 'fa-times-circle' : 
        type === 'warning' ? 'fa-exclamation-circle' : 'fa-info-circle';
    
    toast.innerHTML = `
        <i class="fas ${iconClass} toast-icon ${type}"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">×</button>
    `;
    
    toastContainer.appendChild(toast);
    
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.remove();
    });
    
    setTimeout(() => {
        toast.remove();
    }, duration);
}

// Create toast container if it doesn't exist
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}