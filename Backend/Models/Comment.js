const { executeQuery } = require('../db');
const { format } = require('date-fns');

// Supported content types
const CONTENT_TYPES = {
  POST: 'post',
  EVENT: 'event',
  ACTIVITY: 'activity'
};

class Comment {
  // Create a new comment
  static async create(data) {
    try {
      const { user_id, post_id, content, parent_id = null, status = 'approved' } = data;
      const query = `
        INSERT INTO comments (post_id, user_id, parent_id, content, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `;
      const result = await executeQuery(query, [post_id, user_id, parent_id, content, status]);
      
      if (result.success) {
        // Get the newly created comment
        const comment = await this.findById(result.data.insertId);
        return { success: true, data: comment };
      }
      
      return { success: false, error: 'Failed to create comment' };
    } catch (error) {
      console.error('Error creating comment:', error);
      return { success: false, error: error.message };
    }
  }

  // Find comment by ID
  static async findById(id) {
    try {
      const query = `
        SELECT c.*, u.username, u.avatar_url as user_avatar
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
      `;
      const result = await executeQuery(query, [id]);
      
      if (result.success && result.data.length > 0) {
        return result.data[0];
      }
      return null;
    } catch (error) {
      console.error('Error finding comment:', error);
      return null;
    }
  }

  // Get comments for a post
  static async getPostComments(postId) {
    try {
      const query = `
        SELECT 
          c.id, 
          c.post_id, 
          c.user_id, 
          c.parent_id,
          c.content,
          c.status,
          c.created_at,
          c.updated_at,
          u.username, 
          u.avatar_url as user_avatar
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ? 
          AND c.status = 'approved' 
          AND c.parent_id IS NULL
        ORDER BY c.created_at DESC
      `;
      const result = await executeQuery(query, [postId]);
      
      if (result.success) {
        return result.data; // Just return the array of comments
      }
      return [];
    } catch (error) {
      console.error('Error getting comments:', error);
      return [];
    }
  }

  // Delete a comment
  static async delete(id, userId) {
    try {
      // First verify the comment exists and belongs to the user
      const comment = await this.findById(id);
      if (!comment) {
        return { success: false, error: 'Comment not found' };
      }
      
      if (comment.user_id !== userId) {
        return { success: false, error: 'Unauthorized' };
      }
      
      const query = 'DELETE FROM comments WHERE id = ?';
      const result = await executeQuery(query, [id]);
      
      if (result.success) {
        return { success: true };
      }
      return { success: false, error: 'Failed to delete comment' };
    } catch (error) {
      console.error('Error deleting comment:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if content exists
  static async contentExists(contentId, contentType) {
    try {
      let tableName;
      switch(contentType) {
        case CONTENT_TYPES.POST:
        case CONTENT_TYPES.EVENT:
        case CONTENT_TYPES.ACTIVITY:
          tableName = 'posts';
          break;
        default:
          return false;
      }

      let query = `SELECT id FROM ${tableName} WHERE id = ?`;
      const params = [contentId];
      
      if (contentType !== CONTENT_TYPES.POST) {
        query += ' AND post_type = ?';
        params.push(contentType);
      }
      
      const result = await executeQuery(query, params);
      return result.success && result.data.length > 0;
    } catch (error) {
      console.error('Error checking content existence:', error);
      return false;
    }
  }
}

// Attach content types to the class
Comment.CONTENT_TYPES = CONTENT_TYPES;

module.exports = Comment;
