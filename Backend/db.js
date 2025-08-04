const mysql = require("mysql2/promise");
require("dotenv").config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "quantum_gates_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Database connected successfully");
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    return false;
  }
};

// Execute query with error handling
const executeQuery = async (query, params = []) => {
  try {
    const [results] = await pool.execute(query, params);
    return { success: true, data: results };
  } catch (error) {
    console.error("Database query error:", error);
    return { success: false, error: error.message };
  }
};

// Get single record
const findOne = async (query, params = []) => {
  try {
    const [results] = await pool.execute(query, params);
    return { success: true, data: results[0] || null };
  } catch (error) {
    console.error("Database findOne error:", error);
    return { success: false, error: error.message };
  }
};

// Insert record and return inserted ID
const insertRecord = async (query, params = []) => {
  try {
    const [result] = await pool.execute(query, params);
    return {
      success: true,
      insertId: result.insertId,
      affectedRows: result.affectedRows,
    };
  } catch (error) {
    console.error("Database insert error:", error);
    return { success: false, error: error.message };
  }
};

// Update record
const updateRecord = async (query, params = []) => {
  try {
    const [result] = await pool.execute(query, params);
    return {
      success: true,
      affectedRows: result.affectedRows,
      changedRows: result.changedRows,
    };
  } catch (error) {
    console.error("Database update error:", error);
    return { success: false, error: error.message };
  }
};

// Delete record
const deleteRecord = async (query, params = []) => {
  try {
    const [result] = await pool.execute(query, params);
    return {
      success: true,
      affectedRows: result.affectedRows,
    };
  } catch (error) {
    console.error("Database delete error:", error);
    return { success: false, error: error.message };
  }
};

// Transaction helper
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return { success: true, data: result };
  } catch (error) {
    await connection.rollback();
    console.error("Transaction error:", error);
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
};

module.exports = {
  pool,
  testConnection,
  executeQuery,
  findOne,
  insertRecord,
  updateRecord,
  deleteRecord,
  transaction,
};
