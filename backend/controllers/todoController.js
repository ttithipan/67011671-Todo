const db = require('../config/db');

exports.getTodos = async (req, res) => {
    // We get the ID from the logged-in session, not the URL
    const userId = req.user.id; 
    const sql = 'SELECT id, task, done, updated, target_date FROM todo WHERE user_id = ? ORDER BY id DESC';
    
    try {
        const [rows] = await db.query(sql, [userId]);
        res.json(rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.createTodo = async (req, res) => {
    const userId = req.user.id;
    const { task } = req.body;

    if (!task) return res.status(400).send({ message: 'Task is required' });
    
    const sql = 'INSERT INTO todo (user_id, task) VALUES (?, ?)';
    
    try {
        const [result] = await db.query(sql, [userId, task]);
        res.status(201).send({ 
            id: result.insertId, 
            task, 
            done: 0, 
            updated: new Date() 
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.updateTodo = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { done, target_date } = req.body;

    // Security: Ensure this todo actually belongs to the logged-in user
    const checkSql = 'SELECT * FROM todo WHERE id = ? AND user_id = ?';
    const [check] = await db.query(checkSql, [id, userId]);
    if (check.length === 0) return res.status(403).send({ message: 'Unauthorized' });

    if (target_date !== undefined) {
        const dateObject = new Date(target_date);
        await db.query('UPDATE todo SET target_date = ?, updated = NOW() WHERE id = ?', [dateObject, id]);
    } else if (done !== undefined) {        
        await db.query('UPDATE todo SET done = ?, updated = NOW() WHERE id = ?', [done, id]);
    }
    
    res.send({ message: 'Todo updated successfully' });
};

exports.deleteTodo = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    
    const sql = 'DELETE FROM todo WHERE id = ? AND user_id = ?';
    
    try {
        const [result] = await db.query(sql, [id, userId]);
        if (result.affectedRows === 0) return res.status(404).send({ message: 'Todo not found or unauthorized' });
        res.send({ message: 'Todo deleted successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
};