const { Op } = require('sequelize');
const Comment = require('../Models/Comment');
const Post = require('../Models/Post');
const User = require('../Models/User');
const { executeQuery } = require('../db');

const commentController = {
  // Create a new comment for any content type
  async createComment(req, res) {
    try {
      const { contentId, contentType } = req.params;
      const { content, parentId = null } = req.body;
      const userId = req.user.id;

      // Validate content type
      if (!Object.values(Comment.CONTENT_TYPES).includes(contentType)) {
        return res.status(400).json({ message: 'Invalid content type' });
      }

      // Validate input
      if (!content || !content.trim()) {
        return res.status(400).json({ message: 'Comment content is required' });
      }

      // Check if content exists
      const contentExists = await Comment.contentExists(contentId, contentType);
      if (!contentExists) {
        return res.status(404).json({ message: 'Content not found' });
      }

      // Create the comment
      const comment = await Comment.create({
        content: content.trim(),
        contentId,
        contentType,
        userId,
        parentId: parentId || null
      });

      // Get the comment with user data
      const newComment = await Comment.findById(comment.id, {
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'avatar', 'email'],
            as: 'User'
          }
        ]
      });

      // Update comment count on the content
      let updateQuery = '';
      const params = [contentId];
      
      switch(contentType) {
        case Comment.CONTENT_TYPES.POST:
        case Comment.CONTENT_TYPES.EVENT:
        case Comment.CONTENT_TYPES.ACTIVITY:
          updateQuery = 'UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?';
          if (contentType !== Comment.CONTENT_TYPES.POST) {
            updateQuery += ' AND post_type = ?';
            params.push(contentType);
          }
          break;
      }
      
      if (updateQuery) {
        await executeQuery(updateQuery, params);
      }

      res.status(201).json({
        message: 'Comment added successfully',
        comment: {
          id: newComment.id,
          content: newComment.content,
          createdAt: newComment.createdAt,
          user: {
            id: newComment.User.id,
            name: newComment.User.username,
            avatar: newComment.User.avatar,
            email: newComment.User.email
          }
        }
      });
    } catch (error) {
      console.error('Error in createComment:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get comments for any content
  async getContentComments(req, res) {
    try {
      const { contentId, contentType } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      // Validate content type
      if (!Object.values(Comment.CONTENT_TYPES).includes(contentType)) {
        return res.status(400).json({ message: 'Invalid content type' });
      }

      // Verify content exists
      const contentExists = await Comment.contentExists(contentId, contentType);
      if (!contentExists) {
        return res.status(404).json({ message: 'Content not found' });
      }

      const { count, rows: comments } = await Comment.findAndCountAll({
        where: { 
          contentId,
          contentType,
          parentId: null // Only get top-level comments
        },
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'avatar', 'email'],
            as: 'User'
          },
          {
            model: Comment,
            as: 'replies',
            include: [
              {
                model: User,
                attributes: ['id', 'username', 'avatar', 'email'],
                as: 'User'
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Format the response
      const formattedComments = comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        user: {
          id: comment.User.id,
          name: comment.User.username,
          avatar: comment.User.avatar,
          email: comment.User.email
        },
        replies: comment.replies.map(reply => ({
          id: reply.id,
          content: reply.content,
          createdAt: reply.createdAt,
          user: {
            id: reply.User.id,
            name: reply.User.username,
            avatar: reply.User.avatar,
            email: reply.User.email
          }
        }))
      }));

      res.json({
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit),
        comments: formattedComments
      });
    } catch (error) {
      console.error('Error in getPostComments:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Delete a comment
  async deleteComment(req, res) {
    try {
      const { commentId } = req.params;
      const userId = req.user.id;

      const comment = await Comment.findOne({
        where: { id: commentId, userId }
      });
      
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found or access denied' });
      }
      
      const { contentId, contentType } = comment;

      if (!comment) {
        return res.status(404).json({ 
          message: 'Comment not found or you do not have permission to delete it' 
        });
      }

      // Delete the comment
      await comment.destroy();

      // Decrement comment count on the content
      let updateQuery = '';
      const params = [contentId];
      
      switch(contentType) {
        case Comment.CONTENT_TYPES.POST:
        case Comment.CONTENT_TYPES.EVENT:
        case Comment.CONTENT_TYPES.ACTIVITY:
          updateQuery = 'UPDATE posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = ?';
          if (contentType !== Comment.CONTENT_TYPES.POST) {
            updateQuery += ' AND post_type = ?';
            params.push(contentType);
          }
          break;
      }
      
      if (updateQuery) {
        await executeQuery(updateQuery, params);
      }

      res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
      console.error('Error in deleteComment:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

module.exports = commentController;
