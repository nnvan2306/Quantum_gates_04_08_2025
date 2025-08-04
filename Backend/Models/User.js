const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  findOne,
  insertRecord,
  updateRecord,
  deleteRecord,
  pool,
} = require("../db");

class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.full_name = data.full_name;
    this.avatar_url = data.avatar_url;
    this.role = data.role;
    this.status = data.status;
    this.email_verified = data.email_verified;
    this.last_login = data.last_login;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Hash password
  static async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Verify password
  async verifyPassword(password) {
    try {
      console.log("Verifying password...");
      console.log("Input password:", password);
      console.log("Stored hash:", this.password_hash);
      console.log(
        "Hash length:",
        this.password_hash ? this.password_hash.length : "null"
      );

      if (!this.password_hash) {
        console.log("No password hash found");
        return false;
      }

      const result = await bcrypt.compare(password, this.password_hash);
      console.log("Bcrypt compare result:", result);
      return result;
    } catch (error) {
      console.error("Password verification error:", error);
      return false;
    }
  }

  // Generate JWT token
  generateToken() {
    return jwt.sign(
      {
        id: this.id,
        username: this.username,
        email: this.email,
        role: this.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
  }

  // Create new user
  static async create(userData) {
    try {
      const hashedPassword = await User.hashPassword(userData.password);

      const query = `
                INSERT INTO users (username, email, password_hash, full_name, role, status)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

      const params = [
        userData.username,
        userData.email,
        hashedPassword,
        userData.full_name || null,
        userData.role || "user",
        userData.status || "active",
      ];

      const result = await insertRecord(query, params);

      if (result.success) {
        return await User.findById(result.insertId);
      }

      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Find user by ID
  static async findById(id) {
    const query = "SELECT * FROM users WHERE id = ?";
    const result = await findOne(query, [id]);

    if (result.success && result.data) {
      return { success: true, data: new User(result.data) };
    }

    return result;
  }

  // Find user by email
  static async findByEmail(email) {
    const query = "SELECT * FROM users WHERE email = ?";
    const result = await findOne(query, [email]);

    if (result.success && result.data) {
      return { success: true, data: new User(result.data) };
    }

    return result;
  }

  // Find user by username
  static async findByUsername(username) {
    const query = "SELECT * FROM users WHERE username = ?";
    const result = await findOne(query, [username]);

    if (result.success && result.data) {
      return { success: true, data: new User(result.data) };
    }

    return result;
  }

  // Get all users with pagination
  static async getAll(page = 1, limit = 10, filters = {}) {
    try {
      // Ensure parameters are valid numbers
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
      const offset = Math.max(0, (pageNum - 1) * limitNum);

      let whereClause = "WHERE 1=1";
      let params = [];

      // Apply filters
      if (filters.role) {
        whereClause += " AND role = ?";
        params.push(filters.role);
      }

      if (filters.status) {
        whereClause += " AND status = ?";
        params.push(filters.status);
      }

      if (filters.search) {
        whereClause +=
          " AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      // Get total count using direct query
      const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
      const [countRows] = await pool.query(countQuery, params);
      const total = countRows[0].total;

      // Get users using direct query
      const query = `
                SELECT id, username, email, full_name, avatar_url, role, status,
                       email_verified, last_login, created_at, updated_at
                FROM users ${whereClause}
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `;

      const queryParams = [...params, limitNum, offset];
      const [rows] = await pool.query(query, queryParams);

      if (rows) {
        const users = rows.map((userData) => new User(userData));
        return {
          success: true,
          data: {
            users,
            pagination: {
              page: pageNum,
              limit: limitNum,
              total,
              totalPages: Math.ceil(total / limitNum),
            },
          },
        };
      }

      return { success: false, error: "No users found" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update user
  async update(updateData) {
    try {
      const allowedFields = [
        "username",
        "email",
        "full_name",
        "avatar_url",
        "role",
        "status",
      ];
      const updates = [];
      const params = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updates.push(`${key} = ?`);
          params.push(value);
        }
      }

      if (updates.length === 0) {
        return { success: false, error: "No valid fields to update" };
      }

      params.push(this.id);
      const query = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;

      const result = await updateRecord(query, params);

      if (result.success) {
        // Refresh user data
        const updatedUser = await User.findById(this.id);
        if (updatedUser.success) {
          Object.assign(this, updatedUser.data);
        }
        return { success: true, data: this };
      }

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update password
  async updatePassword(newPassword) {
    try {
      const hashedPassword = await User.hashPassword(newPassword);
      const query = "UPDATE users SET password_hash = ? WHERE id = ?";

      const result = await updateRecord(query, [hashedPassword, this.id]);

      if (result.success) {
        this.password_hash = hashedPassword;
        return { success: true, message: "Password updated successfully" };
      }

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update last login
  async updateLastLogin() {
    try {
      const query =
        "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?";
      return await updateRecord(query, [this.id]);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Delete user (soft delete by changing status)
  async delete() {
    try {
      const query = "UPDATE users SET status = ? WHERE id = ?";
      return await updateRecord(query, ["inactive", this.id]);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Hard delete user
  static async hardDelete(id) {
    try {
      const query = "DELETE FROM users WHERE id = ?";
      return await deleteRecord(query, [id]);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Verify JWT token
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  // Check if user exists by email or username
  static async exists(email, username) {
    try {
      const query = "SELECT id FROM users WHERE email = ? OR username = ?";
      const result = await findOne(query, [email, username]);
      return result.success && result.data !== null;
    } catch (error) {
      return false;
    }
  }

  // Get user statistics
  static async getStats() {
    try {
      const queries = [
        "SELECT COUNT(*) as total FROM users",
        'SELECT COUNT(*) as active FROM users WHERE status = "active"',
        'SELECT COUNT(*) as admins FROM users WHERE role = "admin"',
        "SELECT COUNT(*) as today FROM users WHERE DATE(created_at) = CURDATE()",
      ];

      const results = await Promise.all(queries.map((query) => findOne(query)));

      if (results.every((r) => r.success)) {
        return {
          success: true,
          data: {
            total: results[0].data.total,
            active: results[1].data.active,
            admins: results[2].data.admins,
            newToday: results[3].data.today,
          },
        };
      }

      return { success: false, error: "Failed to get user statistics" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Convert to JSON (exclude sensitive data)
  toJSON() {
    const { password_hash, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}

module.exports = User;
