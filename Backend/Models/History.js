const { executeQuery, findOne, insertRecord, pool } = require("../db");

class History {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.interaction_type = data.interaction_type;
    this.target_type = data.target_type;
    this.target_id = data.target_id;
    this.metadata = data.metadata;
    this.ip_address = data.ip_address;
    this.user_agent = data.user_agent;
    this.created_at = data.created_at;

    // Additional fields from joins
    this.username = data.username;
    this.user_email = data.user_email;
  }

  // Get user interaction history
  static async getUserHistory(userId, page = 1, limit = 20, filters = {}) {
    try {
      // Ensure parameters are valid numbers
      const userIdNum = parseInt(userId);
      if (isNaN(userIdNum) || userIdNum <= 0) {
        return { success: false, error: "Invalid user ID" };
      }

      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
      const offset = Math.max(0, (pageNum - 1) * limitNum);

      let whereClause = "WHERE ui.user_id = ?";
      let params = [userIdNum];

      // Apply filters
      if (filters.interaction_type) {
        whereClause += " AND ui.interaction_type = ?";
        params.push(filters.interaction_type);
      }

      if (filters.target_type) {
        whereClause += " AND ui.target_type = ?";
        params.push(filters.target_type);
      }

      if (filters.date_from) {
        whereClause += " AND DATE(ui.created_at) >= ?";
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        whereClause += " AND DATE(ui.created_at) <= ?";
        params.push(filters.date_to);
      }

      // Get total count using direct query
      const countQuery = `SELECT COUNT(*) as total FROM user_interactions ui ${whereClause}`;
      console.log("Count query:", countQuery);
      console.log("Count params:", params);

      const [countRows] = await pool.query(countQuery, params);
      const total = countRows[0].total;

      // Get interactions
      const query = `
                SELECT ui.*, u.username, u.email as user_email
                FROM user_interactions ui
                LEFT JOIN users u ON ui.user_id = u.id
                ${whereClause}
                ORDER BY ui.created_at DESC
                LIMIT ? OFFSET ?
            `;

      const queryParams = [...params, limitNum, offset];
      console.log("Query:", query);
      console.log("Params:", queryParams);

      // Use direct pool.query instead of executeQuery
      const [rows] = await pool.query(query, queryParams);

      if (rows) {
        const interactions = rows.map((data) => {
          // Parse metadata if it exists
          if (data.metadata) {
            try {
              data.metadata = JSON.parse(data.metadata);
            } catch (e) {
              data.metadata = {};
            }
          }
          return new History(data);
        });

        return {
          success: true,
          data: {
            interactions,
            pagination: {
              page: pageNum,
              limit: limitNum,
              total,
              totalPages: Math.ceil(total / limitNum),
            },
          },
        };
      }

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get all interactions (admin only)
  static async getAllInteractions(page = 1, limit = 20, filters = {}) {
    try {
      // Ensure parameters are valid numbers
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
      const offset = Math.max(0, (pageNum - 1) * limitNum);

      let whereClause = "WHERE 1=1";
      let params = [];

      // Apply filters
      if (filters.user_id) {
        const userId = parseInt(filters.user_id);
        if (!isNaN(userId) && userId > 0) {
          whereClause += " AND ui.user_id = ?";
          params.push(userId);
        }
      }

      if (filters.interaction_type) {
        whereClause += " AND ui.interaction_type = ?";
        params.push(filters.interaction_type);
      }

      if (filters.target_type) {
        whereClause += " AND ui.target_type = ?";
        params.push(filters.target_type);
      }

      if (filters.date_from) {
        whereClause += " AND DATE(ui.created_at) >= ?";
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        whereClause += " AND DATE(ui.created_at) <= ?";
        params.push(filters.date_to);
      }

      // Get total count using direct query
      const countQuery = `SELECT COUNT(*) as total FROM user_interactions ui ${whereClause}`;
      const [countRows] = await pool.query(countQuery, params);
      const total = countRows[0].total;

      // Get interactions using direct query
      const query = `
                SELECT ui.*, u.username, u.email as user_email
                FROM user_interactions ui
                LEFT JOIN users u ON ui.user_id = u.id
                ${whereClause}
                ORDER BY ui.created_at DESC
                LIMIT ? OFFSET ?
            `;

      const queryParams = [...params, limitNum, offset];
      const [rows] = await pool.query(query, queryParams);

      if (rows) {
        const interactions = rows.map((data) => {
          // Parse metadata if it exists
          if (data.metadata) {
            try {
              data.metadata = JSON.parse(data.metadata);
            } catch (e) {
              data.metadata = {};
            }
          }
          return new History(data);
        });

        return {
          success: true,
          data: {
            interactions,
            pagination: {
              page: pageNum,
              limit: limitNum,
              total,
              totalPages: Math.ceil(total / limitNum),
            },
          },
        };
      }

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get interaction statistics
  static async getStats(userId = null) {
    try {
      let whereClause = "";
      let params = [];

      if (userId) {
        whereClause = "WHERE user_id = ?";
        params = [userId];
      }

      const queries = [
        `SELECT COUNT(*) as total FROM user_interactions ${whereClause}`,
        `SELECT COUNT(*) as today FROM user_interactions ${whereClause} ${
          whereClause ? "AND" : "WHERE"
        } DATE(created_at) = CURDATE()`,
        `SELECT COUNT(*) as this_week FROM user_interactions ${whereClause} ${
          whereClause ? "AND" : "WHERE"
        } WEEK(created_at) = WEEK(CURDATE())`,
        `SELECT interaction_type, COUNT(*) as count FROM user_interactions ${whereClause} GROUP BY interaction_type ORDER BY count DESC LIMIT 5`,
      ];

      const results = await Promise.all(
        queries.map((query) => {
          if (query.includes("GROUP BY")) {
            return executeQuery(query, params);
          } else {
            return findOne(query, params);
          }
        })
      );

      if (results.slice(0, 3).every((r) => r.success) && results[3].success) {
        return {
          success: true,
          data: {
            total: results[0].data.total,
            today: results[1].data.today,
            thisWeek: results[2].data.this_week,
            topInteractions: results[3].data,
          },
        };
      }

      return { success: false, error: "Failed to get interaction statistics" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      interaction_type: this.interaction_type,
      target_type: this.target_type,
      target_id: this.target_id,
      metadata: this.metadata,
      ip_address: this.ip_address,
      user_agent: this.user_agent,
      created_at: this.created_at,
      username: this.username,
      user_email: this.user_email,
    };
  }
}

module.exports = History;
