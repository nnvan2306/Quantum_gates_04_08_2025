const {
  executeQuery,
  findOne,
  insertRecord,
  updateRecord,
  deleteRecord,
  pool,
} = require("../db");

class Post {
  constructor(data) {
    // Basic post fields
    this.id = data.id;
    this.title = data.title;
    this.content = data.content;
    this.excerpt = data.excerpt;
    this.featured_image = data.featured_image;
    this.author_id = data.author_id;
    this.category = data.category;
    this.post_type = data.post_type || 'post';
    this.tags = data.tags;
    this.status = data.status || 'draft';
    this.view_count = data.view_count || 0;
    this.like_count = data.like_count || 0;
    this.comment_count = data.comment_count || 0;
    this.published_at = data.published_at;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;

    // Event fields
    this.start_date = data.start_date;
    this.end_date = data.end_date;
    this.location = data.location;
    this.capacity = data.capacity;
    this.requirements = data.requirements;

    // Activity fields
    this.activity_type = data.activity_type;
    this.difficulty = data.difficulty;
    this.duration = data.duration;
    this.points = data.points;
    this.instructions = data.instructions;
    this.resources = data.resources;

    // Author information
    this.author_name = data.author_name;
    this.author_username = data.author_username;
    this.author_avatar = data.author_avatar;
  }

  // Create new post
  static async create(postData) {
    try {
      const query = `
                INSERT INTO posts (
                  title, content, excerpt, featured_image, author_id,
                  category, post_type, tags, status, published_at,
                  start_date, end_date, location, capacity, requirements,
                  activity_type, difficulty, duration, points, instructions, resources
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

      const publishedAt = postData.status === "published" ? new Date() : null;

      const params = [
        postData.title,
        postData.content,
        postData.excerpt || null,
        postData.featured_image || null,
        postData.author_id,
        postData.category || null,
        postData.post_type || 'post',
        JSON.stringify(postData.tags || []),
        postData.status || "draft",
        publishedAt,
        // Event fields
        postData.start_date || null,
        postData.end_date || null,
        postData.location || null,
        postData.capacity || null,
        postData.requirements || null,
        // Activity fields
        postData.activity_type || null,
        postData.difficulty || null,
        postData.duration || null,
        postData.points || null,
        postData.instructions || null,
        postData.resources || null,
      ];

      const result = await insertRecord(query, params);

      if (result.success) {
        return await Post.findById(result.insertId);
      }

      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Find post by ID
  static async findById(id, includeAuthor = true) {
    try {
      let query = `
        SELECT 
          p.id, p.title, p.content, p.excerpt, p.featured_image, p.author_id,
          p.category, p.post_type, p.tags, p.status, p.view_count, p.like_count,
          p.comment_count, p.published_at, p.created_at, p.updated_at,
          p.start_date, p.end_date, p.location, p.capacity, p.requirements,
          p.activity_type, p.difficulty, p.duration, p.points, p.instructions, p.resources
      `;

      if (includeAuthor) {
        query += `, u.full_name as author_name, u.username as author_username, u.avatar_url as author_avatar`;
      }

      query += ` FROM posts p`;

      if (includeAuthor) {
        query += ` LEFT JOIN users u ON p.author_id = u.id`;
      }

      query += ` WHERE p.id = ?`;

      const result = await findOne(query, [id]);

      if (result.success && result.data) {
        // Parse tags if they exist
        if (result.data.tags) {
          try {
            result.data.tags = JSON.parse(result.data.tags);
          } catch (e) {
            result.data.tags = [];
          }
        }

        return { success: true, data: new Post(result.data) };
      }

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get all posts with pagination and filters
  static async getAll(page = 1, limit = 10, filters = {}) {
    try {
      // Ensure parameters are valid numbers
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
      const offset = Math.max(0, (pageNum - 1) * limitNum);

      let whereClause = "WHERE 1=1";
      let params = [];

      // Apply filters
      if (filters.status) {
        whereClause += " AND p.status = ?";
        params.push(filters.status);
      }

      if (filters.post_type) {
        whereClause += " AND p.post_type = ?";
        params.push(filters.post_type);
      }

      if (filters.category) {
        whereClause += " AND p.category = ?";
        params.push(filters.category);
      }

      if (filters.author_id) {
        const authorId = parseInt(filters.author_id);
        if (!isNaN(authorId) && authorId > 0) {
          whereClause += " AND p.author_id = ?";
          params.push(authorId);
        }
      }

      if (filters.search) {
        whereClause += " AND (p.title LIKE ? OR p.content LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm);
      }

      // Get total count using direct query
      const countQuery = `SELECT COUNT(*) as total FROM posts p ${whereClause}`;
      const [countRows] = await pool.query(countQuery, params);
      const total = countRows[0].total;

      // Get posts using direct query with all fields
      const query = `
                SELECT 
                  p.id, p.title, p.content, p.excerpt, p.featured_image, p.author_id,
                  p.category, p.post_type, p.tags, p.status, p.view_count, p.like_count,
                  p.comment_count, p.published_at, p.created_at, p.updated_at,
                  p.start_date, p.end_date, p.location, p.capacity, p.requirements,
                  p.activity_type, p.difficulty, p.duration, p.points, p.instructions, p.resources,
                  u.full_name as author_name, u.username as author_username, u.avatar_url as author_avatar
                FROM posts p
                LEFT JOIN users u ON p.author_id = u.id
                ${whereClause}
                ORDER BY p.created_at DESC
                LIMIT ? OFFSET ?
            `;

      const queryParams = [...params, limitNum, offset];
      const [rows] = await pool.query(query, queryParams);

      if (rows) {
        const posts = rows.map((postData) => {
          // Parse tags
          if (postData.tags) {
            try {
              postData.tags = JSON.parse(postData.tags);
            } catch (e) {
              postData.tags = [];
            }
          }
          return new Post(postData);
        });

        return {
          success: true,
          data: {
            posts,
            pagination: {
              page: pageNum,
              limit: limitNum,
              total,
              totalPages: Math.ceil(total / limitNum),
            },
          },
        };
      }

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update post
  async update(updateData) {
    try {
      const allowedFields = [
        "title",
        "content",
        "excerpt",
        "featured_image",
        "category",
        "tags",
        "status",
      ];
      const updates = [];
      const params = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          if (key === "tags") {
            updates.push(`${key} = ?`);
            params.push(JSON.stringify(value));
          } else if (
            key === "status" &&
            value === "published" &&
            this.status !== "published"
          ) {
            // Set published_at when publishing for the first time
            updates.push(`${key} = ?`, "published_at = ?");
            params.push(value, new Date());
          } else {
            updates.push(`${key} = ?`);
            params.push(value);
          }
        }
      }

      if (updates.length === 0) {
        return { success: false, error: "No valid fields to update" };
      }

      params.push(this.id);
      const query = `UPDATE posts SET ${updates.join(", ")} WHERE id = ?`;

      const result = await updateRecord(query, params);

      if (result.success) {
        // Refresh post data
        const updatedPost = await Post.findById(this.id);
        if (updatedPost.success) {
          Object.assign(this, updatedPost.data);
        }
        return { success: true, data: this };
      }

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Delete post (soft delete by changing status)
  async delete() {
    try {
      const query = "UPDATE posts SET status = ? WHERE id = ?";
      return await updateRecord(query, ["archived", this.id]);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Hard delete post
  static async hardDelete(id) {
    try {
      const query = "DELETE FROM posts WHERE id = ?";
      return await deleteRecord(query, [id]);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Increment view count
  async incrementViewCount() {
    try {
      const query = "UPDATE posts SET view_count = view_count + 1 WHERE id = ?";
      const result = await updateRecord(query, [this.id]);

      if (result.success) {
        this.view_count += 1;
      }

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Increment like count
  async incrementLikeCount() {
    try {
      const query = "UPDATE posts SET like_count = like_count + 1 WHERE id = ?";
      const result = await updateRecord(query, [this.id]);

      if (result.success) {
        this.like_count += 1;
      }

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Decrement like count
  async decrementLikeCount() {
    try {
      const query =
        "UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?";
      const result = await updateRecord(query, [this.id]);

      if (result.success) {
        this.like_count = Math.max(this.like_count - 1, 0);
      }

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get posts by category
  static async getByCategory(category, page = 1, limit = 10) {
    return await Post.getAll(page, limit, { category, status: "published" });
  }

  // Get posts by author
  static async getByAuthor(authorId, page = 1, limit = 10) {
    return await Post.getAll(page, limit, { author_id: authorId });
  }

  // Search posts
  static async search(searchTerm, page = 1, limit = 10) {
    return await Post.getAll(page, limit, {
      search: searchTerm,
      status: "published",
    });
  }

  // Get popular posts (by view count)
  static async getPopular(limit = 10) {
    try {
      // Ensure limit is a valid number
      const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));

      const query = `
                SELECT 
                  p.id, p.title, p.content, p.excerpt, p.featured_image, p.author_id,
                  p.category, p.post_type, p.tags, p.status, p.view_count, p.like_count,
                  p.comment_count, p.published_at, p.created_at, p.updated_at,
                  p.start_date, p.end_date, p.location, p.capacity, p.requirements,
                  p.activity_type, p.difficulty, p.duration, p.points, p.instructions, p.resources,
                  u.full_name as author_name, u.username as author_username, u.avatar_url as author_avatar
                FROM posts p
                LEFT JOIN users u ON p.author_id = u.id
                WHERE p.status = 'published'
                ORDER BY p.view_count DESC, p.created_at DESC
                LIMIT ?
            `;

      const [rows] = await pool.query(query, [limitNum]);

      if (rows) {
        const posts = rows.map((postData) => {
          if (postData.tags) {
            try {
              postData.tags = JSON.parse(postData.tags);
            } catch (e) {
              postData.tags = [];
            }
          }
          return new Post(postData);
        });

        return { success: true, data: posts };
      }

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get recent posts
  static async getRecent(limit = 10) {
    try {
      // Ensure limit is a valid number
      const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));

      const query = `
                SELECT 
                  p.id, p.title, p.content, p.excerpt, p.featured_image, p.author_id,
                  p.category, p.post_type, p.tags, p.status, p.view_count, p.like_count,
                  p.comment_count, p.published_at, p.created_at, p.updated_at,
                  p.start_date, p.end_date, p.location, p.capacity, p.requirements,
                  p.activity_type, p.difficulty, p.duration, p.points, p.instructions, p.resources,
                  u.full_name as author_name, u.username as author_username, u.avatar_url as author_avatar
                FROM posts p
                LEFT JOIN users u ON p.author_id = u.id
                WHERE p.status = 'published'
                ORDER BY p.published_at DESC, p.created_at DESC
                LIMIT ?
            `;

      const [rows] = await pool.query(query, [limitNum]);

      if (rows) {
        const posts = rows.map((postData) => {
          if (postData.tags) {
            try {
              postData.tags = JSON.parse(postData.tags);
            } catch (e) {
              postData.tags = [];
            }
          }
          return new Post(postData);
        });

        return { success: true, data: posts };
      }

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get post statistics
  static async getStats() {
    try {
      const queries = [
        "SELECT COUNT(*) as total FROM posts",
        'SELECT COUNT(*) as published FROM posts WHERE status = "published"',
        'SELECT COUNT(*) as drafts FROM posts WHERE status = "draft"',
        "SELECT COUNT(*) as today FROM posts WHERE DATE(created_at) = CURDATE()",
      ];

      const results = await Promise.all(queries.map((query) => findOne(query)));

      if (results.every((r) => r.success)) {
        return {
          success: true,
          data: {
            total: results[0].data.total,
            published: results[1].data.published,
            drafts: results[2].data.drafts,
            newToday: results[3].data.today,
          },
        };
      }

      return { success: false, error: "Failed to get post statistics" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      excerpt: this.excerpt,
      featured_image: this.featured_image,
      author_id: this.author_id,
      category: this.category,
      post_type: this.post_type || 'post',
      tags: this.tags,
      status: this.status,
      view_count: this.view_count || 0,
      like_count: this.like_count || 0,
      comment_count: this.comment_count || 0,
      published_at: this.published_at,
      created_at: this.created_at,
      updated_at: this.updated_at,
      // Event fields
      start_date: this.start_date,
      end_date: this.end_date,
      location: this.location,
      capacity: this.capacity,
      requirements: this.requirements,
      // Activity fields
      activity_type: this.activity_type,
      difficulty: this.difficulty,
      duration: this.duration,
      points: this.points,
      instructions: this.instructions,
      resources: this.resources,
      // Author info
      author_name: this.author_name,
      author_username: this.author_username,
      author_avatar: this.author_avatar
    };
  }

  // Increment like count for a post
  static async incrementLikeCount(postId) {
    try {
      const query = 'UPDATE posts SET like_count = like_count + 1, updated_at = NOW() WHERE id = ?';
      const result = await executeQuery(query, [postId]);
      return result.success;
    } catch (error) {
      console.error('Error incrementing like count:', error);
      return false;
    }
  }

  // Decrement like count for a post
  static async decrementLikeCount(postId) {
    try {
      const query = 'UPDATE posts SET like_count = GREATEST(0, like_count - 1), updated_at = NOW() WHERE id = ?';
      const result = await executeQuery(query, [postId]);
      return result.success;
    } catch (error) {
      console.error('Error decrementing like count:', error);
      return false;
    }
  }
}

module.exports = Post;
