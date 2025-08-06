// History management functionality
let currentPage = 1;
let currentFilters = {};

document.addEventListener('DOMContentLoaded', function () {
    // Check authentication and admin role
    if (!Auth.requireAdmin()) {
        return;
    }

    // Initialize page
    initializeHistoryPage();

    // Setup event listeners
    setupEventListeners();

    // Load data
    loadHistory();
    loadUsers();
    loadStats();

    // Check for user filter from URL
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user');
    if (userId) {
        document.getElementById('userFilter').value = userId;
        currentFilters.user_id = userId;
    }
});

function initializeHistoryPage() {
    // Display user info
    displayUserInfo();

    // Setup sidebar toggle
    setupSidebarToggle();

    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));

    document.getElementById('dateToFilter').value = today.toISOString().split('T')[0];
    document.getElementById('dateFromFilter').value = thirtyDaysAgo.toISOString().split('T')[0];
}

function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    if (searchInput) {
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
}

function displayUserInfo() {
    const user = Auth.getUser();
    if (user) {
        const userDisplayName = document.getElementById('userDisplayName');
        const userAvatar = document.getElementById('userAvatar');

        if (userDisplayName) {
            userDisplayName.textContent = user.full_name || user.username;
        }

        if (userAvatar && user.avatar_url) {
            userAvatar.src = window.origin + "/uploads/" + user.avatar_url;
        }
    }
}

async function loadHistory(page = 1) {
    try {
        currentPage = page;

        // Build query parameters
        const params = new URLSearchParams({
            page: page,
            limit: 20,
            ...currentFilters
        });

        const result = await Auth.apiRequest(`${API_ENDPOINTS.HISTORY.ALL}?${params}`);
        displayHistory(result.data.interactions);
        displayPagination(result.data.pagination);

    } catch (error) {
        console.error('Error loading history:', error);
        displayHistoryError(error.message);
    }
}

function displayHistory(interactions) {
    const container = document.getElementById('historyTableContainer');

    if (interactions.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-history fa-3x mb-3"></i>
                <p>Không tìm thấy lịch sử tương tác nào.</p>
            </div>
        `;
        return;
    }

    const table = `
        <div class="table-responsive">
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Người dùng</th>
                        <th>Loại tương tác</th>
                        <th>Đối tượng</th>
                        <th>IP Address</th>
                        <th>User Agent</th>
                        <th>Thời gian</th>
                        <th>Chi tiết</th>
                    </tr>
                </thead>
                <tbody>
                    ${interactions.map(interaction => `
                        <tr>
                            <td>${interaction.id}</td>
                            <td>
                                <div class="d-flex align-items-center">
                                    <img src="https://via.placeholder.com/32x32" class="rounded-circle me-2" width="32" height="32">
                                    <div>
                                        <strong>${interaction.username || 'Unknown'}</strong>
                                        <br><small class="text-muted">${interaction.user_email || ''}</small>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span class="badge bg-${getInteractionTypeColor(interaction.interaction_type)}">
                                    <i class="${getInteractionTypeIcon(interaction.interaction_type)}"></i>
                                    ${getInteractionTypeText(interaction.interaction_type)}
                                </span>
                            </td>
                            <td>
                                ${interaction.target_type ? `
                                    <span class="badge bg-secondary">${interaction.target_type}</span>
                                    ${interaction.target_id ? `<br><small>ID: ${interaction.target_id}</small>` : ''}
                                ` : '-'}
                            </td>
                            <td>
                                <code>${interaction.ip_address || '-'}</code>
                            </td>
                            <td>
                                <small title="${interaction.user_agent || ''}">${truncateText(interaction.user_agent || '', 30)}</small>
                            </td>
                            <td>${formatDate(interaction.created_at)}</td>
                            <td>
                                ${interaction.metadata ? `
                                    <button class="btn btn-sm btn-outline-info" onclick="showMetadata('${interaction.id}', '${escapeHtml(JSON.stringify(interaction.metadata))}')">
                                        <i class="fas fa-info-circle"></i>
                                    </button>
                                ` : '-'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = table;
}

function displayHistoryError(message) {
    const container = document.getElementById('historyTableContainer');
    container.innerHTML = `
        <div class="alert alert-danger">
            <i class="fas fa-exclamation-triangle"></i>
            ${message}
        </div>
    `;
}

function displayPagination(pagination) {
    const paginationContainer = document.getElementById('pagination');

    if (pagination.totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    // Previous button
    paginationHTML += `
        <li class="page-item ${pagination.page === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadHistory(${pagination.page - 1})">Trước</a>
        </li>
    `;

    // Page numbers
    const startPage = Math.max(1, pagination.page - 2);
    const endPage = Math.min(pagination.totalPages, pagination.page + 2);

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === pagination.page ? 'active' : ''}">
                <a class="page-link" href="#" onclick="loadHistory(${i})">${i}</a>
            </li>
        `;
    }

    // Next button
    paginationHTML += `
        <li class="page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadHistory(${pagination.page + 1})">Sau</a>
        </li>
    `;

    paginationContainer.innerHTML = paginationHTML;
}

async function loadUsers() {
    try {
        const result = await Auth.apiRequest(`${API_ENDPOINTS.ADMIN.USERS}?limit=100`);
        const userFilter = document.getElementById('userFilter');

        result.data.users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.full_name || user.username} (${user.email})`;
            userFilter.appendChild(option);
        });

    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function loadStats() {
    try {
        const result = await Auth.apiRequest(API_ENDPOINTS.HISTORY.STATS);
        displayStats(result.data);

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function displayStats(stats) {
    const statsCards = document.getElementById('statsCards');

    const cards = [
        {
            title: 'Tổng tương tác',
            value: stats.total || 0,
            icon: 'fas fa-mouse-pointer',
            color: 'primary'
        },
        {
            title: 'Hôm nay',
            value: stats.today || 0,
            icon: 'fas fa-calendar-day',
            color: 'success'
        },
        {
            title: 'Tuần này',
            value: stats.thisWeek || 0,
            icon: 'fas fa-calendar-week',
            color: 'info'
        },
        {
            title: 'Tháng này',
            value: stats.thisMonth || 0,
            icon: 'fas fa-calendar-alt',
            color: 'warning'
        }
    ];

    statsCards.innerHTML = cards.map(card => `
        <div class="col-xl-3 col-md-6 mb-4">
            <div class="card stats-card ${card.color} shadow h-100 py-2">
                <div class="card-body">
                    <div class="row no-gutters align-items-center">
                        <div class="col mr-2">
                            <div class="stats-label mb-1">${card.title}</div>
                            <div class="stats-number">${card.value.toLocaleString()}</div>
                        </div>
                        <div class="col-auto">
                            <i class="${card.icon} stats-icon"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.trim();

    if (searchTerm) {
        currentFilters.search = searchTerm;
    } else {
        delete currentFilters.search;
    }

    loadHistory(1);
}

function applyFilters() {
    const userFilter = document.getElementById('userFilter');
    const interactionTypeFilter = document.getElementById('interactionTypeFilter');
    const dateFromFilter = document.getElementById('dateFromFilter');
    const dateToFilter = document.getElementById('dateToFilter');

    currentFilters = {};

    if (userFilter.value) {
        currentFilters.user_id = userFilter.value;
    }

    if (interactionTypeFilter.value) {
        currentFilters.interaction_type = interactionTypeFilter.value;
    }

    if (dateFromFilter.value) {
        currentFilters.date_from = dateFromFilter.value;
    }

    if (dateToFilter.value) {
        currentFilters.date_to = dateToFilter.value;
    }

    // Keep search term if exists
    const searchInput = document.getElementById('searchInput');
    if (searchInput.value.trim()) {
        currentFilters.search = searchInput.value.trim();
    }

    loadHistory(1);
    loadStats(); // Reload stats with filters
}

function clearFilters() {
    currentFilters = {};

    // Clear form inputs
    document.getElementById('userFilter').value = '';
    document.getElementById('interactionTypeFilter').value = '';
    document.getElementById('dateFromFilter').value = '';
    document.getElementById('dateToFilter').value = '';
    document.getElementById('searchInput').value = '';

    loadHistory(1);
    loadStats();
}

function showMetadata(interactionId, metadataJson) {
    try {
        const metadata = JSON.parse(metadataJson);
        const formattedMetadata = JSON.stringify(metadata, null, 2);

        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Chi tiết tương tác #${interactionId}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <pre><code>${formattedMetadata}</code></pre>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        // Remove modal from DOM when hidden
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });

    } catch (error) {
        showAlert('danger', 'Không thể hiển thị metadata: ' + error.message);
    }
}

async function exportHistory() {
    try {
        const params = new URLSearchParams({
            ...currentFilters,
            export: 'csv'
        });

        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.HISTORY.ALL}?${params}`, {
            headers: {
                'Authorization': `Bearer ${Auth.getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Export failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `history_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showAlert('success', 'Xuất báo cáo thành công!');

    } catch (error) {
        console.error('Export error:', error);
        showAlert('danger', 'Lỗi khi xuất báo cáo: ' + error.message);
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN');
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getInteractionTypeIcon(type) {
    const icons = {
        'login': 'fas fa-sign-in-alt',
        'logout': 'fas fa-sign-out-alt',
        'post_view': 'fas fa-eye',
        'post_like': 'fas fa-heart',
        'post_comment': 'fas fa-comment',
        'simulation_run': 'fas fa-play',
        'gate_operation': 'fas fa-cogs'
    };
    return icons[type] || 'fas fa-circle';
}

function getInteractionTypeColor(type) {
    const colors = {
        'login': 'success',
        'logout': 'secondary',
        'post_view': 'info',
        'post_like': 'danger',
        'post_comment': 'primary',
        'simulation_run': 'warning',
        'gate_operation': 'dark'
    };
    return colors[type] || 'secondary';
}

function getInteractionTypeText(type) {
    const texts = {
        'login': 'Đăng nhập',
        'logout': 'Đăng xuất',
        'post_view': 'Xem bài viết',
        'post_like': 'Thích bài viết',
        'post_comment': 'Bình luận',
        'simulation_run': 'Chạy mô phỏng',
        'gate_operation': 'Thao tác cổng'
    };
    return texts[type] || type;
}

// Event handlers
async function handleLogout(e) {
    e.preventDefault();

    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        try {
            await Auth.logout();
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = 'login.html';
        }
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('accordionSidebar');
    if (sidebar) {
        sidebar.classList.toggle('toggled');
    }
}

function setupSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarToggleTop = document.getElementById('sidebarToggleTop');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    if (sidebarToggleTop) {
        sidebarToggleTop.addEventListener('click', toggleSidebar);
    }
}

function showAlert(type, message) {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // Add to page
    document.body.appendChild(alert);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    }, 5000);
}
