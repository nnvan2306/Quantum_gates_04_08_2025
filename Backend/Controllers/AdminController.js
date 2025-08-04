const { validationResult } = require('express-validator');
const User = require('../Models/User');
const Post = require('../Models/Post');
const History = require('../Models/History');
const { insertRecord } = require('../db');

class AdminController {
    // Get all users (admin only)
    static async getAllUsers(req, res) {
        try {
            const user = req.user;

            // Check if user is admin
            if (user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin role required.'
                });
            }

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                role: req.query.role,
                status: req.query.status,
                search: req.query.search
            };

            // Remove undefined filters
            Object.keys(filters).forEach(key => {
                if (filters[key] === undefined) {
                    delete filters[key];
                }
            });

            const result = await User.getAll(page, limit, filters);

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to get users',
                    error: result.error
                });
            }

            res.json({
                success: true,
                data: result.data
            });

        } catch (error) {
            console.error('Get all users error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Get user by ID (admin only)
    static async getUserById(req, res) {
        try {
            const user = req.user;
            const { userId } = req.params;

            // Check if user is admin
            if (user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin role required.'
                });
            }

            const result = await User.findById(userId);

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to get user',
                    error: result.error
                });
            }

            if (!result.data) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                data: {
                    user: result.data.toJSON()
                }
            });

        } catch (error) {
            console.error('Get user by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Update user (admin only)
    static async updateUser(req, res) {
        try {
            const adminUser = req.user;
            const { userId } = req.params;

            // Check if user is admin
            if (adminUser.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin role required.'
                });
            }

            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            // Get user
            const userResult = await User.findById(userId);
            if (!userResult.success || !userResult.data) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const user = userResult.data;
            const { username, email, full_name, role, status } = req.body;

            // Store old values for logging
            const oldValues = {
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                status: user.status
            };

            // Update user
            const result = await user.update({
                username,
                email,
                full_name,
                role,
                status
            });

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update user',
                    error: result.error
                });
            }

            // Log admin action
            await AdminController.logAdminAction(
                adminUser.id,
                'user_update',
                'user',
                user.id,
                oldValues,
                { username, email, full_name, role, status },
                `Updated user ${user.username}`,
                req
            );

            res.json({
                success: true,
                message: 'User updated successfully',
                data: {
                    user: result.data.toJSON()
                }
            });

        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Delete user (admin only)
    static async deleteUser(req, res) {
        try {
            const adminUser = req.user;
            const { userId } = req.params;

            // Check if user is admin
            if (adminUser.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin role required.'
                });
            }

            // Prevent admin from deleting themselves
            if (adminUser.id == userId) {
                return res.status(400).json({
                    success: false,
                    message: 'You cannot delete your own account'
                });
            }

            // Get user
            const userResult = await User.findById(userId);
            if (!userResult.success || !userResult.data) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const user = userResult.data;

            // Delete user (soft delete)
            const result = await user.delete();

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to delete user',
                    error: result.error
                });
            }

            // Log admin action
            await AdminController.logAdminAction(
                adminUser.id,
                'user_delete',
                'user',
                user.id,
                { status: user.status },
                { status: 'inactive' },
                `Deleted user ${user.username}`,
                req
            );

            res.json({
                success: true,
                message: 'User deleted successfully'
            });

        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Get dashboard statistics (admin only)
    static async getDashboardStats(req, res) {
        try {
            const user = req.user;

            // Check if user is admin
            if (user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin role required.'
                });
            }

            // Get statistics from all models
            const [userStats, postStats, historyStats] = await Promise.all([
                User.getStats(),
                Post.getStats(),
                History.getStats()
            ]);

            if (!userStats.success || !postStats.success || !historyStats.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to get dashboard statistics'
                });
            }

            res.json({
                success: true,
                data: {
                    users: userStats.data,
                    posts: postStats.data,
                    interactions: historyStats.data
                }
            });

        } catch (error) {
            console.error('Get dashboard stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Helper method to log admin actions
    static async logAdminAction(adminId, action, targetType, targetId, oldValues, newValues, description, req) {
        try {
            const query = `
                INSERT INTO admin_logs 
                (admin_id, action, target_type, target_id, old_values, new_values, description, ip_address)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const params = [
                adminId,
                action,
                targetType,
                targetId,
                JSON.stringify(oldValues),
                JSON.stringify(newValues),
                description,
                req.ip || req.connection.remoteAddress
            ];

            await insertRecord(query, params);
        } catch (error) {
            console.error('Failed to log admin action:', error);
            // Don't throw error as this is not critical
        }
    }
}

module.exports = AdminController;
