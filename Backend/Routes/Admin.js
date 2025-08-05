const express = require('express');
const router = express.Router();
const AdminController = require('../Controllers/AdminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { userValidation, paramValidation, queryValidation } = require('../middleware/validation');

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard/stats', AdminController.getDashboardStats);

// User management
router.get('/users', queryValidation.pagination, AdminController.getAllUsers);
router.get('/users/:userId', paramValidation.userId, AdminController.getUserById);
router.put('/users/:userId', paramValidation.userId, userValidation.adminUpdate, AdminController.updateUser);
router.post('/users/create/new', AdminController.createUser);
router.delete('/users/:userId', paramValidation.userId, AdminController.deleteUser);

module.exports = router;
