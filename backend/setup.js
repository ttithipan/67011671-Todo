const fs = require('fs');
const path = require('path');
const db = require('./config/dbconfig');

async function setup() {
    try {
        // 1. Read the SQL file
        const sqlPath = path.join(__dirname, '../database/setup.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // 2. Run the query
        console.log('Running setup...');
        await db.query(sql);
        
        console.log('Database setup complete!');
        
        // 3. Close the pool (Important! Otherwise the script won't stop)
        await db.end();
        process.exit(0); // Exit code 0 means "Success"

    } catch (err) {
        console.error('Error running setup:', err.message);
        process.exit(1); // Exit code 1 means "Error"
    }
}

setup();