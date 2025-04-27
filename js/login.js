// Login Page JavaScript

// DOM Elements
const loginTab = document.getElementById('loginTab');
const trackingTab = document.getElementById('trackingTab');
const loginForm = document.getElementById('loginForm');
const trackingForm = document.getElementById('trackingForm');
const userLoginForm = document.getElementById('userLoginForm');
const trackComplaintForm = document.getElementById('trackComplaintForm');
const trackingResultSection = document.getElementById('trackingResultSection');
const trackingResult = document.getElementById('trackingResult');

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    setupLoginTabs();
    setupFormSubmission();
    initializeAuthData();
});

// Tab switching functionality
function setupLoginTabs() {
    if (loginTab && trackingTab) {
        loginTab.addEventListener('click', () => {
            loginTab.classList.add('active');
            trackingTab.classList.remove('active');
            loginForm.classList.remove('hidden');
            trackingForm.classList.add('hidden');
            trackingResultSection.classList.add('hidden');
        });

        trackingTab.addEventListener('click', () => {
            trackingTab.classList.add('active');
            loginTab.classList.remove('active');
            trackingForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
        });
    }
}

// Handle form submissions
function setupFormSubmission() {
    // Login form submission
    if (userLoginForm) {
        userLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const userType = document.getElementById('userType').value;
            
            // Authenticate user
            const authenticated = authenticateUser(username, password, userType);
            
            if (authenticated) {
                // Set session data
                const sessionUser = {
                    username,
                    role: userType,
                    loginTime: new Date().toISOString()
                };
                sessionStorage.setItem('currentUser', JSON.stringify(sessionUser));
                
                // Redirect to appropriate dashboard
                switch (userType) {
                    case 'admin':
                        window.location.href = 'admin.html';
                        break;
                    case 'division':
                        window.location.href = 'division.html';
                        break;
                    case 'vendor':
                        window.location.href = 'vendor.html';
                        break;
                }
            } else {
                showToast('error', 'Login Failed', 'Invalid username or password');
            }
        });
    }
    
    // Tracking form submission
    if (trackComplaintForm) {
        trackComplaintForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const phoneNumber = document.getElementById('trackingId').value.trim();
            if (!phoneNumber) {
                showToast('error', 'Invalid Input', 'Please enter your phone number');
                return;
            }
            
            // Track complaints with phone number
            trackComplaintsByPhone(phoneNumber);
        });
    }
}

// Initialize authentication data
function initializeAuthData() {
    // If there are no users in localStorage, set up the default admin user
    if (!localStorage.getItem('users')) {
        const defaultUsers = {
            admin: [{ 
                username: 'admin', 
                password: 'admin123', 
                role: 'admin' 
            }],
            division: [],
            vendor: []
        };
        
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
    
    // Initialize other data collections if they don't exist
    if (!localStorage.getItem('complaints')) {
        localStorage.setItem('complaints', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('chargers')) {
        localStorage.setItem('chargers', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('divisions')) {
        localStorage.setItem('divisions', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('vendors')) {
        localStorage.setItem('vendors', JSON.stringify([]));
    }
}

// Authenticate user
function authenticateUser(username, password, role) {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const userGroup = users[role] || [];
    
    const user = userGroup.find(u => 
        u.username === username && u.password === password
    );
    
    return !!user;
}

// Track complaints by phone number
function trackComplaintsByPhone(phoneNumber) {
    // Get complaints from localStorage
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    
    // Find complaints matching the phone number
    const userComplaints = complaints.filter(c => 
        c.consumerPhone && c.consumerPhone.replace(/\D/g, '') === phoneNumber.replace(/\D/g, '')
    );
    
    if (userComplaints.length > 0) {
        // Sort by date (most recent first)
        userComplaints.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
        
        // Take up to 5 most recent complaints
        const recentComplaints = userComplaints.slice(0, 5);
        
        // Display results
        trackingResultSection.classList.remove('hidden');
        
        // Generate HTML for complaints
        let resultHTML = `
            <div class="tracking-header">
                <h3>Your Complaints (${recentComplaints.length})</h3>
                <p class="text-gray">Showing your ${recentComplaints.length} most recent complaints</p>
            </div>
            <div class="complaint-cards">
        `;
        
        recentComplaints.forEach(complaint => {
            resultHTML += `
                <div class="complaint-card">
                    <div class="complaint-card-header">
                        <div class="complaint-info">
                            <div class="complaint-id">Tracking ID: <span class="highlight-text">${complaint.trackingId}</span></div>
                            <div class="complaint-status">
                                <span class="status-badge ${getStatusClass(complaint.status)}">${complaint.status}</span>
                            </div>
                        </div>
                        <div class="complaint-date">${new Date(complaint.createdDate).toLocaleDateString()}</div>
                    </div>
                    <div class="complaint-card-content">
                        <div class="detail-row">
                            <div class="detail-label">Charger ID:</div>
                            <div class="detail-value">${complaint.chargerID}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Type:</div>
                            <div class="detail-value">${complaint.type}${complaint.subType ? ' - ' + complaint.subType : ''}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Description:</div>
                            <div class="detail-value">${complaint.description.substring(0, 100)}${complaint.description.length > 100 ? '...' : ''}</div>
                        </div>
                    </div>
                    <div class="complaint-card-footer">
                        <button class="btn btn-sm btn-outline view-timeline-btn" data-id="${complaint.trackingId}">
                            View Status <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        resultHTML += '</div>';
        trackingResult.innerHTML = resultHTML;
        
        // Add event listeners to timeline buttons
        const timelineButtons = document.querySelectorAll('.view-timeline-btn');
        timelineButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const trackingId = btn.getAttribute('data-id');
                showComplaintTimeline(trackingId);
            });
        });
    } else {
        showToast('error', 'No Complaints Found', 'We could not find any complaints associated with this phone number');
    }
}

// Show complaint timeline modal
function showComplaintTimeline(trackingId) {
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const complaint = complaints.find(c => c.trackingId === trackingId);
    
    if (!complaint) {
        showToast('error', 'Complaint Not Found', 'The requested complaint could not be found');
        return;
    }
    
    // Create modal element if it doesn't exist
    let timelineModal = document.getElementById('complaintTimelineModal');
    if (!timelineModal) {
        timelineModal = document.createElement('div');
        timelineModal.id = 'complaintTimelineModal';
        timelineModal.className = 'modal';
        document.body.appendChild(timelineModal);
    }
    
    // Generate timeline HTML
    let timelineHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Complaint Status</h2>
                <button class="modal-close" id="closeTimelineModal">×</button>
            </div>
            <div class="modal-body">
                <div class="tracking-header">
                    <div class="tracking-id">Tracking ID: <span class="highlight-text">${complaint.trackingId}</span></div>
                    <div class="tracking-status">Status: <span class="status-badge ${getStatusClass(complaint.status)}">${complaint.status}</span></div>
                </div>
                
                <div class="tracking-timeline">
    `;
    
    // Add timeline events
    if (complaint.timeline && complaint.timeline.length > 0) {
        complaint.timeline.forEach(event => {
            const statusClass = 
                event.status.toLowerCase().includes('resolved') ? 'green' :
                event.status.toLowerCase().includes('progress') ? 'yellow' : 'blue';
            
            timelineHTML += `
                <div class="timeline-item">
                    <div class="timeline-icon ${statusClass}"></div>
                    <div class="timeline-content">
                        <div class="timeline-title">${event.status}</div>
                        <div class="timeline-date">${new Date(event.timestamp).toLocaleString()}</div>
                        <div class="timeline-description">${event.description}</div>
                    </div>
                </div>
            `;
        });
    } else {
        timelineHTML += `
            <div class="timeline-item">
                <div class="timeline-icon blue"></div>
                <div class="timeline-content">
                    <div class="timeline-title">Complaint Received</div>
                    <div class="timeline-date">${new Date(complaint.createdDate).toLocaleString()}</div>
                    <div class="timeline-description">Your complaint has been registered in our system.</div>
                </div>
            </div>
        `;
    }
    
    timelineHTML += `
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" id="closeTimelineBtn">Close</button>
            </div>
        </div>
    `;
    
    timelineModal.innerHTML = timelineHTML;
    timelineModal.classList.add('active');
    
    // Add event listeners to close buttons
    document.getElementById('closeTimelineModal').addEventListener('click', () => {
        timelineModal.classList.remove('active');
    });
    document.getElementById('closeTimelineBtn').addEventListener('click', () => {
        timelineModal.classList.remove('active');
    });
}

// Get status badge class based on status
function getStatusClass(status) {
    if (!status) return '';
    
    switch (status.toLowerCase()) {
        case 'open':
            return 'red';
        case 'in progress':
            return 'yellow';
        case 'resolved':
            return 'green';
        default:
            return '';
    }
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