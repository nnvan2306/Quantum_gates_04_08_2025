const express = require("express");
const router = express.Router();
const PostController = require("../Controllers/PostController");
const {
    authenticateToken,
    optionalAuth,
    requireModerator,
} = require("../middleware/auth");
const {
    postValidation,
    paramValidation,
    queryValidation,
} = require("../middleware/validation");

// Public routes
router.get("/", queryValidation.pagination, PostController.getAll);
router.get("/popular", PostController.getPopular);
router.get("/recent", PostController.getRecent);
router.get(
    "/search",
    queryValidation.search,
    queryValidation.pagination,
    PostController.search
);
router.get(
    "/category/:category",
    paramValidation.category,
    queryValidation.pagination,
    PostController.getByCategory
);
router.get("/stats", PostController.getStats);
router.get("/:id", paramValidation.id, optionalAuth, PostController.getById);
// Protected routes
router.use(authenticateToken); // Apply authentication to all routes below
router.post("/like/:id", paramValidation.id, PostController.toggleLike);
router.post("/", postValidation.create, PostController.create);
router.get(
    "/user/my-posts",
    queryValidation.pagination,
    PostController.getUserPosts
);
router.post("/check/:id", paramValidation.id, PostController.checkLiked);
router.put(
    "/:id",
    paramValidation.id,
    postValidation.update,
    PostController.update
);
router.delete("/:id", paramValidation.id, PostController.delete);

module.exports = router;
