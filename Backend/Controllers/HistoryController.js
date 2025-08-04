const History = require("../Models/History");

class HistoryController {
  // Get current user's interaction history
  static async getUserHistory(req, res) {
    try {
      const user = req.user;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filters = {
        interaction_type: req.query.interaction_type,
        target_type: req.query.target_type,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
      };

      // Remove undefined filters
      Object.keys(filters).forEach((key) => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const result = await History.getUserHistory(
        user.id,
        page,
        limit,
        filters
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: "Failed to get user history",
          error: result.error,
        });
      }

      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error("Get user history error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Get all interactions (admin only)
  static async getAllInteractions(req, res) {
    try {
      const user = req.user;

      // Check if user is admin
      if (user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin role required.",
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filters = {
        user_id: req.query.user_id,
        interaction_type: req.query.interaction_type,
        target_type: req.query.target_type,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
      };

      // Remove undefined filters
      Object.keys(filters).forEach((key) => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const result = await History.getAllInteractions(page, limit, filters);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: "Failed to get interactions",
          error: result.error,
        });
      }

      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error("Get all interactions error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Get interaction statistics for current user
  static async getUserStats(req, res) {
    try {
      const user = req.user;

      const result = await History.getStats(user.id);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: "Failed to get user statistics",
          error: result.error,
        });
      }

      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error("Get user stats error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Get global interaction statistics (admin only)
  static async getGlobalStats(req, res) {
    try {
      const user = req.user;

      // Check if user is admin
      if (user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin role required.",
        });
      }

      const result = await History.getStats();

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: "Failed to get global statistics",
          error: result.error,
        });
      }

      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error("Get global stats error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Get specific user's history (admin only)
  static async getSpecificUserHistory(req, res) {
    try {
      const user = req.user;
      const { userId } = req.params;

      // Check if user is admin
      if (user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin role required.",
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filters = {
        interaction_type: req.query.interaction_type,
        target_type: req.query.target_type,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
      };

      // Remove undefined filters
      Object.keys(filters).forEach((key) => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const result = await History.getUserHistory(userId, page, limit, filters);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: "Failed to get user history",
          error: result.error,
        });
      }

      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error("Get specific user history error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
}

module.exports = HistoryController;
