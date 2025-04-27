// Division Dashboard JavaScript

// DOM Elements - Dashboard
const logoutBtn = document.getElementById('logoutBtn');
const divisionUserName = document.getElementById('divisionUserName');
const divisionWelcomeName = document.getElementById('divisionWelcomeName');
const divTotalChargers = document.getElementById('divTotalChargers');
const divActiveChargers = document.getElementById('divActiveChargers');
const divOpenComplaints = document.getElementById('divOpenComplaints');
const divAssignedComplaints = document.getElementById('divAssignedComplaints');
const recentDivisionComplaintsTable = document.getElementById('recentDivisionComplaintsTable');
const viewAllDivisionComplaintsLink = document.getElementById('viewAllDivisionComplaintsLink');

// DOM Elements - Complaints Management
const divisionComplaintsTable = document.getElementById('divisionComplaintsTable');
const statusFilter = document.getElementById('statusFilter');
const typeFilter = document.getElementById('typeFilter');
const applyFilters = document.getElementById('applyFilters');
const resetFilters = document.getElementById('resetFilters');
const prevPage = document.getElementById('prevPage');
const nextPage = document.getElementById('nextPage');
const currentPage = document.getElementById('currentPage');
const totalPages = document.getElementById('totalPages');

// DOM Elements - Chargers Management
const divisionChargersTable = document.getElementById('divisionChargersTable');
const chargerStatusFilter = document.getElementById('chargerStatusFilter');
const chargerSearch = document.getElementById('chargerSearch');
const applyChargerFilters = document.getElementById('applyChargerFilters');
const resetChargerFilters = document.getElementById('resetChargerFilters');
const prevChargerPage = document.getElementById('prevChargerPage');
const nextChargerPage = document.getElementById('nextChargerPage');
const currentChargerPage = document.getElementById('currentChargerPage');
const totalChargerPages = document.getElementById('totalChargerPages');

// Global variables
let currentPageNum = 1;
let totalPagesNum = 1;
let currentChargerPageNum = 1;
let totalChargerPagesNum = 1;
const itemsPerPage = 10;
let currentDivision = null;

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
    if (viewAllDivisionComplaintsLink) {
        viewAllDivisionComplaintsLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('complaintsManagement');
            loadDivisionComplaints();
        });
    }
    
    // Set up filters
    if (applyFilters) {
        applyFilters.addEventListener('click', () => {
            currentPageNum = 1;
            loadDivisionComplaints();
        });
    }
    
    if (resetFilters) {
        resetFilters.addEventListener('click', () => {
            statusFilter.value = 'all';
            typeFilter.value = 'all';
            currentPageNum = 1;
            loadDivisionComplaints();
        });
    }
    
    // Set up charger filters
    if (applyChargerFilters) {
        applyChargerFilters.addEventListener('click', () => {
            currentChargerPageNum = 1;
            loadDivisionChargers();
        });
    }
    
    if (resetChargerFilters) {
        resetChargerFilters.addEventListener('click', () => {
            chargerStatusFilter.value = 'all';
            chargerSearch.value = '';
            currentChargerPageNum = 1;
            loadDivisionChargers();
        });
    }
    
    // Set up pagination
    if (prevPage) {
        prevPage.addEventListener('click', () => {
            if (currentPageNum > 1) {
                currentPageNum--;
                loadDivisionComplaints();
            }
        });
    }
    
    if (nextPage) {
        nextPage.addEventListener('click', () => {
            if (currentPageNum < totalPagesNum) {
                currentPageNum++;
                loadDivisionComplaints();
            }
        });
    }
    
    // Set up charger pagination
    if (prevChargerPage) {
        prevChargerPage.addEventListener('click', () => {
            if (currentChargerPageNum > 1) {
                currentChargerPageNum--;
                loadDivisionChargers();
            }
        });
    }
    
    if (nextChargerPage) {
        nextChargerPage.addEventListener('click', () => {
            if (currentChargerPageNum < totalChargerPagesNum) {
                currentChargerPageNum++;
                loadDivisionChargers();
            }
        });
    }
});

// Check if user is authenticated
function checkAuth() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    
    // If not logged in or not division, redirect to login
    if (!user || user.role !== 'division') {
        window.location.href = 'index.html';
        return;
    }
    
    // Set division name
    currentDivision = user.username;
    
    if (divisionUserName) divisionUserName.textContent = currentDivision;
    if (divisionWelcomeName) divisionWelcomeName.textContent = currentDivision;
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
        loadDivisionComplaints();
    } else if (sectionName === 'chargersManagement') {
        loadDivisionChargers();
    } else if (sectionName === 'vendorAssignment') {
        loadAvailableVendors();
        loadUnassignedComplaints();
    }
}

// Load dashboard stats
function loadDashboardStats() {
    if (!currentDivision) return;
    
    // Get data from localStorage
    const chargers = JSON.parse(localStorage.getItem('chargers') || '[]');
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    
    // Filter for this division
    const divisionChargers = chargers.filter(c => c.division === currentDivision);
    const divisionComplaints = complaints.filter(c => c.division === currentDivision);
    
    // Calculate stats
    const activeChargers = divisionChargers.filter(c => c.status === 'active').length;
    
    const openComplaints = divisionComplaints.filter(c => 
        c.status === 'Open' || c.status === 'In Progress'
    ).length;
    
    const assignedComplaints = divisionComplaints.filter(c => c.assignedTo).length;
    
    // Update UI
    if (divTotalChargers) divTotalChargers.textContent = divisionChargers.length;
    if (divActiveChargers) divActiveChargers.textContent = activeChargers;
    if (divOpenComplaints) divOpenComplaints.textContent = openComplaints;
    if (divAssignedComplaints) divAssignedComplaints.textContent = assignedComplaints;
}

// Load recent complaints for dashboard
function loadRecentComplaints() {
    if (!recentDivisionComplaintsTable || !currentDivision) return;
    
    const tbody = recentDivisionComplaintsTable.querySelector('tbody');
    if (!tbody) return;
    
    // Clear table
    tbody.innerHTML = '';
    
    // Get complaints for this division
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const divisionComplaints = complaints.filter(c => c.division === currentDivision);
    
    // Sort by date (newest first) and take top 5
    const recentComplaints = divisionComplaints
        .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
        .slice(0, 5);
    
    if (recentComplaints.length === 0) {
        // Show no data message
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No complaints found for your division</td></tr>';
        return;
    }
    
    // Add complaints to table
    recentComplaints.forEach(complaint => {
        // Get charger location if available
        const chargers = JSON.parse(localStorage.getItem('chargers') || '[]');
        const charger = chargers.find(c => c.id === complaint.chargerID);
        const location = charger ? charger.location : 'Unknown';
        
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${complaint.trackingId}</td>
            <td>${complaint.chargerID}</td>
            <td>${location}</td>
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

// Load all division complaints with filtering and pagination
function loadDivisionComplaints() {
    if (!divisionComplaintsTable || !currentDivision) return;
    
    const tbody = divisionComplaintsTable.querySelector('tbody');
    if (!tbody) return;
    
    // Clear table
    tbody.innerHTML = '';
    
    // Get filter values
    const statusValue = statusFilter ? statusFilter.value : 'all';
    const typeValue = typeFilter ? typeFilter.value : 'all';
    
    // Get all complaints for this division
    // Get all complaints for this division
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const divisionComplaints = complaints.filter(c => c.division === currentDivision);
    
    // Apply filters
    let filteredComplaints = divisionComplaints;
    
    if (statusValue !== 'all') {
        filteredComplaints = filteredComplaints.filter(c => 
            c.status.toLowerCase() === statusValue.toLowerCase()
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
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No complaints found for your division</td></tr>';
        return;
    }
    
    // Add complaints to table
    pageComplaints.forEach(complaint => {
        // Get charger location if available
        const chargers = JSON.parse(localStorage.getItem('chargers') || '[]');
        const charger = chargers.find(c => c.id === complaint.chargerID);
        const location = charger ? charger.location : 'Unknown';
        
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${complaint.trackingId}</td>
            <td>${complaint.chargerID}</td>
            <td>${location}</td>
            <td>${complaint.type}${complaint.subType ? ' - ' + complaint.subType : ''}</td>
            <td>${complaint.consumerName}</td>
            <td><span class="status-badge ${getStatusClass(complaint.status)}">${complaint.status}</span></td>
            <td>${complaint.assignedTo || 'Not Assigned'}</td>
            <td>${new Date(complaint.createdDate).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm btn-outline view-complaint-btn" data-id="${complaint.trackingId}">
                    View
                </button>
                ${!complaint.assignedTo && complaint.status !== 'Resolved' ? 
                  `<button class="btn btn-sm btn-primary assign-complaint-btn" data-id="${complaint.trackingId}">
                     Assign
                   </button>` : ''}
                ${complaint.status !== 'Resolved' ? 
                  `<button class="btn btn-sm btn-secondary update-status-btn" data-id="${complaint.trackingId}">
                     Update
                   </button>` : ''}
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
    
    const updateButtons = tbody.querySelectorAll('.update-status-btn');
    updateButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const trackingId = btn.getAttribute('data-id');
            showUpdateStatusModal(trackingId);
        });
    });
}

// Load division chargers with filtering and pagination
function loadDivisionChargers() {
    if (!divisionChargersTable || !currentDivision) return;
    
    const tbody = divisionChargersTable.querySelector('tbody');
    if (!tbody) return;
    
    // Clear table
    tbody.innerHTML = '';
    
    // Get filter values
    const statusValue = chargerStatusFilter ? chargerStatusFilter.value : 'all';
    const searchValue = chargerSearch ? chargerSearch.value.toLowerCase() : '';
    
    // Get all chargers for this division
    const chargers = JSON.parse(localStorage.getItem('chargers') || '[]');
    const divisionChargers = chargers.filter(c => c.division === currentDivision);
    
    // Apply filters
    let filteredChargers = divisionChargers;
    
    if (statusValue !== 'all') {
        filteredChargers = filteredChargers.filter(c => 
            c.status && c.status.toLowerCase() === statusValue.toLowerCase()
        );
    }
    
    if (searchValue) {
        filteredChargers = filteredChargers.filter(c => 
            (c.id && c.id.toLowerCase().includes(searchValue)) ||
            (c.location && c.location.toLowerCase().includes(searchValue))
        );
    }
    
    // Calculate pagination
    totalChargerPagesNum = Math.ceil(filteredChargers.length / itemsPerPage);
    
    // Update pagination info
    if (currentChargerPage) currentChargerPage.textContent = currentChargerPageNum;
    if (totalChargerPages) totalChargerPages.textContent = totalChargerPagesNum;
    
    // Enable/disable pagination buttons
    if (prevChargerPage) prevChargerPage.disabled = currentChargerPageNum <= 1;
    if (nextChargerPage) nextChargerPage.disabled = currentChargerPageNum >= totalChargerPagesNum;
    
    // Get chargers for the current page
    const startIndex = (currentChargerPageNum - 1) * itemsPerPage;
    const pageChargers = filteredChargers.slice(startIndex, startIndex + itemsPerPage);
    
    if (pageChargers.length === 0) {
        // Show no data message
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No chargers found for your division</td></tr>';
        return;
    }
    
    // Add chargers to table
    pageChargers.forEach(charger => {
        // Get open complaints count for this charger
        const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
        const openComplaints = complaints.filter(c => 
            c.chargerID === charger.id && 
            (c.status === 'Open' || c.status === 'In Progress')
        ).length;
        
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${charger.id}</td>
            <td>${charger.location || 'Unknown'}</td>
            <td>${charger.type || 'Standard'}</td>
            <td><span class="status-badge ${getChargerStatusClass(charger.status)}">${charger.status || 'Unknown'}</span></td>
            <td>${openComplaints}</td>
            <td>${charger.lastMaintenance ? new Date(charger.lastMaintenance).toLocaleDateString() : 'Never'}</td>
            <td>
                <button class="btn btn-sm btn-outline view-charger-btn" data-id="${charger.id}">
                    View
                </button>
                <button class="btn btn-sm btn-secondary update-charger-btn" data-id="${charger.id}">
                    Update
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Add event listeners to buttons
    const viewButtons = tbody.querySelectorAll('.view-charger-btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const chargerId = btn.getAttribute('data-id');
            showChargerDetails(chargerId);
        });
    });
    
    const updateButtons = tbody.querySelectorAll('.update-charger-btn');
    updateButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const chargerId = btn.getAttribute('data-id');
            showUpdateChargerModal(chargerId);
        });
    });
}

// Load available vendors for the division
function loadAvailableVendors() {
    const table = document.getElementById('availableVendorsTable');
    if (!table || !currentDivision) return;
    
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    
    // Clear table
    tbody.innerHTML = '';
    
    // Get vendors that service this division
    const vendors = JSON.parse(localStorage.getItem('vendors') || '[]');
    const availableVendors = vendors.filter(v => 
        v.serviceAreas && v.serviceAreas.includes(currentDivision)
    );
    
    if (availableVendors.length === 0) {
        // Show no data message
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No vendors available for this division yet.</td></tr>';
        return;
    }
    
    // Get complaints assigned to each vendor
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    
    // Add vendors to table
    availableVendors.forEach(vendor => {
        const assignedComplaints = complaints.filter(c => 
            c.assignedTo === vendor.name && 
            c.status !== 'Resolved'
        ).length;
        
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${vendor.name}</td>
            <td>${vendor.contactPerson}</td>
            <td>${vendor.email}</td>
            <td>${vendor.phone}</td>
            <td>${assignedComplaints}</td>
            <td><span class="status-badge ${vendor.status === 'active' ? 'green' : 'red'}">${vendor.status}</span></td>
        `;
        
        tbody.appendChild(row);
    });
}

// Load unassigned complaints for vendor assignment
function loadUnassignedComplaints() {
    const table = document.getElementById('unassignedComplaintsTable');
    if (!table || !currentDivision) return;
    
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    
    // Clear table
    tbody.innerHTML = '';
    
    // Get complaints that are not assigned to any vendor yet
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const unassignedComplaints = complaints.filter(c => 
        c.division === currentDivision && 
        !c.assignedTo && 
        c.status !== 'Resolved'
    );
    
    if (unassignedComplaints.length === 0) {
        // Show no data message
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No unassigned complaints found.</td></tr>';
        return;
    }
    
    // Sort by date (newest first)
    unassignedComplaints.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
    
    // Add complaints to table
    unassignedComplaints.forEach(complaint => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${complaint.trackingId}</td>
            <td>${complaint.chargerID}</td>
            <td>${complaint.type}${complaint.subType ? ' - ' + complaint.subType : ''}</td>
            <td><span class="status-badge ${getStatusClass(complaint.status)}">${complaint.status}</span></td>
            <td>${new Date(complaint.createdDate).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm btn-primary assign-to-vendor-btn" data-id="${complaint.trackingId}">
                    Assign
                </button>
                <button class="btn btn-sm btn-outline view-complaint-btn" data-id="${complaint.trackingId}">
                    View
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Add event listeners to buttons
    const assignButtons = tbody.querySelectorAll('.assign-to-vendor-btn');
    assignButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const trackingId = btn.getAttribute('data-id');
            showAssignToVendorModal(trackingId);
        });
    });
    
    const viewButtons = tbody.querySelectorAll('.view-complaint-btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const trackingId = btn.getAttribute('data-id');
            showComplaintDetails(trackingId);
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
                        <div class="detail-item">
                            <div class="detail-label">Assigned To:</div>
                            <div class="detail-value">${complaint.assignedTo || 'Not Assigned'}</div>
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
    
    // Add action buttons based on status
    let actionButtons = '';
    
    if (complaint.status !== 'Resolved') {
        if (!complaint.assignedTo) {
            actionButtons += `
                <button class="btn btn-primary" id="assignFromDetailBtn" data-id="${complaint.trackingId}">
                    Assign to Vendor
                </button>
            `;
        }
        
        actionButtons += `
            <button class="btn btn-secondary" id="updateStatusBtn" data-id="${complaint.trackingId}">
                Update Status
            </button>
        `;
    }
    
    // Complete modal HTML
    detailModal.innerHTML += `
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                ${actionButtons}
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
    
    const assignBtn = document.getElementById('assignFromDetailBtn');
    if (assignBtn) {
        assignBtn.addEventListener('click', () => {
            const id = assignBtn.getAttribute('data-id');
            detailModal.classList.remove('active');
            showAssignToVendorModal(id);
        });
    }
    
    const updateBtn = document.getElementById('updateStatusBtn');
    if (updateBtn) {
        updateBtn.addEventListener('click', () => {
            const id = updateBtn.getAttribute('data-id');
            detailModal.classList.remove('active');
            showUpdateStatusModal(id);
        });
    }
}

// Show assign to vendor modal
function showAssignToVendorModal(trackingId) {
    // Get complaint data
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const complaintIndex = complaints.findIndex(c => c.trackingId === trackingId);
    
    if (complaintIndex === -1) {
        showToast('error', 'Complaint Not Found', 'The requested complaint could not be found');
        return;
    }
    
    // Get vendors that service this division
    const vendors = JSON.parse(localStorage.getItem('vendors') || '[]');
    const availableVendors = vendors.filter(v => 
        v.serviceAreas && 
        v.serviceAreas.includes(currentDivision) &&
        v.status === 'active'
    );
    
    if (availableVendors.length === 0) {
        showToast('warning', 'No Vendors Available', 'There are no active vendors available for your division');
        return;
    }
    
    // Create modal element if it doesn't exist
    let assignModal = document.getElementById('assignToVendorModal');
    if (!assignModal) {
        assignModal = document.createElement('div');
        assignModal.id = 'assignToVendorModal';
        assignModal.className = 'modal';
        document.body.appendChild(assignModal);
    }
    
    // Generate vendor options
    let vendorOptions = '';
    availableVendors.forEach(vendor => {
        // Count active assignments for this vendor
        const activeAssignments = complaints.filter(c => 
            c.assignedTo === vendor.name && 
            c.status !== 'Resolved'
        ).length;
        
        vendorOptions += `
            <option value="${vendor.name}">${vendor.name} (${activeAssignments} active)</option>
        `;
    });
    
    // Generate modal HTML
    assignModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Assign to Vendor</h2>
                <button class="modal-close" id="closeAssignModal">×</button>
            </div>
            <div class="modal-body">
                <form id="assignToVendorForm">
                    <div class="form-group">
                        <label for="vendorSelect">Select Vendor</label>
                        <select id="vendorSelect" name="vendorSelect" required>
                            <option value="">Select Vendor</option>
                            ${vendorOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="assignmentNote">Instructions for Vendor</label>
                        <textarea id="assignmentNote" name="assignmentNote" rows="3" placeholder="Add special instructions or details for the vendor..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="expectedResolutionDate">Expected Resolution Date</label>
                        <input type="date" id="expectedResolutionDate" name="expectedResolutionDate">
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
                        <button type="submit" class="btn btn-primary">Assign to Vendor</button>
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
    document.getElementById('assignToVendorForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const vendorName = document.getElementById('vendorSelect').value;
        const note = document.getElementById('assignmentNote').value;
        const expectedDate = document.getElementById('expectedResolutionDate').value;
        const updateStatus = document.getElementById('updateToInProgress').checked;
        
        // Validate
        if (!vendorName) {
            showToast('error', 'Selection Required', 'Please select a vendor');
            return;
        }
        
        // Update complaint
        const complaint = complaints[complaintIndex];
        complaint.assignedTo = vendorName;
        complaint.expectedResolutionDate = expectedDate || null;
        
        if (updateStatus && complaint.status.toLowerCase() !== 'in progress') {
            complaint.status = 'In Progress';
        }
        
        // Add to timeline
        if (!complaint.timeline) {
            complaint.timeline = [];
        }
        
        complaint.timeline.push({
            status: 'Assigned to Vendor',
            timestamp: new Date().toISOString(),
            description: `Complaint assigned to ${vendorName}${note ? ': ' + note : ''}`
        });
        
        complaint.lastUpdated = new Date().toISOString();
        
        // Save to localStorage
        localStorage.setItem('complaints', JSON.stringify(complaints));
        
        // Close modal
        assignModal.classList.remove('active');
        
        // Show success message
        showToast('success', 'Complaint Assigned', `Complaint has been assigned to ${vendorName}`);
        
        // Refresh data
        loadDivisionComplaints();
        loadRecentComplaints();
        loadDashboardStats();
        loadUnassignedComplaints();
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
        loadDivisionComplaints();
        loadRecentComplaints();
        loadDashboardStats();
        loadUnassignedComplaints();
    });
}

// Show charger details
function showChargerDetails(chargerId) {
    // Get charger data
    const chargers = JSON.parse(localStorage.getItem('chargers') || '[]');
    const charger = chargers.find(c => c.id === chargerId);
    
    if (!charger) {
        showToast('error', 'Charger Not Found', 'The requested charger could not be found');
        return;
    }
    
    // Create modal element if it doesn't exist
    let chargerModal = document.getElementById('chargerDetailModal');
    if (!chargerModal) {
        chargerModal = document.createElement('div');
        chargerModal.id = 'chargerDetailModal';
        chargerModal.className = 'modal';
        document.body.appendChild(chargerModal);
    }
    
    // Get complaint history for this charger
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const chargerComplaints = complaints.filter(c => c.chargerID === chargerId);
    
    // Count open complaints
    const openComplaints = chargerComplaints.filter(c => 
        c.status === 'Open' || c.status === 'In Progress'
    ).length;
    
    // Generate modal HTML
    chargerModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Charger Details</h2>
                <button class="modal-close" id="closeChargerModal">×</button>
            </div>
            <div class="modal-body">
                <div class="detail-section">
                    <h3>Charger Information</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <div class="detail-label">Charger ID:</div>
                            <div class="detail-value">${charger.id}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Location:</div>
                            <div class="detail-value">${charger.location || 'Unknown'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Type:</div>
                            <div class="detail-value">${charger.type || 'Standard'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Status:</div>
                            <div class="detail-value"><span class="status-badge ${getChargerStatusClass(charger.status)}">${charger.status || 'Unknown'}</span></div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Make/Model:</div>
                            <div class="detail-value">${charger.make || ''} ${charger.model || 'Unknown'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Installed:</div>
                            <div class="detail-value">${charger.commissionDate ? new Date(charger.commissionDate).toLocaleDateString() : 'Unknown'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Last Maintained:</div>
                            <div class="detail-value">${charger.lastMaintenance ? new Date(charger.lastMaintenance).toLocaleDateString() : 'Never'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Firmware:</div>
                            <div class="detail-value">${charger.firmwareVersion || 'Unknown'}</div>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>Complaint History</h3>
                    <div class="data-table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Tracking ID</th>
                                    <th>Issue Type</th>
                                    <th>Status</th>
                                    <th>Reported Date</th>
                                    <th>Assigned To</th>
                                </tr>
                            </thead>
                            <tbody>
    `;
    
    // Add complaint history
    if (chargerComplaints.length === 0) {
        chargerModal.innerHTML += `
                                <tr>
                                    <td colspan="5" class="text-center">No complaints found for this charger</td>
                                </tr>
        `;
    } else {
        // Sort by date (newest first)
        chargerComplaints
            .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
            .forEach(complaint => {
                chargerModal.innerHTML += `
                                <tr>
                                    <td>${complaint.trackingId}</td>
                                    <td>${complaint.type}${complaint.subType ? ' - ' + complaint.subType : ''}</td>
                                    <td><span class="status-badge ${getStatusClass(complaint.status)}">${complaint.status}</span></td>
                                    <td>${new Date(complaint.createdDate).toLocaleDateString()}</td>
                                    <td>${complaint.assignedTo || 'Not Assigned'}</td>
                                </tr>
                `;
            });
    }
    
    // Complete modal HTML
    chargerModal.innerHTML += `
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" id="updateChargerBtn" data-id="${charger.id}">Update Status</button>
                <button class="btn btn-secondary" id="closeChargerDetailBtn">Close</button>
            </div>
        </div>
    `;
    
    // Show modal
    chargerModal.classList.add('active');
    
    // Add event listeners
    document.getElementById('closeChargerModal').addEventListener('click', () => {
        chargerModal.classList.remove('active');
    });
    
    document.getElementById('closeChargerDetailBtn').addEventListener('click', () => {
        chargerModal.classList.remove('active');
    });
    
    document.getElementById('updateChargerBtn').addEventListener('click', () => {
        const id = document.getElementById('updateChargerBtn').getAttribute('data-id');
        chargerModal.classList.remove('active');
        showUpdateChargerModal(id);
    });
}

// Show update charger modal
function showUpdateChargerModal(chargerId) {
    // Get charger data
    const chargers = JSON.parse(localStorage.getItem('chargers') || '[]');
    const chargerIndex = chargers.findIndex(c => c.id === chargerId);
    
    if (chargerIndex === -1) {
        showToast('error', 'Charger Not Found', 'The requested charger could not be found');
        return;
    }
    
    // Create modal element if it doesn't exist
    let updateModal = document.getElementById('updateChargerModal');
    if (!updateModal) {
        updateModal = document.createElement('div');
        updateModal.id = 'updateChargerModal';
        updateModal.className = 'modal';
        document.body.appendChild(updateModal);
    }
    
    const charger = chargers[chargerIndex];
    
    // Generate modal HTML
    updateModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Update Charger Status</h2>
                <button class="modal-close" id="closeUpdateChargerModal">×</button>
            </div>
            <div class="modal-body">
                <form id="updateChargerForm">
                    <div class="form-group">
                        <label>Charger ID:</label>
                        <span class="highlight-text">${charger.id}</span>
                    </div>
                    <div class="form-group">
                        <label>Current Status:</label>
                        <span class="status-badge ${getChargerStatusClass(charger.status)}">${charger.status || 'Unknown'}</span>
                    </div>
                    <div class="form-group">
                        <label for="newChargerStatus">New Status</label>
                        <select id="newChargerStatus" name="newChargerStatus" required>
                            <option value="">Select Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="maintenance">Under Maintenance</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="statusChangeReason">Reason for Change</label>
                        <textarea id="statusChangeReason" name="statusChangeReason" rows="3" placeholder="Explain the reason for this status change"></textarea>
                    </div>
                    <div class="form-group" id="maintenanceDetailsContainer" style="display: none;">
                        <label for="maintenanceDetails">Maintenance Details</label>
                        <textarea id="maintenanceDetails" name="maintenanceDetails" rows="3" placeholder="Enter maintenance details"></textarea>
                    </div>
                    <input type="hidden" id="updateChargerId" name="updateChargerId" value="${chargerId}">
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="cancelUpdateChargerBtn">Cancel</button>
                        <button type="submit" class="btn btn-primary">Update Charger</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Show modal
    updateModal.classList.add('active');
    
    // Add event listeners
    document.getElementById('closeUpdateChargerModal').addEventListener('click', () => {
        updateModal.classList.remove('active');
    });
    
    document.getElementById('cancelUpdateChargerBtn').addEventListener('click', () => {
        updateModal.classList.remove('active');
    });
    
    // Show/hide maintenance details based on selected status
    const newStatusSelect = document.getElementById('newChargerStatus');
    const maintenanceDetailsContainer = document.getElementById('maintenanceDetailsContainer');
    
    newStatusSelect.addEventListener('change', () => {
        if (newStatusSelect.value === 'maintenance') {
            maintenanceDetailsContainer.style.display = 'block';
        } else {
            maintenanceDetailsContainer.style.display = 'none';
        }
    });
    
    // Handle form submission
    document.getElementById('updateChargerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newStatus = document.getElementById('newChargerStatus').value;
        const reason = document.getElementById('statusChangeReason').value;
        const maintenanceDetails = document.getElementById('maintenanceDetails').value;
        
        // Validate
        if (!newStatus) {
            showToast('error', 'Selection Required', 'Please select a new status');
            return;
        }
        
        // Update charger
        const charger = chargers[chargerIndex];
        const oldStatus = charger.status;
        charger.status = newStatus;
        
        // If status is maintenance, update last maintenance date
        if (newStatus === 'maintenance') {
            charger.lastMaintenance = new Date().toISOString();
            
            // Add maintenance log if it doesn't exist
            if (!charger.maintenanceLog) {
                charger.maintenanceLog = [];
            }
            
            // Add maintenance record
            charger.maintenanceLog.push({
                date: new Date().toISOString(),
                details: maintenanceDetails || 'No details provided',
                performedBy: currentDivision
            });
        }
        
        // Update last updated timestamp
        charger.lastUpdated = new Date().toISOString();
        
        // Save to localStorage
        localStorage.setItem('chargers', JSON.stringify(chargers));
        
        // Close modal
        updateModal.classList.remove('active');
        
        // Show success message
        showToast('success', 'Charger Updated', `Charger status has been updated to ${newStatus}`);
        
        // Refresh data
        loadDivisionChargers();
        loadDashboardStats();
    });
}

// Get status class for charger status badge
function getChargerStatusClass(status) {
    if (!status) return '';
    
    switch (status.toLowerCase()) {
        case 'active':
            return 'green';
        case 'inactive':
            return 'red';
        case 'maintenance':
            return 'yellow';
        default:
            return '';
    }
}

// Get status class for complaint status badge
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