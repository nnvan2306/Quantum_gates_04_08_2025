const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Quantum Gates API',
      version: '1.0.0',
      description: 'API documentation for Quantum Gates application',
      contact: {
        name: 'API Support',
        url: 'https://your-website.com/support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Post: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            content: { type: 'string' },
            excerpt: { type: 'string' },
            featured_image: { type: 'string', format: 'uri' },
            category: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            status: { type: 'string', enum: ['draft', 'published', 'archived'] },
            author_id: { type: 'integer' },
            post_type: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        CreatePostInput: {
          type: 'object',
          required: ['title', 'content'],
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            excerpt: { type: 'string' },
            featured_image: { type: 'string', format: 'uri' },
            category: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            status: { type: 'string', enum: ['draft', 'published', 'archived'] },
            post_type: { type: 'string' },
          },
        },
        UpdatePostInput: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            excerpt: { type: 'string' },
            featured_image: { type: 'string', format: 'uri' },
            category: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            status: { type: 'string', enum: ['draft', 'published', 'archived'] },
          },
        },
        Reaction: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            post_id: { type: 'integer' },
            type: { type: 'string', enum: ['like', 'dislike'] },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            error: { type: 'string' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./Routes/*.js'], // Path to the API routes
};

const specs = swaggerJsdoc(options);

module.exports = specs;
