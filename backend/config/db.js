const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT, 
    user: process.env.MYSQL_USER,      
    password: process.env.MYSQL_PASSWORD, 
    database: process.env.MYSQL_DATABASE,
    multipleStatements: true
});


async function checkConnection() {
    try {
        console.log('Attempting to connect to database at', process.env.DB_HOST);
        
        // Test the connection
        const connection = await db.getConnection();
        console.log('Connected to database successfully.');
        connection.release(); // Release immediately

    } catch (err) {
        console.error('Database Connection Failed!');
        
        if (err.code === 'ECONNREFUSED') {
            console.error(`   Reason: Unable to reach the server at ${process.env.DB_HOST}:${process.env.DB_PORT}`);
        } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('   Reason: Wrong username or password.');
        } else if (err.code === 'ER_BAD_DB_ERROR') {
            console.error('   Reason: The database name does not exist.');
        } else {
            console.error('   Error details:', err.message);
        }
        process.exit(1); 
    }
}

// 3. Run the check in the background
checkConnection();

// 4. Export the pool object (Not the function, not a promise)
module.exports = db;