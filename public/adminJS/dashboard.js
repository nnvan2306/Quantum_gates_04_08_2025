// Dashboard functionality
document.addEventListener("DOMContentLoaded", function () {
    // Check authentication
    if (!Auth.requireAuth()) {
        return;
    }

    // Initialize dashboard
    initializeDashboard();

    // Setup event listeners
    setupEventListeners();

    // Load dashboard data
    loadDashboardData();
});

function initializeDashboard() {
    // Display user info
    displayUserInfo();

    // Setup sidebar toggle
    setupSidebarToggle();

    // Setup scroll to top
    setupScrollToTop();
}
function setupSidebarToggle() {
    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebarToggleTop = document.getElementById("sidebarToggleTop");

    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", toggleSidebar);
    }

    if (sidebarToggleTop) {
        sidebarToggleTop.addEventListener("click", toggleSidebar);
    }
}
function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", handleLogout);
    }

    // Sidebar toggle buttons
    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebarToggleTop = document.getElementById("sidebarToggleTop");

    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", toggleSidebar);
    }

    if (sidebarToggleTop) {
        sidebarToggleTop.addEventListener("click", toggleSidebar);
    }
}

function displayUserInfo() {
    const user = Auth.getUser();
    if (user) {
        const userDisplayName = document.getElementById("userDisplayName");
        const userAvatar = document.getElementById("userAvatar");

        if (userDisplayName) {
            userDisplayName.textContent = user.full_name || user.username;
        }

        if (userAvatar && user.avatar_url) {
            userAvatar.src = window.origin + "/uploads/" + user.avatar_url;
        }
    }
}

async function loadDashboardData() {
    try {
        // Load stats
        await loadStats();

        // Load recent posts
        await loadRecentPosts();

        // Load recent activity
        await loadRecentActivity();
    } catch (error) {
        console.error("Error loading dashboard data:", error);
        showAlert("danger", "Có lỗi xảy ra khi tải dữ liệu dashboard.");
    }
}

async function loadStats() {
    try {
        const user = Auth.getUser();
        let statsData;

        if (user.role === "admin") {
            // Load admin stats
            const result = await Auth.apiRequest(API_ENDPOINTS.ADMIN.DASHBOARD_STATS);
            statsData = result.data;
        } else {
            // Load user stats
            const [userStats, postStats] = await Promise.all([
                Auth.apiRequest(API_ENDPOINTS.HISTORY.MY_STATS),
                Auth.apiRequest(API_ENDPOINTS.POSTS.STATS),
            ]);

            statsData = {
                users: { total: 0, active: 0 },
                posts: postStats.data,
                interactions: userStats.data,
            };
        }

        displayStats(statsData);
    } catch (error) {
        console.error("Error loading stats:", error);
        displayStatsError();
    }
}

function displayStats(data) {
    const statsCards = document.getElementById("statsCards");

    const cards = [
        {
            title: "Tổng người dùng",
            value: data.users.total || 0,
            icon: "fas fa-users",
            color: "primary",
        },
        {
            title: "Bài viết",
            value: data.posts.total || 0,
            icon: "fas fa-newspaper",
            color: "success",
        },
        {
            title: "Tương tác",
            value: data.interactions.total || 0,
            icon: "fas fa-mouse-pointer",
            color: "info",
        },
        {
            title: "Hôm nay",
            value: data.interactions.today || 0,
            icon: "fas fa-calendar-day",
            color: "warning",
        },
    ];

    statsCards.innerHTML = cards
        .map(
            (card) => `
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
    `
        )
        .join("");
}

function displayStatsError() {
    const statsCards = document.getElementById("statsCards");
    statsCards.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i>
                Không thể tải thống kê. Vui lòng thử lại sau.
            </div>
        </div>
    `;
}

async function loadRecentPosts() {
    try {
        const result = await Auth.apiRequest(
            `${API_ENDPOINTS.POSTS.RECENT}?limit=5`
        );
        displayRecentPosts(result.data.posts);
    } catch (error) {
        console.error("Error loading recent posts:", error);
        displayRecentPostsError();
    }
}

function displayRecentPosts(posts) {
    const recentPosts = document.getElementById("recentPosts");

    if (posts.length === 0) {
        recentPosts.innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-newspaper fa-2x mb-3"></i>
                <p>Chưa có bài viết nào.</p>
                <a href="posts.html#create" class="btn btn-primary btn-sm">Tạo bài viết đầu tiên</a>
            </div>
        `;
        return;
    }

    recentPosts.innerHTML = posts
        .map(
            (post) => `
        <div class="d-flex align-items-center mb-3 pb-3 border-bottom">
            <div class="flex-grow-1">
                <h6 class="mb-1">
                    <a href="posts.html#view-${post.id
                }" class="text-decoration-none">
                        ${post.title}
                    </a>
                </h6>
                <small class="text-muted">
                    <i class="fas fa-user"></i> ${post.author_name || post.author_username
                }
                    <i class="fas fa-clock ml-2"></i> ${formatDate(
                    post.created_at
                )}
                </small>
                <div class="mt-1">
                    <span class="badge badge-${getStatusColor(
                    post.status
                )}">${getStatusText(post.status)}</span>
                    <small class="text-muted ml-2">
                        <i class="fas fa-eye"></i> ${post.view_count}
                        <i class="fas fa-heart ml-1"></i> ${post.like_count}
                    </small>
                </div>
            </div>
        </div>
    `
        )
        .join("");
}

function displayRecentPostsError() {
    const recentPosts = document.getElementById("recentPosts");
    recentPosts.innerHTML = `
        <div class="alert alert-danger">
            <i class="fas fa-exclamation-triangle"></i>
            Không thể tải bài viết gần đây.
        </div>
    `;
}

async function loadRecentActivity() {
    try {
        const result = await Auth.apiRequest(
            `${API_ENDPOINTS.HISTORY.MY_HISTORY}?limit=10`
        );
        displayRecentActivity(result.data.interactions);
    } catch (error) {
        console.error("Error loading recent activity:", error);
        displayRecentActivityError();
    }
}

function displayRecentActivity(activities) {
    const recentActivity = document.getElementById("recentActivity");

    if (activities.length === 0) {
        recentActivity.innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-history fa-2x mb-3"></i>
                <p>Chưa có hoạt động nào.</p>
            </div>
        `;
        return;
    }

    recentActivity.innerHTML = activities
        .map(
            (activity) => `
        <div class="d-flex align-items-center mb-3">
            <div class="mr-3">
                <i class="${getActivityIcon(
                activity.interaction_type
            )} text-${getActivityColor(activity.interaction_type)}"></i>
            </div>
            <div class="flex-grow-1">
                <div class="small font-weight-bold">${getActivityText(
                activity.interaction_type
            )}</div>
                <div class="small text-muted">${formatDate(
                activity.created_at
            )}</div>
            </div>
        </div>
    `
        )
        .join("");
}

function displayRecentActivityError() {
    const recentActivity = document.getElementById("recentActivity");
    recentActivity.innerHTML = `
        <div class="alert alert-danger">
            <i class="fas fa-exclamation-triangle"></i>
            Không thể tải hoạt động gần đây.
        </div>
    `;
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return (
        date.toLocaleDateString("vi-VN") +
        " " +
        date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    );
}

function getStatusColor(status) {
    const colors = {
        draft: "secondary",
        published: "success",
        archived: "warning",
    };
    return colors[status] || "secondary";
}

function getStatusText(status) {
    const texts = {
        draft: "Nháp",
        published: "Đã xuất bản",
        archived: "Lưu trữ",
    };
    return texts[status] || status;
}

function getActivityIcon(type) {
    const icons = {
        login: "fas fa-sign-in-alt",
        logout: "fas fa-sign-out-alt",
        post_view: "fas fa-eye",
        post_like: "fas fa-heart",
        post_comment: "fas fa-comment",
        simulation_run: "fas fa-play",
        gate_operation: "fas fa-cogs",
    };
    return icons[type] || "fas fa-circle";
}

function getActivityColor(type) {
    const colors = {
        login: "success",
        logout: "secondary",
        post_view: "info",
        post_like: "danger",
        post_comment: "primary",
        simulation_run: "warning",
        gate_operation: "dark",
    };
    return colors[type] || "secondary";
}

function getActivityText(type) {
    const texts = {
        login: "Đăng nhập",
        logout: "Đăng xuất",
        post_view: "Xem bài viết",
        post_like: "Thích bài viết",
        post_comment: "Bình luận",
        simulation_run: "Chạy mô phỏng",
        gate_operation: "Thao tác cổng",
    };
    return texts[type] || type;
}

// Event handlers
async function handleLogout(e) {
    e.preventDefault();

    if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
        try {
            await Auth.logout();
            window.location.href = "login.html";
        } catch (error) {
            console.error("Logout error:", error);
            // Force logout even if API call fails
            window.location.href = "login.html";
        }
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById("accordionSidebar");
    if (sidebar) {
        sidebar.classList.toggle("toggled");
    }
}

function setupScrollToTop() {
    const scrollToTop = document.querySelector(".scroll-to-top");

    if (scrollToTop) {
        window.addEventListener("scroll", function () {
            if (window.pageYOffset > 100) {
                scrollToTop.style.display = "block";
            } else {
                scrollToTop.style.display = "none";
            }
        });

        scrollToTop.addEventListener("click", function (e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }
}

function showAlert(type, message) {
    // Create alert element
    const alert = document.createElement("div");
    alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alert.style.cssText =
        "top: 20px; right: 20px; z-index: 9999; min-width: 300px;";
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
