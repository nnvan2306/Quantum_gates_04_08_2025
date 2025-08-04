const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const Post = require("../Models/Post");
const Reaction = require("../Models/Reaction");
const Comment = require("../Models/Comment");
const AuthController = require("./AuthController");

class PostController {
    // Create new post
    static async create(req, res) {
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
            const {
                title,
                content,
                excerpt,
                featured_image,
                category,
                tags,
                status,
                post_type,
                // Event fields
                start_date,
                end_date,
                location,
                capacity,
                requirements,
                // Activity fields
                activity_type,
                difficulty,
                duration,
                points,
                instructions,
                resources,
            } = req.body;

            // Create post
            const result = await Post.create({
                title,
                content,
                excerpt,
                featured_image,
                category,
                tags,
                status: status || "draft",
                author_id: user.id,
                post_type,
                start_date,
                end_date,
                location,
                capacity,
                requirements,
                activity_type,
                difficulty,
                duration,
                points,
                instructions,
                resources,
            });

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to create post",
                    error: result.error,
                });
            }

            // Log user interaction
            await AuthController.logUserInteraction(
                user.id,
                "post_create",
                req,
                "post",
                result.data.id,
                { title, status: status || "draft" }
            );

            res.status(201).json({
                success: true,
                message: "Post created successfully",
                data: {
                    post: result.data.toJSON(),
                },
            });
        } catch (error) {
            console.error("Create post error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    }

    // Get all posts
    static async getAll(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                status: req.query.status,
                category: req.query.category,
                author_id: req.query.author_id
                    ? parseInt(req.query.author_id)
                    : undefined,
                search: req.query.search,
                post_type: req.query.post_type,
            };

            // Remove undefined filters
            Object.keys(filters).forEach((key) => {
                if (filters[key] === undefined) {
                    delete filters[key];
                }
            });

            const result = await Post.getAll(page, limit, filters);

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to get posts",
                    error: result.error,
                });
            }

            res.json({
                success: true,
                data: result.data,
            });
        } catch (error) {
            console.error("Get all posts error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    }

    // Get post by ID
    static async getById(req, res) {
        try {
            const { id } = req.params;

            const result = await Post.findById(id);

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to get post",
                    error: result.error,
                });
            }

            if (!result.data) {
                return res.status(404).json({
                    success: false,
                    message: "Post not found",
                });
            }

            // Increment view count if user is not the author
            const user = req.user;
            if (!user || user.id !== result.data.author_id) {
                await result.data.incrementViewCount();

                // Log view interaction if user is logged in
                if (user) {
                    await AuthController.logUserInteraction(
                        user.id,
                        "post_view",
                        req,
                        "post",
                        result.data.id
                    );
                }
            }

            res.json({
                success: true,
                data: {
                    post: result.data.toJSON(),
                },
            });
        } catch (error) {
            console.error("Get post by ID error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    }

    // Update post
    static async update(req, res) {
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

            const { id } = req.params;
            const user = req.user;

            // Get post
            const postResult = await Post.findById(id);
            if (!postResult.success || !postResult.data) {
                return res.status(404).json({
                    success: false,
                    message: "Post not found",
                });
            }

            const post = postResult.data;

            // Check if user is author or admin
            if (post.author_id !== user.id && user.role !== "admin") {
                return res.status(403).json({
                    success: false,
                    message: "You can only edit your own posts",
                });
            }

            const {
                title,
                content,
                excerpt,
                featured_image,
                category,
                tags,
                status,
            } = req.body;

            // Update post
            const result = await post.update({
                title,
                content,
                excerpt,
                featured_image,
                category,
                tags,
                status,
            });

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to update post",
                    error: result.error,
                });
            }

            res.json({
                success: true,
                message: "Post updated successfully",
                data: {
                    post: result.data.toJSON(),
                },
            });
        } catch (error) {
            console.error("Update post error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    }

    // Delete post
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;

            // Get post
            const postResult = await Post.findById(id);
            if (!postResult.success || !postResult.data) {
                return res.status(404).json({
                    success: false,
                    message: "Post not found",
                });
            }

            const post = postResult.data;

            // Check if user is author or admin
            if (post.author_id !== user.id && user.role !== "admin") {
                return res.status(403).json({
                    success: false,
                    message: "You can only delete your own posts",
                });
            }

            // Delete post (soft delete)
            const result = await post.delete();

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to delete post",
                    error: result.error,
                });
            }

            res.json({
                success: true,
                message: "Post deleted successfully",
            });
        } catch (error) {
            console.error("Delete post error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    }

    // Like/Unlike post
    static async toggleLike(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;
            console.log("user >>> ", user);

            // Get post
            const postResult = await Post.findById(Number(id));
            if (!postResult.success || !postResult.data) {
                return res.status(404).json({
                    success: false,
                    message: "Post not found",
                });
            }

            const post = postResult.data;

            // Check if user already liked this post
            const { executeQuery } = require("../db");
            const checkQuery = `
                SELECT id FROM user_interactions
                WHERE user_id = ? AND interaction_type = 'post_like' AND target_id = ?
            `;

            const checkResult = await executeQuery(checkQuery, [
                user.id,
                post.id,
            ]);

            if (!checkResult.success) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to check like status",
                    error: checkResult.error,
                });
            }

            const isLiked = checkResult.data.length > 0;
            let result;

            if (isLiked) {
                // Unlike: remove interaction and decrement count
                const deleteQuery = `
                    DELETE FROM user_interactions
                    WHERE user_id = ? AND interaction_type = 'post_like' AND target_id = ?
                `;
                await executeQuery(deleteQuery, [user.id, post.id]);
                result = await post.decrementLikeCount();
            } else {
                // Like: add interaction and increment count
                await AuthController.logUserInteraction(
                    user.id,
                    "post_like",
                    req,
                    "post",
                    post.id
                );
                result = await post.incrementLikeCount();
            }

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to update like status",
                    error: result.error,
                });
            }

            res.json({
                success: true,
                message: isLiked ? "Post unliked" : "Post liked",
                data: {
                    liked: !isLiked,
                    like_count: post.like_count,
                },
            });
        } catch (error) {
            console.error("Toggle like error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    }

    static async checkLiked(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;
            if (!user) {
                return res
                    .status(401)
                    .json({ success: false, message: "Unauthorized" });
            }

            // Kiểm tra post tồn tại (nếu cần giống toggleLike)
            const postResult = await Post.findById(Number(id));
            if (!postResult.success || !postResult.data) {
                return res
                    .status(404)
                    .json({ success: false, message: "Post not found" });
            }
            const post = postResult.data;

            const { executeQuery } = require("../db");
            const checkQuery = `
      SELECT id FROM user_interactions
      WHERE user_id = ? AND interaction_type = 'post_like' AND target_id = ?
      
    `;

            const checkResult = await executeQuery(checkQuery, [
                user.id,
                post.id,
            ]);

            if (!checkResult.success) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to check like status",
                    error: checkResult.error,
                });
            }

            const liked = checkResult.data.length > 0;

            res.json({
                success: true,
                data: {
                    liked,
                    like_count: post.like_count,
                },
            });
        } catch (error) {
            console.error("checkLiked error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    }

    // Get popular posts
    static async getPopular(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;

            const result = await Post.getPopular(limit);

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to get popular posts",
                    error: result.error,
                });
            }

            res.json({
                success: true,
                data: {
                    posts: result.data.map((post) => post.toJSON()),
                },
            });
        } catch (error) {
            console.error("Get popular posts error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    }

    // Get recent posts
    static async getRecent(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;

            const result = await Post.getRecent(limit);

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to get recent posts",
                    error: result.error,
                });
            }

            res.json({
                success: true,
                data: {
                    posts: result.data.map((post) => post.toJSON()),
                },
            });
        } catch (error) {
            console.error("Get recent posts error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    }

    // Search posts
    static async search(req, res) {
        try {
            const { q } = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            if (!q) {
                return res.status(400).json({
                    success: false,
                    message: "Search query is required",
                });
            }

            const result = await Post.search(q, page, limit);

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to search posts",
                    error: result.error,
                });
            }

            res.json({
                success: true,
                data: result.data,
            });
        } catch (error) {
            console.error("Search posts error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    }

    // Get posts by category
    static async getByCategory(req, res) {
        try {
            const { category } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const result = await Post.getByCategory(category, page, limit);

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to get posts by category",
                    error: result.error,
                });
            }

            res.json({
                success: true,
                data: result.data,
            });
        } catch (error) {
            console.error("Get posts by category error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    }

    // Get user's posts
    static async getUserPosts(req, res) {
        try {
            const user = req.user;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const result = await Post.getByAuthor(user.id, page, limit);

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to get user posts",
                    error: result.error,
                });
            }

            res.json({
                success: true,
                data: result.data,
            });
        } catch (error) {
            console.error("Get user posts error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    }

    // Get post statistics
    static async getStats(req, res) {
        try {
            const result = await Post.getStats();

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to get post statistics",
                    error: result.error,
                });
            }

            res.json({
                success: true,
                data: result.data,
            });
        } catch (error) {
            console.error("Get post stats error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    }
    // Toggle like/dislike for a post
    static async reactToPost(req, res) {
        try {
            const { id: postId } = req.params;
            const { type: reaction } = req.body;
            const userId = req.user.id;

            // Validate reaction type
            if (!["like", "dislike"].includes(reaction)) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Invalid reaction type. Must be "like" or "dislike"',
                });
            }

            // Verify post exists
            const post = await Post.findById(postId);
            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: "Post not found",
                });
            }

            // Find existing reaction
            const existingReaction = await Reaction.findOne({
                contentId: postId,
                userId,
                contentType: "post",
            });

            let result;

            if (existingReaction) {
                if (existingReaction.type === reaction) {
                    // Remove reaction if same type clicked
                    await Reaction.delete(existingReaction.id);
                    result = { action: "removed", type: reaction };
                } else {
                    // Update reaction if different type
                    await Reaction.update(existingReaction.id, {
                        type: reaction,
                    });
                    result = { action: "updated", type: reaction };
                }
            } else {
                // Create new reaction
                await Reaction.create({
                    contentId: postId,
                    userId,
                    contentType: "post",
                    type: reaction,
                });
                result = { action: "added", type: reaction };
            }

            // Get updated reaction counts
            const likeCount = await Reaction.count({
                where: {
                    contentId: postId,
                    contentType: "post",
                    type: "like",
                },
            });

            const dislikeCount = await Reaction.count({
                where: {
                    contentId: postId,
                    contentType: "post",
                    type: "dislike",
                },
            });

            res.json({
                success: true,
                ...result,
                like_count: likeCount,
                dislike_count: dislikeCount,
            });
        } catch (error) {
            console.error("Error reacting to post:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    }

    // Get reaction counts for a post
    static async getPostReactions(req, res) {
        try {
            const { id: postId } = req.params;

            // Verify post exists
            const post = await Post.findById(postId);
            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: "Post not found",
                });
            }

            const likeCount = await Reaction.count({
                where: {
                    contentId: postId,
                    contentType: "post",
                    type: "like",
                },
            });

            const dislikeCount = await Reaction.count({
                where: {
                    contentId: postId,
                    contentType: "post",
                    type: "dislike",
                },
            });

            res.json({
                success: true,
                like_count: likeCount,
                dislike_count: dislikeCount,
            });
        } catch (error) {
            console.error("Error getting post reactions:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    }

    // React to a post
    static async reactToPost(req, res) {
        try {
            const { id: postId } = req.params;
            const { type } = req.body;
            const userId = req.user.id;

            // Validate post exists
            const post = await Post.findById(postId);
            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: "Post not found",
                });
            }

            // Check if user already reacted to this post
            const existingReaction = await Reaction.findOne({
                where: {
                    user_id: userId,
                    post_id: postId,
                },
            });

            if (existingReaction) {
                // If same reaction type, remove the reaction
                if (existingReaction.type === type) {
                    // await existingReaction.destroy();
                    Reaction.delete(existingReaction.id);
                    // Decrement like_count if it was a like
                    if (type === "like") {
                        await Post.decrementLikeCount(postId);
                    }
                    return res.json({
                        success: true,
                        message: "Reaction removed",
                        data: { reaction: null },
                    });
                }
                // If different reaction type, update it
                const previousType = existingReaction.type;
                await Reaction.update(existingReaction.id, { type });

                // Update like_count if changing to/from like
                if (type === "like" && previousType !== "like") {
                    // Changing to like
                    await Post.incrementLikeCount(postId);
                } else if (type !== "like" && previousType === "like") {
                    // Changing from like
                    await Post.decrementLikeCount(postId);
                }
                return res.json({
                    success: true,
                    message: "Reaction updated",
                    data: { reaction: existingReaction },
                });
            }

            // Create new reaction
            const reaction = await Reaction.create({
                user_id: userId,
                post_id: postId,
                type,
            });

            // Increment like_count if it's a like
            if (type === "like") {
                await Post.incrementLikeCount(postId);
            }

            // Log the interaction
            await AuthController.logUserInteraction(
                userId,
                "post_react",
                req,
                "post",
                postId,
                { reaction_type: type }
            );

            res.json({
                success: true,
                message: "Reaction added",
                data: { reaction },
            });
        } catch (error) {
            console.error("React to post error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    }

    // Add comment to a post
    static async addComment(req, res) {
        try {
            const { id: postId } = req.params;
            const { content } = req.body;
            const userId = req.user?.id;

            // Validate post exists
            const post = await Post.findById(postId);
            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: "Post not found",
                });
            }

            // For now, return a simple response since Comment model might not be set up
            // res.status(201).json({
            //   success: true,
            //   message: 'Comment functionality not yet implemented',
            //   data: {
            //     postId,
            //     content,
            //     userId
            //   }
            // });

            const comment = await Comment.create({
                user_id: userId,
                post_id: postId,
                content,
            });

            res.status(201).json({
                success: true,
                message: "Comment added",
                data: { comment },
            });
        } catch (error) {
            console.error("Add comment error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    }

    // Get comments for a post
    static async getPostComments(req, res) {
        try {
            const { id: postId } = req.params;

            // Validate post exists
            const post = await Post.findById(postId);
            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: "Post not found",
                });
            }

            // For now, return empty comments array
            // res.json({
            //   success: true,
            //   data: {
            //     comments: [],
            //     total: 0,
            //     page: 1,
            //     totalPages: 0
            //   }
            // });

            const comments = await Comment.getPostComments(postId);
            res.json({
                success: true,
                data: {
                    comments,
                    total: comments.length,
                    page: 1,
                    totalPages: 1,
                },
            });
        } catch (error) {
            console.error("Get post comments error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    }

    // Delete a comment
    static async deleteComment(req, res) {
        try {
            const { id: postId, commentId } = req.params;
            const userId = req.user?.id;

            // For now, return a simple response
            res.json({
                success: true,
                message: "Comment deletion functionality not yet implemented",
                data: {
                    postId,
                    commentId,
                    userId,
                },
            });
        } catch (error) {
            console.error("Delete comment error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message,
            });
        }
    }
}

module.exports = PostController;
