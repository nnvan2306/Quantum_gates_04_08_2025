const { validationResult } = require("express-validator");
const User = require("../Models/User");
const { insertRecord } = require("../db");

class AuthController {
  // Register new user
  static async register(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { username, email, password, full_name } = req.body;

      // Check if user already exists
      const existingUser = await User.exists(email, username);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "User with this email or username already exists",
        });
      }

      // Create new user
      const result = await User.create({
        username,
        email,
        password,
        full_name,
        role: "user",
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: "Failed to create user",
          error: result.error,
        });
      }

      // Log user interaction
      await AuthController.logUserInteraction(result.data.id, "register", req);

      // Generate token
      const token = result.data.generateToken();

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: result.data.toJSON(),
          token,
        },
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Login user
  static async login(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;
      // Find user by email
      const userResult = await User.findByEmail(email);
      if (!userResult.success || !userResult.data) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const user = userResult.data;

      // Check if user is active
      if (user.status !== "active") {
        return res.status(401).json({
          success: false,
          message: "Account is inactive or banned",
        });
      }

      // Verify password
      const isValidPassword = await user.verifyPassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // Update last login
      await user.updateLastLogin();

      // Log user interaction
      await AuthController.logUserInteraction(user.id, "login", req);

      // Generate token
      const token = user.generateToken();

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: user.toJSON(),
          token,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      const user = req.user; // Set by auth middleware

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
        },
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const user = req.user;
      const { username, full_name, avatar_url } = req.body;

      // Check if username is already taken by another user
      if (username && username !== user.username) {
        const existingUser = await User.findByUsername(username);
        if (
          existingUser.success &&
          existingUser.data &&
          existingUser.data.id !== user.id
        ) {
          return res.status(409).json({
            success: false,
            message: "Username is already taken",
          });
        }
      }

      // Update user
      const result = await user.update({
        username,
        full_name,
        avatar_url,
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: "Failed to update profile",
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          user: result.data.toJSON(),
        },
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Change password
  static async changePassword(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const user = req.user;
      const { currentPassword, newPassword } = req.body;

      // Verify current password
      const isValidPassword = await user.verifyPassword(currentPassword);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Update password
      const result = await user.updatePassword(newPassword);
      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: "Failed to update password",
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Logout (client-side token removal, server-side logging)
  static async logout(req, res) {
    try {
      const user = req.user;

      // Log user interaction
      await AuthController.logUserInteraction(user.id, "logout", req);

      res.json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Verify token
  static async verifyToken(req, res) {
    try {
      const user = req.user; // Set by auth middleware

      res.json({
        success: true,
        message: "Token is valid",
        data: {
          user: user.toJSON(),
        },
      });
    } catch (error) {
      console.error("Verify token error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Helper method to log user interactions
  static async logUserInteraction(
    userId,
    interactionType,
    req,
    targetType = "system",
    targetId = null,
    metadata = {}
  ) {
    try {
      const query = `
                INSERT INTO user_interactions
                (user_id, interaction_type, target_type, target_id, metadata, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

      const params = [
        userId,
        interactionType,
        targetType,
        targetId,
        JSON.stringify({
          ...metadata,
          timestamp: new Date().toISOString(),
        }),
        req.ip || req.connection.remoteAddress,
        req.get("User-Agent") || "Unknown",
      ];

      await insertRecord(query, params);
    } catch (error) {
      console.error("Failed to log user interaction:", error);
      // Don't throw error as this is not critical
    }
  }

  // Get user interaction history
  static async getUserInteractions(req, res) {
    try {
      const user = req.user;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const query = `
                SELECT interaction_type, target_type, target_id, metadata,
                       ip_address, created_at
                FROM user_interactions
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `;

      const { executeQuery } = require("../db");
      const result = await executeQuery(query, [user.id, limit, offset]);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: "Failed to get user interactions",
          error: result.error,
        });
      }

      // Get total count
      const countQuery =
        "SELECT COUNT(*) as total FROM user_interactions WHERE user_id = ?";
      const countResult = await executeQuery(countQuery, [user.id]);
      const total = countResult.success ? countResult.data[0].total : 0;

      res.json({
        success: true,
        data: {
          interactions: result.data,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error("Get user interactions error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
}

module.exports = AuthController;
