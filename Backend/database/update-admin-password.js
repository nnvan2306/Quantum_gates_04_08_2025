const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateAdminPassword() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'quantum_gates_db'
    });

    console.log('📡 Connected to database');
    
    const newHash = '$2a$12$Ouo.DlGCbhjXRU9tudSjkO3SGvZKGgCJ9Vrtjt3KlF4APcTbH1dtS';
    
    const [result] = await connection.execute(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [newHash, 'admin@quantumgates.com']
    );
    
    console.log('✅ Admin password updated successfully');
    console.log('Affected rows:', result.affectedRows);
    
    // Verify the update
    const [rows] = await connection.execute(
      'SELECT username, email, LEFT(password_hash, 20) as hash_preview FROM users WHERE email = ?',
      ['admin@quantumgates.com']
    );
    
    console.log('📋 Updated user:', rows[0]);
    
    await connection.end();
    console.log('🔐 Password: admin123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateAdminPassword();
