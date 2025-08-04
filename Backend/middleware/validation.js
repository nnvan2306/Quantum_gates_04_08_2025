const { body, param, query } = require('express-validator');

// User validation rules
const userValidation = {
    register: [
        body('username')
            .isLength({ min: 3, max: 50 })
            .withMessage('Username must be between 3 and 50 characters')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username can only contain letters, numbers, and underscores'),
        
        body('email')
            .isEmail()
            .withMessage('Please provide a valid email address')
            .normalizeEmail(),
        
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
        
        body('full_name')
            .optional()
            .isLength({ min: 2, max: 100 })
            .withMessage('Full name must be between 2 and 100 characters')
    ],

    login: [
        body('email')
            .isEmail()
            .withMessage('Please provide a valid email address')
            .normalizeEmail(),
        
        body('password')
            .notEmpty()
            .withMessage('Password is required')
    ],

    updateProfile: [
        body('username')
            .optional()
            .isLength({ min: 3, max: 50 })
            .withMessage('Username must be between 3 and 50 characters')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username can only contain letters, numbers, and underscores'),
        
        body('full_name')
            .optional()
            .isLength({ min: 2, max: 100 })
            .withMessage('Full name must be between 2 and 100 characters'),
        
        body('avatar_url')
            .optional()
            .isURL()
            .withMessage('Avatar URL must be a valid URL')
    ],

    changePassword: [
        body('currentPassword')
            .notEmpty()
            .withMessage('Current password is required'),
        
        body('newPassword')
            .isLength({ min: 6 })
            .withMessage('New password must be at least 6 characters long')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
    ],

    adminUpdate: [
        body('username')
            .optional()
            .isLength({ min: 3, max: 50 })
            .withMessage('Username must be between 3 and 50 characters')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username can only contain letters, numbers, and underscores'),
        
        body('email')
            .optional()
            .isEmail()
            .withMessage('Please provide a valid email address')
            .normalizeEmail(),
        
        body('full_name')
            .optional()
            .isLength({ min: 2, max: 100 })
            .withMessage('Full name must be between 2 and 100 characters'),
        
        body('role')
            .optional()
            .isIn(['user', 'admin', 'moderator'])
            .withMessage('Role must be user, admin, or moderator'),
        
        body('status')
            .optional()
            .isIn(['active', 'inactive', 'banned'])
            .withMessage('Status must be active, inactive, or banned')
    ]
};

// Post validation rules
const postValidation = {
    create: [
        body('title')
            .isLength({ min: 5, max: 255 })
            .withMessage('Title must be between 5 and 255 characters'),
        
        body('content')
            .isLength({ min: 10 })
            .withMessage('Content must be at least 10 characters long'),
        
        body('excerpt')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Excerpt must not exceed 500 characters'),
        
        body('featured_image')
            .optional()
            .isURL()
            .withMessage('Featured image must be a valid URL'),
        
        body('category')
            .optional()
            .isLength({ min: 2, max: 50 })
            .withMessage('Category must be between 2 and 50 characters'),
        
        body('tags')
            .optional()
            .isArray()
            .withMessage('Tags must be an array'),
        
        body('status')
            .optional()
            .isIn(['draft', 'published', 'archived'])
            .withMessage('Status must be draft, published, or archived')
    ],

    update: [
        body('title')
            .optional()
            .isLength({ min: 5, max: 255 })
            .withMessage('Title must be between 5 and 255 characters'),
        
        body('content')
            .optional()
            .isLength({ min: 10 })
            .withMessage('Content must be at least 10 characters long'),
        
        body('excerpt')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Excerpt must not exceed 500 characters'),
        
        body('featured_image')
            .optional()
            .isURL()
            .withMessage('Featured image must be a valid URL'),
        
        body('category')
            .optional()
            .isLength({ min: 2, max: 50 })
            .withMessage('Category must be between 2 and 50 characters'),
        
        body('tags')
            .optional()
            .isArray()
            .withMessage('Tags must be an array'),
        
        body('status')
            .optional()
            .isIn(['draft', 'published', 'archived'])
            .withMessage('Status must be draft, published, or archived')
    ]
};

// Parameter validation rules
const paramValidation = {
    id: [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID must be a positive integer')
    ],

    userId: [
        param('userId')
            .isInt({ min: 1 })
            .withMessage('User ID must be a positive integer')
    ],

    category: [
        param('category')
            .isLength({ min: 2, max: 50 })
            .withMessage('Category must be between 2 and 50 characters')
            .matches(/^[a-zA-Z0-9_-]+$/)
            .withMessage('Category can only contain letters, numbers, hyphens, and underscores')
    ]
};

// Query validation rules
const queryValidation = {
    pagination: [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100')
    ],

    search: [
        query('q')
            .isLength({ min: 1, max: 100 })
            .withMessage('Search query must be between 1 and 100 characters')
    ],

    dateRange: [
        query('date_from')
            .optional()
            .isISO8601()
            .withMessage('Date from must be a valid ISO 8601 date'),
        
        query('date_to')
            .optional()
            .isISO8601()
            .withMessage('Date to must be a valid ISO 8601 date')
    ]
};

module.exports = {
    userValidation,
    postValidation,
    paramValidation,
    queryValidation
};
