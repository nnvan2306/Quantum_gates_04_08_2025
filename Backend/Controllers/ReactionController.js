const { Op } = require('sequelize');
const Reaction = require('../Models/Reaction');
const Post = require('../Models/Post');
const { executeQuery } = require('../db');

const reactionController = {
  // Toggle like/dislike for any content type
  async reactToContent(req, res) {
    try {
      const { contentId, contentType } = req.params;
      const { reaction } = req.body;
      const userId = req.user.id;

      // Validate content type
      if (!Object.values(Reaction.CONTENT_TYPES).includes(contentType)) {
        return res.status(400).json({ message: 'Invalid content type' });
      }

      // Validate reaction type
      if (!['like', 'dislike'].includes(reaction)) {
        return res.status(400).json({ message: 'Invalid reaction type' });
      }

      // Verify content exists
      const contentExists = await Reaction.contentExists(contentId, contentType);
      if (!contentExists) {
        return res.status(404).json({ message: 'Content not found' });
      }

      // Find existing reaction
      const existingReaction = await Reaction.findOne({
        where: { 
          contentId,
          userId,
          contentType
        }
      });

      let result;
      
      if (existingReaction) {
        if (existingReaction.type === reaction) {
          // Remove reaction if same type clicked
          await Reaction.delete(existingReaction.id);
          result = { action: 'removed', type: reaction };
        } else {
          // Update reaction if different type
          await Reaction.update(existingReaction.id, { type: reaction });
          result = { action: 'updated', type: reaction };
        }
      } else {
        // Create new reaction
        await Reaction.create({
          user_id: userId,
          content_id: contentId,
          content_type: contentType,
          type: reaction
        });
        result = { action: 'added', type: reaction };
      }

      // Get updated counts using custom query
      const countsQuery = `
        SELECT type, COUNT(*) as count 
        FROM reactions 
        WHERE content_id = ? AND content_type = ? 
        GROUP BY type
      `;
      const countsResult = await executeQuery(countsQuery, [contentId, contentType]);
      
      if (!countsResult.success) {
        console.error('Error getting reaction counts:', countsResult.error);
        return res.status(500).json({ message: 'Error getting reaction counts' });
      }
      
      const counts = countsResult.data || [];
      const likeCount = counts.find(c => c.type === 'like')?.count || 0;
      const dislikeCount = counts.find(c => c.type === 'dislike')?.count || 0;
      
      // Update the appropriate table with new counts
      let updateQuery = '';
      let params = [likeCount, dislikeCount, contentId];
      
      switch(contentType) {
        case Reaction.CONTENT_TYPES.POST:
        case Reaction.CONTENT_TYPES.EVENT:
        case Reaction.CONTENT_TYPES.ACTIVITY:
          updateQuery = 'UPDATE posts SET like_count = ?, dislike_count = ? WHERE id = ?';
          if (contentType !== Reaction.CONTENT_TYPES.POST) {
            updateQuery += ' AND post_type = ?';
            params.push(contentType);
          }
          break;
      }
      
      if (updateQuery) {
        await executeQuery(updateQuery, params);
      }

      res.json({
        ...result,
        like_count: likeCount,
        dislike_count: dislikeCount
      });
    } catch (error) {
      console.error('Error in reactToContent:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get reaction counts for any content
  async getReactionCounts(req, res) {
    try {
      const { contentId, contentType } = req.params;
      
      // Validate content type
      if (!Object.values(Reaction.CONTENT_TYPES).includes(contentType)) {
        return res.status(400).json({ message: 'Invalid content type' });
      }

      // Verify content exists
      const contentExists = await Reaction.contentExists(contentId, contentType);
      if (!contentExists) {
        return res.status(404).json({ message: 'Content not found' });
      }
      
      const counts = await Reaction.findAll({
        where: { contentId, contentType },
        attributes: ['type', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['type']
      });

      const likeCount = counts.find(c => c.type === 'like')?.dataValues.count || 0;
      const dislikeCount = counts.find(c => c.type === 'dislike')?.dataValues.count || 0;
      
      res.json({
        like_count: likeCount,
        dislike_count: dislikeCount
      });
    } catch (error) {
      console.error('Error in getReactionCounts:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

module.exports = reactionController;
