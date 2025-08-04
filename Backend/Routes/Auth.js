const express = require("express");
const router = express.Router();
const AuthController = require("../Controllers/AuthController");
const { authenticateToken } = require("../middleware/auth");
const { userValidation } = require("../middleware/validation");

// Public routes
router.post("/register", userValidation.register, AuthController.register);
router.post("/login", userValidation.login, AuthController.login);

// Protected routes
router.use(authenticateToken); // Apply authentication to all routes below

router.get("/profile", AuthController.getProfile);
router.put(
  "/profile",
  userValidation.updateProfile,
  AuthController.updateProfile
);
router.put(
  "/change-password",
  userValidation.changePassword,
  AuthController.changePassword
);
router.post("/logout", AuthController.logout);
router.get("/verify-token", AuthController.verifyToken);
router.get("/interactions", AuthController.getUserInteractions);

module.exports = router;
