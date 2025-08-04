// Users management functionality
let currentPage = 1;
let currentFilters = {};
let isEditing = false;

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication and admin role
    if (!Auth.requireAdmin()) {
        return;
    }
    
    // Initialize page
    initializeUsersPage();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load users data
    loadUsers();
});

function initializeUsersPage() {
    // Display user info
    displayUserInfo();
    
    // Setup sidebar toggle
    setupSidebarToggle();
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
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
    
    // Filter change events
    const roleFilter = document.getElementById('roleFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (roleFilter) {
        roleFilter.addEventListener('change', applyFilters);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
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
            userAvatar.src = user.avatar_url;
        }
    }
}

async function loadUsers(page = 1) {
    try {
        currentPage = page;
        
        // Build query parameters
        const params = new URLSearchParams({
            page: page,
            limit: 10,
            ...currentFilters
        });
        
        const result = await Auth.apiRequest(`${API_ENDPOINTS.ADMIN.USERS}?${params}`);
        displayUsers(result.data.users);
        displayPagination(result.data.pagination);
        
    } catch (error) {
        console.error('Error loading users:', error);
        displayUsersError(error.message);
    }
}

function displayUsers(users) {
    const container = document.getElementById('usersTableContainer');
    
    if (users.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-users fa-3x mb-3"></i>
                <p>Không tìm thấy người dùng nào.</p>
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
                        <th>Tên đăng nhập</th>
                        <th>Email</th>
                        <th>Họ tên</th>
                        <th>Vai trò</th>
                        <th>Trạng thái</th>
                        <th>Đăng nhập cuối</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.id}</td>
                            <td>
                                <div class="d-flex align-items-center">
                                    <img src="${user.avatar_url || 'https://via.placeholder.com/32x32'}" 
                                         class="rounded-circle me-2" width="32" height="32">
                                    <strong>${user.username}</strong>
                                </div>
                            </td>
                            <td>${user.email}</td>
                            <td>${user.full_name || '-'}</td>
                            <td>
                                <span class="badge bg-${getRoleBadgeColor(user.role)}">
                                    ${getRoleText(user.role)}
                                </span>
                            </td>
                            <td>
                                <span class="badge bg-${getStatusBadgeColor(user.status)}">
                                    ${getStatusText(user.status)}
                                </span>
                            </td>
                            <td>${user.last_login ? formatDate(user.last_login) : 'Chưa đăng nhập'}</td>
                            <td>
                                <div class="btn-group" role="group">
                                    <button class="btn btn-sm btn-outline-primary" onclick="editUser(${user.id})" title="Sửa">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-info" onclick="viewUserHistory(${user.id})" title="Lịch sử">
                                        <i class="fas fa-history"></i>
                                    </button>
                                    ${user.id !== Auth.getUser().id ? `
                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${user.id}, '${user.username}')" title="Xóa">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = table;
}

function displayUsersError(message) {
    const container = document.getElementById('usersTableContainer');
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
            <a class="page-link" href="#" onclick="loadUsers(${pagination.page - 1})">Trước</a>
        </li>
    `;
    
    // Page numbers
    const startPage = Math.max(1, pagination.page - 2);
    const endPage = Math.min(pagination.totalPages, pagination.page + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === pagination.page ? 'active' : ''}">
                <a class="page-link" href="#" onclick="loadUsers(${i})">${i}</a>
            </li>
        `;
    }
    
    // Next button
    paginationHTML += `
        <li class="page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadUsers(${pagination.page + 1})">Sau</a>
        </li>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
}

function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.trim();
    
    if (searchTerm) {
        currentFilters.search = searchTerm;
    } else {
        delete currentFilters.search;
    }
    
    loadUsers(1);
}

function applyFilters() {
    const roleFilter = document.getElementById('roleFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    currentFilters = {};
    
    if (roleFilter.value) {
        currentFilters.role = roleFilter.value;
    }
    
    if (statusFilter.value) {
        currentFilters.status = statusFilter.value;
    }
    
    // Keep search term if exists
    const searchInput = document.getElementById('searchInput');
    if (searchInput.value.trim()) {
        currentFilters.search = searchInput.value.trim();
    }
    
    loadUsers(1);
}

function clearFilters() {
    currentFilters = {};
    
    // Clear form inputs
    document.getElementById('roleFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('searchInput').value = '';
    
    loadUsers(1);
}

function openCreateUserModal() {
    isEditing = false;
    
    // Reset form
    const form = document.getElementById('userForm');
    form.reset();
    
    // Update modal title
    document.getElementById('userModalTitle').textContent = 'Thêm người dùng';
    
    // Show password field as required
    const passwordField = document.getElementById('password');
    passwordField.required = true;
    passwordField.parentElement.querySelector('small').style.display = 'none';
    
    // Clear user ID
    document.getElementById('userId').value = '';
}

async function editUser(userId) {
    try {
        isEditing = true;
        
        // Load user data
        const result = await Auth.apiRequest(API_ENDPOINTS.ADMIN.USER(userId));
        const user = result.data.user;
        
        // Populate form
        document.getElementById('userId').value = user.id;
        document.getElementById('username').value = user.username;
        document.getElementById('email').value = user.email;
        document.getElementById('full_name').value = user.full_name || '';
        document.getElementById('role').value = user.role;
        document.getElementById('status').value = user.status;
        
        // Update modal title
        document.getElementById('userModalTitle').textContent = 'Sửa người dùng';
        
        // Make password optional for editing
        const passwordField = document.getElementById('password');
        passwordField.required = false;
        passwordField.value = '';
        passwordField.parentElement.querySelector('small').style.display = 'block';
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('userModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error loading user:', error);
        showAlert('danger', 'Không thể tải thông tin người dùng: ' + error.message);
    }
}

async function saveUser() {
    try {
        const form = document.getElementById('userForm');
        const formData = new FormData(form);
        
        // Validate form
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }
        
        const saveBtn = document.querySelector('#userModal .btn-primary');
        const btnText = saveBtn.querySelector('.btn-text');
        const spinner = saveBtn.querySelector('.spinner-border');
        
        // Show loading state
        saveBtn.disabled = true;
        btnText.textContent = isEditing ? 'Đang cập nhật...' : 'Đang tạo...';
        spinner.classList.remove('d-none');
        
        // Prepare data
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            full_name: formData.get('full_name'),
            role: formData.get('role'),
            status: formData.get('status')
        };
        
        // Add password if provided
        const password = formData.get('password');
        if (password) {
            userData.password = password;
        }
        
        let result;
        
        if (isEditing) {
            // Update user
            const userId = formData.get('userId');
            result = await Auth.apiRequest(API_ENDPOINTS.ADMIN.UPDATE_USER(userId), {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
        } else {
            // Create user (would need a create endpoint)
            showAlert('warning', 'Chức năng tạo người dùng mới chưa được implement trong API.');
            return;
        }
        
        // Success
        showAlert('success', isEditing ? 'Cập nhật người dùng thành công!' : 'Tạo người dùng thành công!');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
        modal.hide();
        
        // Reload users
        loadUsers(currentPage);
        
    } catch (error) {
        console.error('Error saving user:', error);
        showAlert('danger', 'Lỗi khi lưu người dùng: ' + error.message);
    } finally {
        // Reset button state
        const saveBtn = document.querySelector('#userModal .btn-primary');
        const btnText = saveBtn.querySelector('.btn-text');
        const spinner = saveBtn.querySelector('.spinner-border');
        
        saveBtn.disabled = false;
        btnText.textContent = 'Lưu';
        spinner.classList.add('d-none');
    }
}

async function deleteUser(userId, username) {
    if (!confirm(`Bạn có chắc chắn muốn xóa người dùng "${username}"?`)) {
        return;
    }
    
    try {
        await Auth.apiRequest(API_ENDPOINTS.ADMIN.DELETE_USER(userId), {
            method: 'DELETE'
        });
        
        showAlert('success', 'Xóa người dùng thành công!');
        loadUsers(currentPage);
        
    } catch (error) {
        console.error('Error deleting user:', error);
        showAlert('danger', 'Lỗi khi xóa người dùng: ' + error.message);
    }
}

function viewUserHistory(userId) {
    // Redirect to history page with user filter
    window.location.href = `history.html?user=${userId}`;
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function getRoleBadgeColor(role) {
    const colors = {
        'admin': 'danger',
        'moderator': 'warning',
        'user': 'primary'
    };
    return colors[role] || 'secondary';
}

function getRoleText(role) {
    const texts = {
        'admin': 'Quản trị viên',
        'moderator': 'Điều hành viên',
        'user': 'Người dùng'
    };
    return texts[role] || role;
}

function getStatusBadgeColor(status) {
    const colors = {
        'active': 'success',
        'inactive': 'secondary',
        'banned': 'danger'
    };
    return colors[status] || 'secondary';
}

function getStatusText(status) {
    const texts = {
        'active': 'Hoạt động',
        'inactive': 'Không hoạt động',
        'banned': 'Bị cấm'
    };
    return texts[status] || status;
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
