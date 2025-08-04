const { executeQuery } = require('../db');

// Supported content types
const CONTENT_TYPES = {
  POST: 'post',
  EVENT: 'event',
  ACTIVITY: 'activity'
};

class Reaction {
  // Check if content exists
  static async contentExists(contentId, contentType) {
    try {
      let tableName;
      switch(contentType) {
        case CONTENT_TYPES.POST:
          tableName = 'posts';
          break;
        case CONTENT_TYPES.EVENT:
        case CONTENT_TYPES.ACTIVITY:
          tableName = 'posts';
          break;
        default:
          return false;
      }

      let query = `SELECT id FROM ${tableName} WHERE id = ?`;
      const params = [contentId];
      
      if (tableName === 'posts' && (contentType === CONTENT_TYPES.EVENT || contentType === CONTENT_TYPES.ACTIVITY)) {
        query += ' AND post_type = ?';
        params.push(contentType);
      }
      
      const result = await executeQuery(query, params);
      return result.success && result.data && result.data.length > 0;
    } catch (error) {
      console.error('Error checking content existence:', error);
      return false;
    }
  }

  // Find a reaction
  static async findOne(where) {
    try {
      const { user_id, post_id } = where.where || where;
      const query = `
        SELECT * FROM reactions 
        WHERE user_id = ? AND content_id = ? AND content_type = 'post'
        LIMIT 1
      `;
      const result = await executeQuery(query, [user_id, post_id]);
      return result.success ? result.data[0] || null : null;
    } catch (error) {
      console.error('Error finding reaction:', error);
      return null;
    }
  }

  // Create a new reaction
  static async create(data) {
    try {
      const { user_id, post_id, type } = data;
      const query = `
        INSERT INTO reactions (user_id, content_id, content_type, type)
        VALUES (?, ?, 'post', ?)
      `;
      const result = await executeQuery(query, [user_id, post_id, type]);
      return result.success ? { id: result.data.insertId, ...data } : null;
    } catch (error) {
      console.error('Error creating reaction:', error);
      return null;
    }
  }

  // Update a reaction
  static async update(id, data) {
    try {
      const { type } = data;
      const query = `
        UPDATE reactions 
        SET type = ?, updatedAt = NOW() 
        WHERE id = ?
      `;
      const result = await executeQuery(query, [type, id]);
      return result.success && result.data.affectedRows > 0;
    } catch (error) {
      console.error('Error updating reaction:', error);
      return false;
    }
  }

  // Delete a reaction
  static async delete(id) {
    try {
      const query = 'DELETE FROM reactions WHERE id = ?';
      const result = await executeQuery(query, [id]);
      return result.success && result.data.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting reaction:', error);
      return false;
    }
  }

  // Count reactions
  static async count(where) {
    try {
      const { contentId, contentType, type } = where.where;
      const query = `
        SELECT COUNT(*) as count 
        FROM reactions 
        WHERE content_id = ? AND content_type = ? AND type = ?
      `;
      const result = await executeQuery(query, [contentId, contentType, type]);
      return result.success ? result.data[0].count : 0;
    } catch (error) {
      console.error('Error counting reactions:', error);
      return 0;
    }
  }
}

Reaction.CONTENT_TYPES = CONTENT_TYPES;

module.exports = Reaction;
