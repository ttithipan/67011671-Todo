// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/dbconfig'); // Assumes this exports a Promise-based pool

const app = express();
const host = process.env.API_HOST || 'localhost';
const port = process.env.API_PORT || 3001;

// Middleware setup
app.use(cors()); // Allow cross-origin requests from React frontend
app.use(express.json()); // Enable reading JSON data from request body

// ----------------------------------------------------------------
// DEBUG ROUTE
// ----------------------------------------------------------------
app.get('/api/debug-check', async (req, res) => {
    try {
        // "rows" contains the actual data
        const [rows] = await db.query('SELECT * FROM todo');
        
        console.log('Total rows in table:', rows.length);
        if (rows.length > 0) {
            console.log('First row data:', rows[0]);
        }
        
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// ----------------------------------------------------------------
// LOGIN
// ----------------------------------------------------------------
app.post('/api/login', (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).send({ message: 'Username is required' });
    }
    
    // Success response includes the username
    res.send({ 
        success: true, 
        message: 'Login successful', 
        user: { username: username }
    });
});

// ----------------------------------------------------------------
// 1. READ: Get all todos for a specific user
// ----------------------------------------------------------------
app.get('/api/todos/:username', async (req, res) => {
    const { username } = req.params;
    const sql = 'SELECT id, task, done, updated, target_date FROM todo WHERE username = ? ORDER BY id DESC';
    
    try {
        const [rows] = await db.query(sql, [username]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// ----------------------------------------------------------------
// 2. CREATE: Add a new todo item
// ----------------------------------------------------------------
app.post('/api/todos', async (req, res) => {
    const { username, task } = req.body;
    if (!username || !task) {
        return res.status(400).send({ message: 'Username and task are required' });
    }
    
    const sql = 'INSERT INTO todo (username, task) VALUES (?, ?)';
    
    try {
        // destructure 'result' from the response array
        const [result] = await db.query(sql, [username, task]);
        
        // Return the created item details including the new ID
        res.status(201).send({ 
            id: result.insertId, 
            username, 
            task, 
            done: 0, 
            updated: new Date() 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// ----------------------------------------------------------------
// 3. UPDATE: Change 'done' status OR 'target_date'
// ----------------------------------------------------------------
app.put('/api/todos/:id', async (req, res) => {
    const { id } = req.params;
    const { done, target_date } = req.body;

    if (done === undefined && target_date === undefined) {
        return res.status(400).send({ message: 'Either done or target_date is required' });
    }

    let sql = '';
    let params = [];

    // Case 1: Update 'target_date'
    if (target_date !== undefined) {
        // FIX: Convert ISO string to JS Date Object for MySQL
        const dateObject = new Date(target_date);

        sql = `
            UPDATE todo 
            SET target_date = ?, updated = NOW()
            WHERE id = ?
        `;
        params = [dateObject, id]; 
    }
    // Case 2: Update 'done' status
    else if (done !== undefined) {        
        sql = `
            UPDATE todo 
            SET done = ?, updated = NOW() 
            WHERE id = ?
        `;
        params = [done, id];
    }
    
    try {
        const [result] = await db.query(sql, params);
        
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: 'Todo not found' });
        }
        res.send({ message: 'Todo updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// ----------------------------------------------------------------
// 4. DELETE: Remove a todo item
// ----------------------------------------------------------------
app.delete('/api/todos/:id', async (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM todo WHERE id = ?';
    
    try {
        const [result] = await db.query(sql, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: 'Todo not found' });
        }
        res.send({ message: 'Todo deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// Start the server
app.listen(port, host, () => {
    console.log(`Server listening at http://${host}:${port}`);
});