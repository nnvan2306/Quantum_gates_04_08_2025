// API Configuration
const API_BASE_URL = "http://localhost:3001/api";

// API Endpoints
const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    PROFILE: "/auth/profile",
    UPDATE_PROFILE: "/auth/profile",
    CHANGE_PASSWORD: "/auth/change-password",
    LOGOUT: "/auth/logout",
    VERIFY_TOKEN: "/auth/verify-token",
    INTERACTIONS: "/auth/interactions",
    UPLOAD_AVATAR: "/auth/upload-avatar",
  },

  // Posts endpoints
  POSTS: {
    LIST: "/posts",
    CREATE: "/posts",
    GET: (id) => `/posts/${id}`,
    UPDATE: (id) => `/posts/${id}`,
    DELETE: (id) => `/posts/${id}`,
    LIKE: (id) => `/posts/${id}/like`,
    POPULAR: "/posts/popular",
    RECENT: "/posts/recent",
    SEARCH: "/posts/search",
    CATEGORY: (category) => `/posts/category/${category}`,
    STATS: "/posts/stats",
    USER_POSTS: "/posts/user/my-posts",
    MY_POSTS: "/posts/user/my-posts",
    DETAIL: (id) => `/posts/${id}`,
  },

  // History endpoints
  HISTORY: {
    MY_HISTORY: "/history/my-history",
    MY_STATS: "/history/my-stats",
    ALL: "/history/all",
    STATS: "/history/stats",
    USER: (userId) => `/history/user/${userId}`,
  },

  // Admin endpoints
  ADMIN: {
    DASHBOARD_STATS: "/admin/dashboard/stats",
    USERS: "/admin/users",
    USER: (userId) => `/admin/users/${userId}`,
    UPDATE_USER: (userId) => `/admin/users/${userId}`,
    DELETE_USER: (userId) => `/admin/users/${userId}`,
  },
};

// Local Storage Keys
const STORAGE_KEYS = {
  TOKEN: "quantum_gates_token",
  USER: "quantum_gates_user",
  REMEMBER_ME: "quantum_gates_remember",
};

// User Roles
const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
  MODERATOR: "moderator",
};

// Post Status
const POST_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

// User Status
const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  BANNED: "banned",
};

// Interaction Types
const INTERACTION_TYPES = {
  LOGIN: "login",
  LOGOUT: "logout",
  POST_VIEW: "post_view",
  POST_LIKE: "post_like",
  POST_COMMENT: "post_comment",
  SIMULATION_RUN: "simulation_run",
  GATE_OPERATION: "gate_operation",
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// Date formats
const DATE_FORMATS = {
  DISPLAY: "DD/MM/YYYY HH:mm",
  API: "YYYY-MM-DD",
  FULL: "DD/MM/YYYY HH:mm:ss",
};

// Validation patterns
const VALIDATION = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_]{3,50}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/,
};

// Error messages
const ERROR_MESSAGES = {
  NETWORK_ERROR: "Lỗi kết nối mạng. Vui lòng thử lại.",
  UNAUTHORIZED: "Bạn không có quyền truy cập.",
  FORBIDDEN: "Truy cập bị từ chối.",
  NOT_FOUND: "Không tìm thấy dữ liệu.",
  SERVER_ERROR: "Lỗi máy chủ. Vui lòng thử lại sau.",
  VALIDATION_ERROR: "Dữ liệu không hợp lệ.",
  TOKEN_EXPIRED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
};

// Success messages
const SUCCESS_MESSAGES = {
  LOGIN: "Đăng nhập thành công!",
  REGISTER: "Đăng ký thành công!",
  LOGOUT: "Đăng xuất thành công!",
  UPDATE_PROFILE: "Cập nhật thông tin thành công!",
  CHANGE_PASSWORD: "Đổi mật khẩu thành công!",
  CREATE_POST: "Tạo bài viết thành công!",
  UPDATE_POST: "Cập nhật bài viết thành công!",
  DELETE_POST: "Xóa bài viết thành công!",
  CREATE_USER: "Tạo người dùng thành công!",
  UPDATE_USER: "Cập nhật người dùng thành công!",
  DELETE_USER: "Xóa người dùng thành công!",
};

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    API_BASE_URL,
    API_ENDPOINTS,
    STORAGE_KEYS,
    USER_ROLES,
    POST_STATUS,
    USER_STATUS,
    INTERACTION_TYPES,
    PAGINATION,
    DATE_FORMATS,
    VALIDATION,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
  };
}
