// Admin Dashboard JavaScript

// DOM Elements - Dashboard
const logoutBtn = document.getElementById('logoutBtn');
const totalChargersCount = document.getElementById('totalChargersCount');
const totalDivisionsCount = document.getElementById('totalDivisionsCount');
const openComplaintsCount = document.getElementById('openComplaintsCount');
const resolvedComplaintsCount = document.getElementById('resolvedComplaintsCount');
const recentComplaintsTable = document.getElementById('recentComplaintsTable');
const viewAllComplaintsLink = document.getElementById('viewAllComplaintsLink');

// DOM Elements - Complaints
const complaintsTable = document.getElementById('complaintsTable');
const statusFilter = document.getElementById('statusFilter');
const divisionFilter = document.getElementById('divisionFilter');
const typeFilter = document.getElementById('typeFilter');
const applyFilters = document.getElementById('applyFilters');
const resetFilters = document.getElementById('resetFilters');
const prevPage = document.getElementById('prevPage');
const nextPage = document.getElementById('nextPage');
const currentPage = document.getElementById('currentPage');
const totalPages = document.getElementById('totalPages');

// Global variables
let currentPageNum = 1;
let totalPagesNum = 1;
const itemsPerPage = 10;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    checkAuth();
    
    // Set up sidebar navigation
    setupSidebar();
    
    // Set up logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Load dashboard stats
    loadDashboardStats();
    
    // Load recent complaints
    loadRecentComplaints();
    
    // Set up complaints management
    if (viewAllComplaintsLink) {
        viewAllComplaintsLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('complaintsManagement');
            loadAllComplaints();
        });
    }
    
    // Set up filters
    if (applyFilters) {
        applyFilters.addEventListener('click', () => {
            currentPageNum = 1;
            loadAllComplaints();
        });
    }
    
    if (resetFilters) {
        resetFilters.addEventListener('click', () => {
            statusFilter.value = 'all';
            divisionFilter.value = 'all';
            typeFilter.value = 'all';
            currentPageNum = 1;
            loadAllComplaints();
        });
    }
    
    // Set up pagination
    if (prevPage) {
        prevPage.addEventListener('click', () => {
            if (currentPageNum > 1) {
                currentPageNum--;
                loadAllComplaints();
            }
        });
    }
    
    if (nextPage) {
        nextPage.addEventListener('click', () => {
            if (currentPageNum < totalPagesNum) {
                currentPageNum++;
                loadAllComplaints();
            }
        });
    }
    
    // Populate division filter if exists
    populateDivisionFilter();
});

// Check if user is authenticated
function checkAuth() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    
    // If not logged in or not admin, redirect to login
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }
}

// Handle logout
function handleLogout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Set up sidebar navigation
function setupSidebar() {
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.getAttribute('data-section');
            showSection(section);
        });
    });
}

// Show the selected section, hide others
function showSection(sectionName) {
    // Update active sidebar item
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
        if (item.getAttribute('data-section') === sectionName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Show selected section, hide others
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(section => {
        if (section.id === `${sectionName}Section`) {
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
        }
    });
    
    // Load data for the selected section
    if (sectionName === 'complaintsManagement') {
        loadAllComplaints();
    }
}

// Load dashboard stats
function loadDashboardStats() {
    // Get data from localStorage
    const chargers = JSON.parse(localStorage.getItem('chargers') || '[]');
    const divisions = JSON.parse(localStorage.getItem('divisions') || '[]');
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    
    // Calculate stats
    const openComplaints = complaints.filter(c => 
        c.status === 'Open' || c.status === 'In Progress'
    ).length;
    
    const resolvedComplaints = complaints.filter(c => c.status === 'Resolved').length;
    
    // Update UI
    if (totalChargersCount) totalChargersCount.textContent = chargers.length;
    if (totalDivisionsCount) totalDivisionsCount.textContent = divisions.length;
    if (openComplaintsCount) openComplaintsCount.textContent = openComplaints;
    if (resolvedComplaintsCount) resolvedComplaintsCount.textContent = resolvedComplaints;
}

// Load recent complaints for dashboard
function loadRecentComplaints() {
    if (!recentComplaintsTable) return;
    
    const tbody = recentComplaintsTable.querySelector('tbody');
    if (!tbody) return;
    
    // Clear table
    tbody.innerHTML = '';
    
    // Get complaints
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    
    // Sort by date (newest first) and take top 5
    const recentComplaints = complaints
        .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
        .slice(0, 5);
    
    if (recentComplaints.length === 0) {
        // Show no data message
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No complaints found</td></tr>';
        return;
    }
    
    // Add complaints to table
    recentComplaints.forEach(complaint => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${complaint.trackingId}</td>
            <td>${complaint.chargerID}</td>
            <td>${complaint.division || 'Unassigned'}</td>
            <td>${complaint.type}</td>
            <td><span class="status-badge ${getStatusClass(complaint.status)}">${complaint.status}</span></td>
            <td>${new Date(complaint.createdDate).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm btn-outline view-complaint-btn" data-id="${complaint.trackingId}">
                    View
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Add event listeners to view buttons
    const viewButtons = tbody.querySelectorAll('.view-complaint-btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const trackingId = btn.getAttribute('data-id');
            showComplaintDetails(trackingId);
        });
    });
}

// Populate division filter
function populateDivisionFilter() {
    if (!divisionFilter) return;
    
    // Clear all options except first
    while (divisionFilter.options.length > 1) {
        divisionFilter.remove(1);
    }
    
    // Get divisions
    const divisions = JSON.parse(localStorage.getItem('divisions') || '[]');
    
    // Add options
    divisions.forEach(division => {
        const option = document.createElement('option');
        option.value = division.name;
        option.textContent = division.name;
        divisionFilter.appendChild(option);
    });
}

// Load all complaints with filtering and pagination
function loadAllComplaints() {
    if (!complaintsTable) return;
    
    const tbody = complaintsTable.querySelector('tbody');
    if (!tbody) return;
    
    // Clear table
    tbody.innerHTML = '';
    
    // Get filter values
    const statusValue = statusFilter ? statusFilter.value : 'all';
    const divisionValue = divisionFilter ? divisionFilter.value : 'all';
    const typeValue = typeFilter ? typeFilter.value : 'all';
    
    // Get all complaints
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    
    // Apply filters
    let filteredComplaints = complaints;
    
    if (statusValue !== 'all') {
        filteredComplaints = filteredComplaints.filter(c => 
            c.status.toLowerCase() === statusValue.toLowerCase()
        );
    }
    
    if (divisionValue !== 'all') {
        filteredComplaints = filteredComplaints.filter(c => 
            c.division === divisionValue
        );
    }
    
    if (typeValue !== 'all') {
        filteredComplaints = filteredComplaints.filter(c => 
            c.type.toLowerCase().includes(typeValue.toLowerCase())
        );
    }
    
    // Sort by date (newest first)
    filteredComplaints.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
    
    // Calculate pagination
    totalPagesNum = Math.ceil(filteredComplaints.length / itemsPerPage);
    
    // Update pagination info
    if (currentPage) currentPage.textContent = currentPageNum;
    if (totalPages) totalPages.textContent = totalPagesNum;
    
    // Enable/disable pagination buttons
    if (prevPage) prevPage.disabled = currentPageNum <= 1;
    if (nextPage) nextPage.disabled = currentPageNum >= totalPagesNum;
    
    // Get complaints for the current page
    const startIndex = (currentPageNum - 1) * itemsPerPage;
    const pageComplaints = filteredComplaints.slice(startIndex, startIndex + itemsPerPage);
    
    if (pageComplaints.length === 0) {
        // Show no data message
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No complaints found</td></tr>';
        return;
    }
    
    // Add complaints to table
    pageComplaints.forEach(complaint => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${complaint.trackingId}</td>
            <td>${complaint.consumerName}</td>
            <td>${complaint.chargerID}</td>
            <td>${complaint.division || 'Unassigned'}</td>
            <td>${complaint.type}${complaint.subType ? ' - ' + complaint.subType : ''}</td>
            <td><span class="status-badge ${getStatusClass(complaint.status)}">${complaint.status}</span></td>
            <td>${new Date(complaint.createdDate).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm btn-outline view-complaint-btn" data-id="${complaint.trackingId}">
                    View
                </button>
                <button class="btn btn-sm btn-primary assign-complaint-btn" data-id="${complaint.trackingId}">
                    Assign
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Add event listeners to buttons
    const viewButtons = tbody.querySelectorAll('.view-complaint-btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const trackingId = btn.getAttribute('data-id');
            showComplaintDetails(trackingId);
        });
    });
    
    const assignButtons = tbody.querySelectorAll('.assign-complaint-btn');
    assignButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const trackingId = btn.getAttribute('data-id');
            showAssignComplaintModal(trackingId);
        });
    });
}

// Show complaint details modal
function showComplaintDetails(trackingId) {
    // Get complaint data
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const complaint = complaints.find(c => c.trackingId === trackingId);
    
    if (!complaint) {
        showToast('error', 'Complaint Not Found', 'The requested complaint could not be found');
        return;
    }
    
    // Create modal element if it doesn't exist
    let detailModal = document.getElementById('complaintDetailModal');
    if (!detailModal) {
        detailModal = document.createElement('div');
        detailModal.id = 'complaintDetailModal';
        detailModal.className = 'modal';
        document.body.appendChild(detailModal);
    }
    
    // Get charger info if available
    const chargers = JSON.parse(localStorage.getItem('chargers') || '[]');
    const charger = chargers.find(c => c.id === complaint.chargerID);
    const chargerLocation = charger ? charger.location : 'Unknown Location';
    
    // Generate modal HTML
    detailModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Complaint Details</h2>
                <button class="modal-close" id="closeDetailModal">×</button>
            </div>
            <div class="modal-body">
                <div class="complaint-header">
                    <div class="tracking-id">Tracking ID: <span class="highlight-text">${complaint.trackingId}</span></div>
                    <div class="tracking-status">Status: <span class="status-badge ${getStatusClass(complaint.status)}">${complaint.status}</span></div>
                </div>
                
                <div class="detail-section">
                    <h3>Complaint Information</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <div class="detail-label">Charger ID:</div>
                            <div class="detail-value">${complaint.chargerID}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Location:</div>
                            <div class="detail-value">${chargerLocation}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Division:</div>
                            <div class="detail-value">${complaint.division || 'Unassigned'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Issue Type:</div>
                            <div class="detail-value">${complaint.type}${complaint.subType ? ` - ${complaint.subType}` : ''}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Reported By:</div>
                            <div class="detail-value">${complaint.consumerName}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Contact:</div>
                            <div class="detail-value">${complaint.consumerPhone} / ${complaint.consumerEmail || 'N/A'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Submitted On:</div>
                            <div class="detail-value">${new Date(complaint.createdDate).toLocaleString()}</div>
                        </div>
                    </div>
                    
                    <div class="description-section">
                        <div class="detail-label">Description:</div>
                        <div class="detail-value description">${complaint.description}</div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>Timeline</h3>
                    <div class="tracking-timeline">
    `;
    
    // Add timeline events
    if (complaint.timeline && complaint.timeline.length > 0) {
        complaint.timeline.forEach(event => {
            const statusClass = 
                event.status.toLowerCase().includes('resolved') ? 'green' :
                event.status.toLowerCase().includes('progress') ? 'yellow' : 'blue';
            
            detailModal.innerHTML += `
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
        detailModal.innerHTML += `
            <div class="timeline-item">
                <div class="timeline-icon blue"></div>
                <div class="timeline-content">
                    <div class="timeline-title">Complaint Received</div>
                    <div class="timeline-date">${new Date(complaint.createdDate).toLocaleString()}</div>
                    <div class="timeline-description">Complaint has been registered in the system.</div>
                </div>
            </div>
        `;
    }
    
    // Complete modal HTML
    detailModal.innerHTML += `
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" id="assignFromDetailBtn" data-id="${complaint.trackingId}">Assign Complaint</button>
                <button class="btn btn-secondary" id="updateStatusBtn" data-id="${complaint.trackingId}">Update Status</button>
                <button class="btn btn-secondary" id="closeDetailBtn">Close</button>
            </div>
        </div>
    `;
    
    // Show modal
    detailModal.classList.add('active');
    
    // Add event listeners
    document.getElementById('closeDetailModal').addEventListener('click', () => {
        detailModal.classList.remove('active');
    });
    
    document.getElementById('closeDetailBtn').addEventListener('click', () => {
        detailModal.classList.remove('active');
    });
    
    document.getElementById('assignFromDetailBtn').addEventListener('click', () => {
        const id = document.getElementById('assignFromDetailBtn').getAttribute('data-id');
        detailModal.classList.remove('active');
        showAssignComplaintModal(id);
    });
    
    document.getElementById('updateStatusBtn').addEventListener('click', () => {
        const id = document.getElementById('updateStatusBtn').getAttribute('data-id');
        detailModal.classList.remove('active');
        showUpdateStatusModal(id);
    });
}

// Show assign complaint modal
function showAssignComplaintModal(trackingId) {
    // Get complaint data
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const complaintIndex = complaints.findIndex(c => c.trackingId === trackingId);
    
    if (complaintIndex === -1) {
        showToast('error', 'Complaint Not Found', 'The requested complaint could not be found');
        return;
    }
    
    // Create modal element if it doesn't exist
    let assignModal = document.getElementById('assignComplaintModal');
    if (!assignModal) {
        assignModal = document.createElement('div');
        assignModal.id = 'assignComplaintModal';
        assignModal.className = 'modal';
        document.body.appendChild(assignModal);
    }
    
    // Get divisions for dropdown
    const divisions = JSON.parse(localStorage.getItem('divisions') || '[]');
    let divisionOptions = '';
    
    divisions.forEach(division => {
        divisionOptions += `<option value="${division.name}">${division.name}</option>`;
    });
    
    // Generate modal HTML
    assignModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Assign Complaint</h2>
                <button class="modal-close" id="closeAssignModal">×</button>
            </div>
            <div class="modal-body">
                <form id="assignComplaintForm">
                    <div class="form-group">
                        <label for="assignDivision">Assign to Division</label>
                        <select id="assignDivision" name="assignDivision" required>
                            <option value="">Select Division</option>
                            ${divisionOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="assignNote">Assignment Note</label>
                        <textarea id="assignNote" name="assignNote" rows="3" placeholder="Add details about this assignment"></textarea>
                    </div>
                    <div class="form-group">
                        <div class="checkbox-label">
                            <input type="checkbox" id="updateToInProgress" name="updateToInProgress" checked>
                            <label for="updateToInProgress">Update status to "In Progress"</label>
                        </div>
                    </div>
                    <input type="hidden" id="complaintId" name="complaintId" value="${trackingId}">
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="cancelAssignBtn">Cancel</button>
                        <button type="submit" class="btn btn-primary">Assign Complaint</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Show modal
    assignModal.classList.add('active');
    
    // Add event listeners
    document.getElementById('closeAssignModal').addEventListener('click', () => {
        assignModal.classList.remove('active');
    });
    
    document.getElementById('cancelAssignBtn').addEventListener('click', () => {
        assignModal.classList.remove('active');
    });
    
    // Handle form submission
    document.getElementById('assignComplaintForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const divisionName = document.getElementById('assignDivision').value;
        const note = document.getElementById('assignNote').value;
        const updateStatus = document.getElementById('updateToInProgress').checked;
        
        // Validate
        if (!divisionName) {
            showToast('error', 'Selection Required', 'Please select a division');
            return;
        }
        
        // Update complaint
        const complaint = complaints[complaintIndex];
        complaint.division = divisionName;
        
        if (updateStatus) {
            complaint.status = 'In Progress';
        }
        
        // Add to timeline
        if (!complaint.timeline) {
            complaint.timeline = [];
        }
        
        complaint.timeline.push({
            status: updateStatus ? 'In Progress' : complaint.status,
            timestamp: new Date().toISOString(),
            description: `Complaint assigned to ${divisionName}${note ? ': ' + note : ''}`
        });
        
        complaint.lastUpdated = new Date().toISOString();
        
        // Save to localStorage
        localStorage.setItem('complaints', JSON.stringify(complaints));
        
        // Close modal
        assignModal.classList.remove('active');
        
        // Show success message
        showToast('success', 'Complaint Assigned', `Complaint has been assigned to ${divisionName}`);
        
        // Refresh data
        loadAllComplaints();
        loadRecentComplaints();
        loadDashboardStats();
    });
}

// Show update status modal
function showUpdateStatusModal(trackingId) {
    // Get complaint data
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const complaintIndex = complaints.findIndex(c => c.trackingId === trackingId);
    
    if (complaintIndex === -1) {
        showToast('error', 'Complaint Not Found', 'The requested complaint could not be found');
        return;
    }
    
    // Create modal element if it doesn't exist
    let statusModal = document.getElementById('updateStatusModal');
    if (!statusModal) {
        statusModal = document.createElement('div');
        statusModal.id = 'updateStatusModal';
        statusModal.className = 'modal';
        document.body.appendChild(statusModal);
    }
    
    const complaint = complaints[complaintIndex];
    
    // Define available statuses (exclude current status)
    const statuses = ['Open', 'In Progress', 'Resolved'];
    const availableStatuses = statuses.filter(status => 
        status !== complaint.status
    );
    
    // Generate status options
    let statusOptions = '';
    availableStatuses.forEach(status => {
        statusOptions += `<option value="${status}">${status}</option>`;
    });
    
    // Generate modal HTML
    statusModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Update Complaint Status</h2>
                <button class="modal-close" id="closeStatusModal">×</button>
            </div>
            <div class="modal-body">
                <form id="updateStatusForm">
                    <div class="form-group">
                        <label>Current Status:</label>
                        <span class="status-badge ${getStatusClass(complaint.status)}">${complaint.status}</span>
                    </div>
                    <div class="form-group">
                        <label for="newStatus">New Status</label>
                        <select id="newStatus" name="newStatus" required>
                            <option value="">Select New Status</option>
                            ${statusOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="statusNote">Status Note</label>
                        <textarea id="statusNote" name="statusNote" rows="3" placeholder="Add details about this status change"></textarea>
                    </div>
                    <input type="hidden" id="statusComplaintId" name="statusComplaintId" value="${trackingId}">
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="cancelStatusBtn">Cancel</button>
                        <button type="submit" class="btn btn-primary">Update Status</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Show modal
    statusModal.classList.add('active');
    
    // Add event listeners
    document.getElementById('closeStatusModal').addEventListener('click', () => {
        statusModal.classList.remove('active');
    });
    
    document.getElementById('cancelStatusBtn').addEventListener('click', () => {
        statusModal.classList.remove('active');
    });
    
    // Handle form submission
    document.getElementById('updateStatusForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newStatus = document.getElementById('newStatus').value;
        const note = document.getElementById('statusNote').value;
        
        // Validate
        if (!newStatus) {
            showToast('error', 'Selection Required', 'Please select a new status');
            return;
        }
        
        // Update complaint
        const complaint = complaints[complaintIndex];
        const oldStatus = complaint.status;
        complaint.status = newStatus;
        
        // Add to timeline
        if (!complaint.timeline) {
            complaint.timeline = [];
        }
        
        complaint.timeline.push({
            status: newStatus,
            timestamp: new Date().toISOString(),
            description: note || `Status changed from ${oldStatus} to ${newStatus}`
        });
        
        complaint.lastUpdated = new Date().toISOString();
        
        // Save to localStorage
        localStorage.setItem('complaints', JSON.stringify(complaints));
        
        // Close modal
        statusModal.classList.remove('active');
        
        // Show success message
        showToast('success', 'Status Updated', `Complaint status has been updated to ${newStatus}`);
        
        // Refresh data
        loadAllComplaints();
        loadRecentComplaints();
        loadDashboardStats();
    });
}

// Get CSS class for status badge
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