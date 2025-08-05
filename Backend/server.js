const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
require("dotenv").config();

const { testConnection } = require("./db");

// Import routes
const authRoutes = require("./Routes/Auth");
const postRoutes = require("./Routes/Posts");
const historyRoutes = require("./Routes/History");
const adminRoutes = require("./Routes/Admin");

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
    cors({
        origin:
            process.env.NODE_ENV === "production"
                ? ["https://yourdomain.com"] // Replace with your frontend domain
                : ["http://127.0.0.1:5501", "http://localhost:5501", "http://127.0.0.1:5500", "http://localhost:5500"],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: "Too many requests from this IP, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Trust proxy (for getting real IP addresses)
app.set("trust proxy", 1);

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
    });
});

// API Documentation
app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: "Quantum Gates API Documentation",
    })
);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/admin", adminRoutes);

// Root endpoint
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Quantum Gates Backend API",
        version: "1.0.0",
        endpoints: {
            auth: "/api/auth",
            posts: "/api/posts",
            history: "/api/history",
            admin: "/api/admin",
            health: "/health",
        },
        documentation: "/api/docs", // Future endpoint for API documentation
    });
});

// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        message: "Endpoint not found",
        path: req.originalUrl,
        method: req.method,
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error("Global error handler:", error);

    // Handle specific error types
    if (error.type === "entity.parse.failed") {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON in request body",
        });
    }

    if (error.type === "entity.too.large") {
        return res.status(413).json({
            success: false,
            message: "Request body too large",
        });
    }

    // Default error response
    res.status(error.status || 500).json({
        success: false,
        message: error.message || "Internal server error",
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
});

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);

    server.close(() => {
        console.log("HTTP server closed.");
        process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
        console.error(
            "Could not close connections in time, forcefully shutting down"
        );
        process.exit(1);
    }, 10000);
};

// Start server
const startServer = async () => {
    try {
        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error("❌ Failed to connect to database. Exiting...");
            process.exit(1);
        }

        // Start HTTP server
        const server = app.listen(PORT, () => {
            console.log("🚀 Quantum Gates Backend Server Started");
            console.log(`📡 Server running on port ${PORT}`);
            console.log(
                `🌍 Environment: ${process.env.NODE_ENV || "development"}`
            );
            console.log(`📋 API Base URL: http://localhost:${PORT}/api`);
            console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
            console.log("📚 Available endpoints:");
            console.log("   - Auth: /api/auth");
            console.log("   - Posts: /api/posts");
            console.log("   - History: /api/history");
            console.log("   - Admin: /api/admin");
        });

        // Handle graceful shutdown
        process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
        process.on("SIGINT", () => gracefulShutdown("SIGINT"));

        return server;
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

// Start the server
const server = startServer();

module.exports = app;
