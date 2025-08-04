// Authentication utilities
class Auth {
  // Save token to localStorage
  static saveToken(token) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  }

  // Get token from localStorage
  static getToken() {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  // Remove token from localStorage
  static removeToken() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  }

  // Save user info to localStorage
  static saveUser(user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  // Get user info from localStorage
  static getUser() {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Remove user info from localStorage
  static removeUser() {
    localStorage.removeItem(STORAGE_KEYS.USER);
  }

  // Check if user is logged in
  static isLoggedIn() {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  // Check if user is admin
  static isAdmin() {
    const user = this.getUser();
    return user && user.role === USER_ROLES.ADMIN;
  }

  // Check if user is moderator or admin
  static isModerator() {
    const user = this.getUser();
    return (
      user &&
      (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.MODERATOR)
    );
  }

  // Get authorization headers
  static getAuthHeaders() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Update user data in localStorage
  static updateUser(userData) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
  }

  // Logout user
  static async logout() {
    try {
      // Call logout API
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGOUT}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...this.getAuthHeaders(),
          },
        }
      );

      // Clear local storage regardless of API response
      this.removeToken();
      this.removeUser();
      localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);

      return true;
    } catch (error) {
      console.error("Logout error:", error);
      // Clear local storage even if API call fails
      this.removeToken();
      this.removeUser();
      localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
      return false;
    }
  }

  // Verify token with server
  static async verifyToken() {
    try {
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH.VERIFY_TOKEN}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...this.getAuthHeaders(),
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        // Update user info if token is valid
        this.saveUser(result.data.user);
        return true;
      } else {
        // Clear invalid token
        this.removeToken();
        this.removeUser();
        return false;
      }
    } catch (error) {
      console.error("Token verification error:", error);
      return false;
    }
  }

  // Redirect to login if not authenticated
  static requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = "login.html";
      return false;
    }
    return true;
  }

  // Redirect to login if not admin
  static requireAdmin() {
    if (!this.isLoggedIn()) {
      window.location.href = "login.html";
      return false;
    }

    if (!this.isAdmin()) {
      alert("Bạn không có quyền truy cập trang này.");
      window.location.href = "dashboard.html";
      return false;
    }

    return true;
  }

  // Redirect to login if not moderator
  static requireModerator() {
    if (!this.isLoggedIn()) {
      window.location.href = "login.html";
      return false;
    }

    if (!this.isModerator()) {
      alert("Bạn không có quyền truy cập trang này.");
      window.location.href = "dashboard.html";
      return false;
    }

    return true;
  }

  // Handle API response errors
  static handleApiError(response, result) {
    if (response.status === 401) {
      // Unauthorized - token expired or invalid
      this.removeToken();
      this.removeUser();
      window.location.href = "login.html";
      return ERROR_MESSAGES.TOKEN_EXPIRED;
    } else if (response.status === 403) {
      return ERROR_MESSAGES.FORBIDDEN;
    } else if (response.status === 404) {
      return ERROR_MESSAGES.NOT_FOUND;
    } else if (response.status >= 500) {
      return ERROR_MESSAGES.SERVER_ERROR;
    } else {
      return result.message || ERROR_MESSAGES.VALIDATION_ERROR;
    }
  }

  // Make authenticated API request
  static async apiRequest(url, options = {}) {
    try {
      const defaultOptions = {
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeaders(),
        },
      };

      const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers,
        },
      };

      const response = await fetch(`${API_BASE_URL}${url}`, mergedOptions);
      const result = await response.json();

      if (!response.ok) {
        const errorMessage = this.handleApiError(response, result);
        throw new Error(errorMessage);
      }

      return result;
    } catch (error) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
      }
      throw error;
    }
  }
}

// Initialize auth check on page load
document.addEventListener("DOMContentLoaded", function () {
  // Skip auth check for login and register pages
  const currentPage = window.location.pathname.split("/").pop();
  const publicPages = ["login.html", "register.html", "forgot-password.html"];

  if (!publicPages.includes(currentPage)) {
    // Verify token for protected pages
    Auth.verifyToken().then((isValid) => {
      if (!isValid && Auth.getToken()) {
        // Token exists but is invalid
        alert(ERROR_MESSAGES.TOKEN_EXPIRED);
        window.location.href = "login.html";
      }
    });
  }
});

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = Auth;
}
