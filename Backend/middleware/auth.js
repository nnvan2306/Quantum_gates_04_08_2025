const jwt = require("jsonwebtoken");
const User = require("../Models/User");

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access token is required",
            });
        }

        // Verify token
        const decoded = User.verifyToken(token);
        if (!decoded) {
            return res.status(403).json({
                success: false,
                message: "Invalid or expired token",
            });
        }

        // Get user from database
        const userResult = await User.findById(decoded.id);
        if (!userResult.success || !userResult.data) {
            return res.status(403).json({
                success: false,
                message: "User not found",
            });
        }

        const user = userResult.data;

        // Check if user is active
        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Account is inactive or banned",
            });
        }

        // Add user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during authentication",
        });
    }
};

// Middleware to verify admin role
const requireAdmin = (req, res, next) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        if (user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin access required",
            });
        }

        next();
    } catch (error) {
        console.error("Admin authorization error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during authorization",
        });
    }
};

// Middleware to verify moderator or admin role
const requireModerator = (req, res, next) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        if (user.role !== "admin" && user.role !== "moderator") {
            return res.status(403).json({
                success: false,
                message: "Moderator or admin access required",
            });
        }

        next();
    } catch (error) {
        console.error("Moderator authorization error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during authorization",
        });
    }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            req.user = null;
            return next();
        }

        // Verify token
        const decoded = User.verifyToken(token);
        if (!decoded) {
            req.user = null;
            return next();
        }

        // Get user from database
        const userResult = await User.findById(decoded.id);
        if (!userResult.success || !userResult.data) {
            req.user = null;
            return next();
        }

        const user = userResult.data;

        // Check if user is active
        if (user.status !== "active") {
            req.user = null;
            return next();
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Optional authentication error:", error);
        req.user = null;
        next();
    }
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requireModerator,
    optionalAuth,
};
