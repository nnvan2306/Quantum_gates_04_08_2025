const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config();

const initDatabase = async () => {
  try {
    // Connect to MySQL server (without database)
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      multipleStatements: true,
    });

    console.log("📡 Connected to MySQL server");

    // Create database
    console.log("📋 Creating database...");
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${
        process.env.DB_NAME || "quantum_gates_db"
      } CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await connection.query(`USE ${process.env.DB_NAME || "quantum_gates_db"}`);

    // Read and execute schema file
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    console.log("📋 Executing database schema...");
    await connection.query(schema);

    console.log("✅ Database initialized successfully");
    console.log("📊 Tables created:");
    console.log("   - users");
    console.log("   - posts");
    console.log("   - reactions");
    console.log("   - user_interactions");
    console.log("   - admin_logs");
    console.log("   - comments");
    console.log("   - simulation_history");
    console.log("👤 Default admin user created");

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };
