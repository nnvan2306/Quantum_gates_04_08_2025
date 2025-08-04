// Posts management functionality
let currentPage = 1;
let currentFilters = {};
let isEditing = false;
let currentModalType = "post"; // 'post', 'event', 'activity'

document.addEventListener("DOMContentLoaded", function () {
    // Check authentication
    if (!Auth.requireAuth()) {
        return;
    }

    // Initialize page
    initializePostsPage();

    // Setup event listeners
    setupEventListeners();

    // Load posts data
    loadPosts();

    // Load authors for filter
    loadAuthors();
});

function initializePostsPage() {
    // Display user info
    displayUserInfo();

    // Setup sidebar toggle
    setupSidebarToggle();
}

function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", handleLogout);
    }

    // Search functionality
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");

    if (searchInput) {
        searchInput.addEventListener("keypress", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                performSearch();
            }
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener("click", performSearch);
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
            userAvatar.src = user.avatar_url;
        }
    }
}

async function loadPosts(page = 1) {
    try {
        currentPage = page;

        // Build query parameters
        const params = new URLSearchParams({
            page: page,
            limit: 10,
            ...currentFilters,
        });

        const result = await Auth.apiRequest(
            `${API_ENDPOINTS.POSTS.LIST}?${params}`
        );
        displayPosts(result.data.posts);
        displayPagination(result.data.pagination);
    } catch (error) {
        console.error("Error loading posts:", error);
        displayPostsError(error.message);
    }
}

function displayPosts(posts) {
    const container = document.getElementById("postsTableContainer");

    if (posts.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-newspaper fa-3x mb-3"></i>
                <p>Không tìm thấy bài viết nào.</p>
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
                        <th>Loại</th>
                        <th>Tiêu đề</th>
                        <th>Tác giả</th>
                        <th>Danh mục</th>
                        <th>Trạng thái</th>
                        <th>Lượt xem</th>
                        <th>Lượt thích</th>
                        <th>Ngày tạo</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    ${posts
                        .map(
                            (post) => `
                        <tr>
                            <td>${post.id}</td>
                            <td>
                                <span class="badge bg-${getTypeBadgeColor(
                                    post.post_type || "post"
                                )}">
                                    <i class="${getTypeIcon(
                                        post.post_type || "post"
                                    )}"></i>
                                    ${getTypeText(post.post_type || "post")}
                                </span>
                            </td>
                            <td>
                                <div class="d-flex flex-column">
                                    <strong>${post.title}</strong>
                                    ${
                                        post.excerpt
                                            ? `<small class="text-muted">${post.excerpt.substring(
                                                  0,
                                                  100
                                              )}...</small>`
                                            : ""
                                    }
                                </div>
                            </td>
                            <td>${post.author_name || post.author_username}</td>
                            <td>
                                <span class="badge bg-info">${getCategoryText(
                                    post.category
                                )}</span>
                            </td>
                            <td>
                                <span class="badge bg-${getStatusBadgeColor(
                                    post.status
                                )}">
                                    ${getStatusText(post.status)}
                                </span>
                            </td>
                            <td>
                                <i class="fas fa-eye text-info"></i> ${
                                    post.view_count || 0
                                }
                            </td>
                            <td>
                                <i class="fas fa-heart text-danger"></i> ${
                                    post.like_count || 0
                                }
                            </td>
                            <td>${formatDate(post.created_at)}</td>
                            <td>
                                <div class="btn-group" role="group">
                                    <button class="btn btn-sm btn-outline-primary" onclick="editPost(${
                                        post.id
                                    }, '${post.type || "post"}')" title="Sửa">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-info" onclick="viewPost(${
                                        post.id
                                    })" title="Xem">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" onclick="deletePost(${
                                        post.id
                                    }, '${post.title}')" title="Xóa">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `
                        )
                        .join("")}
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = table;
}

function displayPostsError(message) {
    const container = document.getElementById("postsTableContainer");
    container.innerHTML = `
        <div class="alert alert-danger">
            <i class="fas fa-exclamation-triangle"></i>
            ${message}
        </div>
    `;
}

function displayPagination(pagination) {
    const paginationContainer = document.getElementById("pagination");

    if (pagination.totalPages <= 1) {
        paginationContainer.innerHTML = "";
        return;
    }

    let paginationHTML = "";

    // Previous button
    paginationHTML += `
        <li class="page-item ${pagination.page === 1 ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="loadPosts(${
                pagination.page - 1
            })">Trước</a>
        </li>
    `;

    // Page numbers
    const startPage = Math.max(1, pagination.page - 2);
    const endPage = Math.min(pagination.totalPages, pagination.page + 2);

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === pagination.page ? "active" : ""}">
                <a class="page-link" href="#" onclick="loadPosts(${i})">${i}</a>
            </li>
        `;
    }

    // Next button
    paginationHTML += `
        <li class="page-item ${
            pagination.page === pagination.totalPages ? "disabled" : ""
        }">
            <a class="page-link" href="#" onclick="loadPosts(${
                pagination.page + 1
            })">Sau</a>
        </li>
    `;

    paginationContainer.innerHTML = paginationHTML;
}

async function loadAuthors() {
    try {
        const result = await Auth.apiRequest(
            `${API_ENDPOINTS.ADMIN.USERS}?limit=100`
        );
        const authorFilter = document.getElementById("authorFilter");

        result.data.users.forEach((user) => {
            const option = document.createElement("option");
            option.value = user.id;
            option.textContent = user.full_name || user.username;
            authorFilter.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading authors:", error);
    }
}

function performSearch() {
    const searchInput = document.getElementById("searchInput");
    const searchTerm = searchInput.value.trim();

    if (searchTerm) {
        currentFilters.search = searchTerm;
    } else {
        delete currentFilters.search;
    }

    loadPosts(1);
}

function applyFilters() {
    const typeFilter = document.getElementById("typeFilter");
    const statusFilter = document.getElementById("statusFilter");
    const categoryFilter = document.getElementById("categoryFilter");
    const authorFilter = document.getElementById("authorFilter");

    currentFilters = {};

    if (typeFilter.value) {
        currentFilters.type = typeFilter.value;
    }

    if (statusFilter.value) {
        currentFilters.status = statusFilter.value;
    }

    if (categoryFilter.value) {
        currentFilters.category = categoryFilter.value;
    }

    if (authorFilter.value) {
        currentFilters.author_id = authorFilter.value;
    }

    // Keep search term if exists
    const searchInput = document.getElementById("searchInput");
    if (searchInput.value.trim()) {
        currentFilters.search = searchInput.value.trim();
    }

    loadPosts(1);
}

function clearFilters() {
    currentFilters = {};

    // Clear form inputs
    document.getElementById("typeFilter").value = "";
    document.getElementById("statusFilter").value = "";
    document.getElementById("categoryFilter").value = "";
    document.getElementById("authorFilter").value = "";
    document.getElementById("searchInput").value = "";

    loadPosts(1);
}

function openCreatePostModal() {
    isEditing = false;
    currentModalType = "post";

    // Reset form
    const form = document.getElementById("postForm");
    form.reset();

    // Update modal title
    document.getElementById("postModalTitle").textContent = "Tạo bài viết";

    // Clear post ID
    document.getElementById("postId").value = "";

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById("postModal"));
    modal.show();
}

function openCreateEventModal() {
    isEditing = false;
    currentModalType = "event";

    // Reset form
    const form = document.getElementById("eventForm");
    form.reset();

    // Update modal title
    document.getElementById("eventModalTitle").textContent = "Tạo sự kiện";

    // Clear event ID
    document.getElementById("eventId").value = "";

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById("eventModal"));
    modal.show();
}

function openCreateActivityModal() {
    isEditing = false;
    currentModalType = "activity";

    // Reset form
    const form = document.getElementById("activityForm");
    form.reset();

    // Update modal title
    document.getElementById("activityModalTitle").textContent = "Tạo hoạt động";

    // Clear activity ID
    document.getElementById("activityId").value = "";

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById("activityModal"));
    modal.show();
}

async function editPost(postId, type = "post") {
    try {
        isEditing = true;
        currentModalType = type;

        // Load post data
        const result = await Auth.apiRequest(
            API_ENDPOINTS.POSTS.DETAIL(postId)
        );
        const post = result.data.post;

        // Populate form based on type
        if (type === "event") {
            populateEventForm(post);
        } else if (type === "activity") {
            populateActivityForm(post);
        } else {
            populatePostForm(post);
        }
    } catch (error) {
        console.error("Error loading post:", error);
        showAlert(
            "danger",
            "Không thể tải thông tin bài viết: " + error.message
        );
    }
}

function populatePostForm(post) {
    document.getElementById("postId").value = post.id;
    document.getElementById("title").value = post.title;
    document.getElementById("category").value = post.category;
    document.getElementById("excerpt").value = post.excerpt || "";
    document.getElementById("content").value = post.content;
    document.getElementById("tags").value = Array.isArray(post.tags)
        ? post.tags.join(", ")
        : "";
    document.getElementById("status").value = post.status;

    document.getElementById("postModalTitle").textContent = "Sửa bài viết";
    const modal = new bootstrap.Modal(document.getElementById("postModal"));
    modal.show();
}

function populateEventForm(post) {
    document.getElementById("eventId").value = post.id;
    document.getElementById("eventTitle").value = post.title;
    document.getElementById("eventStartDate").value = post.start_date
        ? new Date(post.start_date).toISOString().slice(0, 16)
        : "";
    document.getElementById("eventEndDate").value = post.end_date
        ? new Date(post.end_date).toISOString().slice(0, 16)
        : "";
    document.getElementById("eventLocation").value = post.location || "";
    document.getElementById("eventCapacity").value = post.capacity || "";
    document.getElementById("eventDescription").value = post.content;
    document.getElementById("eventRequirements").value =
        post.requirements || "";
    document.getElementById("eventTags").value = Array.isArray(post.tags)
        ? post.tags.join(", ")
        : "";
    document.getElementById("eventStatus").value = post.status;

    document.getElementById("eventModalTitle").textContent = "Sửa sự kiện";
    const modal = new bootstrap.Modal(document.getElementById("eventModal"));
    modal.show();
}

function populateActivityForm(post) {
    document.getElementById("activityId").value = post.id;
    document.getElementById("activityTitle").value = post.title;
    document.getElementById("activityType").value = post.activity_type || "";
    document.getElementById("activityDifficulty").value = post.difficulty || "";
    document.getElementById("activityDuration").value = post.duration || "";
    document.getElementById("activityPoints").value = post.points || "";
    document.getElementById("activityDescription").value = post.content;
    document.getElementById("activityInstructions").value =
        post.instructions || "";
    document.getElementById("activityResources").value = post.resources || "";
    document.getElementById("activityTags").value = Array.isArray(post.tags)
        ? post.tags.join(", ")
        : "";
    document.getElementById("activityStatus").value = post.status;

    document.getElementById("activityModalTitle").textContent = "Sửa hoạt động";
    const modal = new bootstrap.Modal(document.getElementById("activityModal"));
    modal.show();
}

async function savePost() {
    try {
        const form = document.getElementById("postForm");
        const formData = new FormData(form);

        // Validate form
        if (!form.checkValidity()) {
            form.classList.add("was-validated");
            return;
        }

        const saveBtn = document.querySelector("#postModal .btn-primary");
        const btnText = saveBtn.querySelector(".btn-text");
        const spinner = saveBtn.querySelector(".spinner-border");

        // Show loading state
        saveBtn.disabled = true;
        btnText.textContent = isEditing ? "Đang cập nhật..." : "Đang tạo...";
        spinner.classList.remove("d-none");

        // Prepare data
        const postData = {
            title: formData.get("title"),
            category: formData.get("category"),
            excerpt: formData.get("excerpt"),
            content: formData.get("content"),
            tags: formData
                .get("tags")
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag),
            status: formData.get("status"),
        };

        let result;

        if (isEditing) {
            // Update post
            const postId = formData.get("postId");
            result = await Auth.apiRequest(API_ENDPOINTS.POSTS.UPDATE(postId), {
                method: "PUT",
                body: JSON.stringify(postData),
            });
        } else {
            // Create post
            result = await Auth.apiRequest(API_ENDPOINTS.POSTS.CREATE, {
                method: "POST",
                body: JSON.stringify(postData),
            });
        }

        // Success
        showAlert(
            "success",
            isEditing
                ? "Cập nhật bài viết thành công!"
                : "Tạo bài viết thành công!"
        );

        // Close modal
        const modal = bootstrap.Modal.getInstance(
            document.getElementById("postModal")
        );
        modal.hide();

        // Reload posts
        loadPosts(currentPage);
    } catch (error) {
        console.error("Error saving post:", error);
        showAlert("danger", "Lỗi khi lưu bài viết: " + error.message);
    } finally {
        // Reset button state
        const saveBtn = document.querySelector("#postModal .btn-primary");
        const btnText = saveBtn.querySelector(".btn-text");
        const spinner = saveBtn.querySelector(".spinner-border");

        saveBtn.disabled = false;
        btnText.textContent = "Lưu";
        spinner.classList.add("d-none");
    }
}

async function saveEvent() {
    try {
        const form = document.getElementById("eventForm");
        const formData = new FormData(form);

        // Validate form
        if (!form.checkValidity()) {
            form.classList.add("was-validated");
            return;
        }

        const saveBtn = document.querySelector("#eventModal .btn-primary");
        const btnText = saveBtn.querySelector(".btn-text");
        const spinner = saveBtn.querySelector(".spinner-border");

        // Show loading state
        saveBtn.disabled = true;
        btnText.textContent = isEditing ? "Đang cập nhật..." : "Đang tạo...";
        spinner.classList.remove("d-none");

        // Prepare data
        const eventData = {
            title: formData.get("title"),
            post_type: "event",
            content: formData.get("content"),
            start_date: formData.get("start_date"),
            end_date: formData.get("end_date"),
            location: formData.get("location"),
            capacity: formData.get("capacity")
                ? parseInt(formData.get("capacity"))
                : null,
            requirements: formData.get("requirements"),
            tags: formData
                .get("tags")
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag),
            status: formData.get("status"),
        };

        let result;

        if (isEditing) {
            const eventId = formData.get("eventId");
            result = await Auth.apiRequest(
                API_ENDPOINTS.POSTS.UPDATE(eventId),
                {
                    method: "PUT",
                    body: JSON.stringify(eventData),
                }
            );
        } else {
            result = await Auth.apiRequest(API_ENDPOINTS.POSTS.CREATE, {
                method: "POST",
                body: JSON.stringify(eventData),
            });
        }

        // Success
        showAlert(
            "success",
            isEditing
                ? "Cập nhật sự kiện thành công!"
                : "Tạo sự kiện thành công!"
        );

        // Close modal
        const modal = bootstrap.Modal.getInstance(
            document.getElementById("eventModal")
        );
        modal.hide();

        // Reload posts
        loadPosts(currentPage);
    } catch (error) {
        console.error("Error saving event:", error);
        showAlert("danger", "Lỗi khi lưu sự kiện: " + error.message);
    } finally {
        // Reset button state
        const saveBtn = document.querySelector("#eventModal .btn-primary");
        const btnText = saveBtn.querySelector(".btn-text");
        const spinner = saveBtn.querySelector(".spinner-border");

        saveBtn.disabled = false;
        btnText.textContent = "Lưu";
        spinner.classList.add("d-none");
    }
}

async function saveActivity() {
    try {
        const form = document.getElementById("activityForm");
        const formData = new FormData(form);

        // Validate form
        if (!form.checkValidity()) {
            form.classList.add("was-validated");
            return;
        }

        const saveBtn = document.querySelector("#activityModal .btn-primary");
        const btnText = saveBtn.querySelector(".btn-text");
        const spinner = saveBtn.querySelector(".spinner-border");

        // Show loading state
        saveBtn.disabled = true;
        btnText.textContent = isEditing ? "Đang cập nhật..." : "Đang tạo...";
        spinner.classList.remove("d-none");

        // Prepare data
        const activityData = {
            title: formData.get("title"),
            post_type: "activity",
            content: formData.get("content"),
            activity_type: formData.get("activity_type"),
            difficulty: formData.get("difficulty"),
            duration: formData.get("duration")
                ? parseInt(formData.get("duration"))
                : null,
            points: formData.get("points")
                ? parseInt(formData.get("points"))
                : null,
            instructions: formData.get("instructions"),
            resources: formData.get("resources"),
            tags: formData
                .get("tags")
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag),
            status: formData.get("status"),
        };

        let result;

        if (isEditing) {
            const activityId = formData.get("activityId");
            result = await Auth.apiRequest(
                API_ENDPOINTS.POSTS.UPDATE(activityId),
                {
                    method: "PUT",
                    body: JSON.stringify(activityData),
                }
            );
        } else {
            result = await Auth.apiRequest(API_ENDPOINTS.POSTS.CREATE, {
                method: "POST",
                body: JSON.stringify(activityData),
            });
        }

        // Success
        showAlert(
            "success",
            isEditing
                ? "Cập nhật hoạt động thành công!"
                : "Tạo hoạt động thành công!"
        );

        // Close modal
        const modal = bootstrap.Modal.getInstance(
            document.getElementById("activityModal")
        );
        modal.hide();

        // Reload posts
        loadPosts(currentPage);
    } catch (error) {
        console.error("Error saving activity:", error);
        showAlert("danger", "Lỗi khi lưu hoạt động: " + error.message);
    } finally {
        // Reset button state
        const saveBtn = document.querySelector("#activityModal .btn-primary");
        const btnText = saveBtn.querySelector(".btn-text");
        const spinner = saveBtn.querySelector(".spinner-border");

        saveBtn.disabled = false;
        btnText.textContent = "Lưu";
        spinner.classList.add("d-none");
    }
}

async function deletePost(postId, title) {
    if (!confirm(`Bạn có chắc chắn muốn xóa bài viết "${title}"?`)) {
        return;
    }

    try {
        await Auth.apiRequest(API_ENDPOINTS.POSTS.DELETE(postId), {
            method: "DELETE",
        });

        showAlert("success", "Xóa bài viết thành công!");
        loadPosts(currentPage);
    } catch (error) {
        console.error("Error deleting post:", error);
        showAlert("danger", "Lỗi khi xóa bài viết: " + error.message);
    }
}

function viewPost(postId) {
    // Open post in new tab (would need a public post view page)
    window.open(`../Preview/detail.html?id=${postId}`, "_blank");
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

function getTypeIcon(type) {
    const icons = {
        post: "fas fa-newspaper",
        event: "fas fa-calendar-alt",
        activity: "fas fa-tasks",
    };
    return icons[type] || "fas fa-newspaper";
}

function getTypeBadgeColor(type) {
    const colors = {
        post: "primary",
        event: "warning",
        activity: "info",
    };
    return colors[type] || "primary";
}

function getTypeText(type) {
    const texts = {
        post: "Bài viết",
        event: "Sự kiện",
        activity: "Hoạt động",
    };
    return texts[type] || "Bài viết";
}

function getCategoryText(category) {
    const categories = {
        "quantum-basics": "Cơ bản Quantum",
        "quantum-gates": "Cổng Quantum",
        algorithms: "Thuật toán",
        applications: "Ứng dụng",
        news: "Tin tức",
    };
    return categories[category] || category;
}

function getStatusBadgeColor(status) {
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

// Event handlers
async function handleLogout(e) {
    e.preventDefault();

    if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
        try {
            await Auth.logout();
            window.location.href = "login.html";
        } catch (error) {
            console.error("Logout error:", error);
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
