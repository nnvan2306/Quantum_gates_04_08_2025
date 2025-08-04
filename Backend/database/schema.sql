-- Quantum Gates Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url VARCHAR(255),
    role ENUM('user', 'admin', 'moderator') DEFAULT 'user',
    status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_status (status)
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image VARCHAR(255),
    author_id INT NOT NULL,
    category VARCHAR(50),
    post_type ENUM('post', 'event', 'activity') DEFAULT 'post',
    tags JSON,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    
    -- Event specific fields
    start_date DATETIME NULL,
    end_date DATETIME NULL,
    location VARCHAR(255) NULL,
    capacity INT NULL,
    requirements TEXT NULL,
    
    -- Activity specific fields
    activity_type ENUM('simulation', 'exercise', 'quiz', 'experiment', 'tutorial', 'challenge') NULL,
    difficulty ENUM('beginner', 'intermediate', 'advanced', 'expert') NULL,
    duration INT NULL, -- in minutes
    points INT NULL,
    instructions TEXT NULL,
    resources TEXT NULL,
    
    -- Common fields
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_author (author_id),
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_post_type (post_type),
    INDEX idx_activity_type (activity_type),
    INDEX idx_difficulty (difficulty),
    INDEX idx_start_date (start_date),
    INDEX idx_published_at (published_at),
    FULLTEXT idx_search (title, content)
);

-- Reactions table (for likes/dislikes on posts, events, activities)
CREATE TABLE IF NOT EXISTS reactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content_id INT NOT NULL,
    content_type ENUM('post', 'event', 'activity') NOT NULL,
    type ENUM('like', 'dislike') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_content_reaction (user_id, content_id, content_type),
    INDEX idx_content (content_id, content_type),
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
);

-- User interactions table (for tracking user activities)
CREATE TABLE IF NOT EXISTS user_interactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    interaction_type ENUM('login', 'logout', 'register', 'post_view', 'post_like', 'post_comment', 'post_create', 'post_react', 'simulation_run', 'gate_operation') NOT NULL,
    target_type ENUM('post', 'simulation', 'gate', 'system') DEFAULT 'system',
    target_id INT NULL,
    metadata JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_interaction_type (interaction_type),
    INDEX idx_target (target_type, target_id),
    INDEX idx_created_at (created_at)
);

-- Admin logs table
CREATE TABLE IF NOT EXISTS admin_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id INT NULL,
    old_values JSON,
    new_values JSON,
    description TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_id (admin_id),
    INDEX idx_action (action),
    INDEX idx_target (target_type, target_id),
    INDEX idx_created_at (created_at)
);

-- Comments table (for post comments)
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    parent_id INT NULL,
    content TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_status (status)
);

-- Simulation history table (for future quantum simulation tracking)
CREATE TABLE IF NOT EXISTS simulation_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    simulation_type VARCHAR(50) NOT NULL,
    gate_sequence JSON,
    input_state JSON,
    output_state JSON,
    execution_time DECIMAL(10,6),
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_simulation_type (simulation_type),
    INDEX idx_created_at (created_at)
);

-- Insert default admin user
INSERT INTO users (username, email, password_hash, full_name, role, status, email_verified)
VALUES (
    'admin',
    'admin@quantumgates.com',
    '$2a$12$Ouo.DlGCbhjXRU9tudSjkO3SGvZKGgCJ9Vrtjt3KlF4APcTbH1dtS', -- password: admin123
    'System Administrator',
    'admin',
    'active',
    TRUE
) ON DUPLICATE KEY UPDATE password_hash='$2a$12$Ouo.DlGCbhjXRU9tudSjkO3SGvZKGgCJ9Vrtjt3KlF4APcTbH1dtS';
