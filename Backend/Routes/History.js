const express = require("express");
const router = express.Router();
const HistoryController = require("../Controllers/HistoryController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const {
  paramValidation,
  queryValidation,
} = require("../middleware/validation");

// All routes require authentication
router.use(authenticateToken);

// User routes
router.get(
  "/my-history",
  queryValidation.pagination,
  queryValidation.dateRange,
  HistoryController.getUserHistory
);
router.get("/my-stats", HistoryController.getUserStats);

// Admin routes
router.get(
  "/all",
  requireAdmin,
  queryValidation.pagination,
  queryValidation.dateRange,
  HistoryController.getAllInteractions
);
router.get("/stats", requireAdmin, HistoryController.getGlobalStats);
router.get(
  "/user/:userId",
  requireAdmin,
  paramValidation.userId,
  queryValidation.pagination,
  queryValidation.dateRange,
  HistoryController.getSpecificUserHistory
);

module.exports = router;
