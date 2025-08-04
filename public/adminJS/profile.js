// Profile management functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!Auth.requireAuth()) {
        return;
    }
    
    // Initialize page
    initializeProfilePage();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load profile data
    loadProfile();
    loadAccountStats();
});

function initializeProfilePage() {
    // Display user info
    displayUserInfo();
    
    // Setup sidebar toggle
    setupSidebarToggle();
    
    // Setup password confirmation validation
    setupPasswordValidation();
}

function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

function setupPasswordValidation() {
    const newPassword = document.getElementById('new_password');
    const confirmPassword = document.getElementById('confirm_password');
    
    function validatePassword() {
        if (newPassword.value !== confirmPassword.value) {
            confirmPassword.setCustomValidity('Mật khẩu xác nhận không khớp');
        } else {
            confirmPassword.setCustomValidity('');
        }
    }
    
    newPassword.addEventListener('change', validatePassword);
    confirmPassword.addEventListener('keyup', validatePassword);
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

async function loadProfile() {
    try {
        const result = await Auth.apiRequest(API_ENDPOINTS.AUTH.PROFILE);
        const user = result.data.user;
        
        // Populate form fields
        document.getElementById('username').value = user.username;
        document.getElementById('email').value = user.email;
        document.getElementById('full_name').value = user.full_name || '';
        document.getElementById('role').value = getRoleText(user.role);
        document.getElementById('bio').value = user.bio || '';
        
        // Update avatar
        const profileAvatar = document.getElementById('profileAvatar');
        if (user.avatar_url) {
            profileAvatar.src = user.avatar_url;
        }
        
        // Update account info
        document.getElementById('joinDate').textContent = formatDate(user.created_at);
        document.getElementById('lastLogin').textContent = user.last_login ? formatDate(user.last_login) : 'Chưa đăng nhập';
        
        const statusBadge = document.getElementById('accountStatus');
        statusBadge.textContent = getStatusText(user.status);
        statusBadge.className = `badge bg-${getStatusColor(user.status)}`;
        
    } catch (error) {
        console.error('Error loading profile:', error);
        showAlert('danger', 'Không thể tải thông tin hồ sơ: ' + error.message);
    }
}

async function loadAccountStats() {
    try {
        const user = Auth.getUser();
        let stats;
        
        if (user.role === 'admin') {
            // Load admin stats
            const result = await Auth.apiRequest(API_ENDPOINTS.ADMIN.DASHBOARD_STATS);
            stats = [
                { label: 'Tổng người dùng', value: result.data.users.total, icon: 'fas fa-users', color: 'primary' },
                { label: 'Tổng bài viết', value: result.data.posts.total, icon: 'fas fa-newspaper', color: 'success' },
                { label: 'Tương tác hôm nay', value: result.data.interactions.today, icon: 'fas fa-mouse-pointer', color: 'info' }
            ];
        } else {
            // Load user stats
            const [userStats, postStats] = await Promise.all([
                Auth.apiRequest(API_ENDPOINTS.HISTORY.MY_STATS),
                Auth.apiRequest(API_ENDPOINTS.POSTS.MY_POSTS + '?limit=1')
            ]);
            
            stats = [
                { label: 'Bài viết của tôi', value: postStats.data.pagination.total, icon: 'fas fa-newspaper', color: 'primary' },
                { label: 'Tương tác', value: userStats.data.total, icon: 'fas fa-mouse-pointer', color: 'success' },
                { label: 'Hôm nay', value: userStats.data.today, icon: 'fas fa-calendar-day', color: 'info' }
            ];
        }
        
        displayAccountStats(stats);
        
    } catch (error) {
        console.error('Error loading account stats:', error);
        displayAccountStatsError();
    }
}

function displayAccountStats(stats) {
    const container = document.getElementById('accountStats');
    
    container.innerHTML = stats.map(stat => `
        <div class="row no-gutters align-items-center mb-3">
            <div class="col-auto">
                <i class="${stat.icon} fa-2x text-${stat.color}"></i>
            </div>
            <div class="col ml-2">
                <div class="text-xs font-weight-bold text-${stat.color} text-uppercase mb-1">${stat.label}</div>
                <div class="h5 mb-0 font-weight-bold text-gray-800">${stat.value.toLocaleString()}</div>
            </div>
        </div>
    `).join('');
}

function displayAccountStatsError() {
    const container = document.getElementById('accountStats');
    container.innerHTML = `
        <div class="alert alert-warning">
            <i class="fas fa-exclamation-triangle"></i>
            Không thể tải thống kê
        </div>
    `;
}

async function updateProfile() {
    try {
        const form = document.getElementById('profileForm');
        const formData = new FormData(form);
        
        // Validate form
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }
        
        const updateBtn = document.querySelector('#profileForm .btn-primary');
        const btnText = updateBtn.querySelector('.btn-text');
        const spinner = updateBtn.querySelector('.spinner-border');
        
        // Show loading state
        updateBtn.disabled = true;
        btnText.textContent = 'Đang cập nhật...';
        spinner.classList.remove('d-none');
        
        // Prepare data
        const profileData = {
            email: formData.get('email'),
            full_name: formData.get('full_name'),
            bio: formData.get('bio')
        };
        
        const result = await Auth.apiRequest(API_ENDPOINTS.AUTH.UPDATE_PROFILE, {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
        
        // Update local user data
        Auth.updateUser(result.data.user);
        
        // Success
        showAlert('success', 'Cập nhật thông tin thành công!');
        
        // Update display
        displayUserInfo();
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showAlert('danger', 'Lỗi khi cập nhật thông tin: ' + error.message);
    } finally {
        // Reset button state
        const updateBtn = document.querySelector('#profileForm .btn-primary');
        const btnText = updateBtn.querySelector('.btn-text');
        const spinner = updateBtn.querySelector('.spinner-border');
        
        updateBtn.disabled = false;
        btnText.textContent = 'Cập nhật thông tin';
        spinner.classList.add('d-none');
    }
}

async function changePassword() {
    try {
        const form = document.getElementById('passwordForm');
        const formData = new FormData(form);
        
        // Validate form
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }
        
        const changeBtn = document.querySelector('#passwordForm .btn-warning');
        const btnText = changeBtn.querySelector('.btn-text');
        const spinner = changeBtn.querySelector('.spinner-border');
        
        // Show loading state
        changeBtn.disabled = true;
        btnText.textContent = 'Đang đổi mật khẩu...';
        spinner.classList.remove('d-none');
        
        // Prepare data
        const passwordData = {
            current_password: formData.get('current_password'),
            new_password: formData.get('new_password')
        };
        
        await Auth.apiRequest(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
            method: 'PUT',
            body: JSON.stringify(passwordData)
        });
        
        // Success
        showAlert('success', 'Đổi mật khẩu thành công!');
        
        // Reset form
        form.reset();
        form.classList.remove('was-validated');
        
    } catch (error) {
        console.error('Error changing password:', error);
        showAlert('danger', 'Lỗi khi đổi mật khẩu: ' + error.message);
    } finally {
        // Reset button state
        const changeBtn = document.querySelector('#passwordForm .btn-warning');
        const btnText = changeBtn.querySelector('.btn-text');
        const spinner = changeBtn.querySelector('.spinner-border');
        
        changeBtn.disabled = false;
        btnText.textContent = 'Đổi mật khẩu';
        spinner.classList.add('d-none');
    }
}

function previewAvatar(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        
        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            showAlert('danger', 'Kích thước file không được vượt quá 2MB');
            input.value = '';
            return;
        }
        
        // Validate file type
        if (!file.type.match('image.*')) {
            showAlert('danger', 'Vui lòng chọn file ảnh (JPG, PNG)');
            input.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profileAvatar').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

async function uploadAvatar() {
    try {
        const fileInput = document.getElementById('avatarFile');
        const file = fileInput.files[0];
        
        if (!file) {
            showAlert('warning', 'Vui lòng chọn ảnh để tải lên');
            return;
        }
        
        const formData = new FormData();
        formData.append('avatar', file);
        
        const result = await Auth.apiRequest(API_ENDPOINTS.AUTH.UPLOAD_AVATAR, {
            method: 'POST',
            body: formData,
            headers: {} // Let browser set Content-Type for FormData
        });
        
        // Update user data
        Auth.updateUser(result.data.user);
        
        // Update display
        displayUserInfo();
        
        showAlert('success', 'Tải lên ảnh đại diện thành công!');
        
    } catch (error) {
        console.error('Error uploading avatar:', error);
        showAlert('danger', 'Lỗi khi tải lên ảnh: ' + error.message);
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

function getRoleText(role) {
    const roles = {
        'admin': 'Quản trị viên',
        'moderator': 'Điều hành viên',
        'user': 'Người dùng'
    };
    return roles[role] || role;
}

function getStatusText(status) {
    const statuses = {
        'active': 'Hoạt động',
        'inactive': 'Không hoạt động',
        'banned': 'Bị cấm'
    };
    return statuses[status] || status;
}

function getStatusColor(status) {
    const colors = {
        'active': 'success',
        'inactive': 'secondary',
        'banned': 'danger'
    };
    return colors[status] || 'secondary';
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
