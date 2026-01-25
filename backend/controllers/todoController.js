const db = require('../config/db');
const teamController = require('../controllers/teamController');
exports.getTodos = async (req, res) => {
    try {
        const userId = req.user.id;
        // 1. Safety: Ensure teamIds is actually an array to prevent .filter crashes
        const teamIds = Array.isArray(req.body.teamIds) ? req.body.teamIds : [];
        const otherTeamIds = teamIds.filter(id => id != 1);

        // 2. Prepare Personal Tasks Query
        const sqlPersonalTask = 'SELECT id, team_id, task, done, updated, target_date FROM todo WHERE owner = ? AND team_id = 1 ORDER BY id DESC';
        const personalTaskPromise = db.query(sqlPersonalTask, [userId]);

        // 3. Prepare Team Tasks Query (Only if needed)
        let teamTaskPromise = Promise.resolve([[]]); // Default to empty result structure
        
        if (otherTeamIds.length > 0) {
            const placeholder = otherTeamIds.map(() => '?').join(',');
            const sqlTeamTask = `SELECT id, team_id, task, done, updated, target_date, assignee FROM todo WHERE team_id IN (${placeholder}) ORDER BY id DESC`;
            teamTaskPromise = db.query(sqlTeamTask, otherTeamIds);
        }
        const [[personalTasks], [teamTasks]] = await Promise.all([
            personalTaskPromise,
            teamTaskPromise
        ]);
        let allTasks = [...personalTasks, ...teamTasks];

        res.status(200).send({
            message: "Todo fetched successfully",
            data: allTasks
        });

    } catch (err) {
        console.error("Error in getTodos:", err);
        res.status(500).send({ message: "Internal Server Error" });
    }
};

exports.createTodo = async (req, res) => {
    const userId = req.user.id;
    const { task, teamId } = req.body;

    if (!task) return res.status(400).send({ message: 'Task is required' });
    const sql = 'INSERT INTO todo (owner, team_id, task) VALUES (?, ?, ?)';
    
    try {
        const [result] = await db.query(sql, [userId, teamId, task]);
        res.status(201).send({ 
            id: result.insertId, 
            task,
            teamId,
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
    const { done, target_date, assignee } = req.body;

    const checkSql = 'SELECT * FROM todo WHERE id = ? AND (owner = ? OR assignee = ?)';
    const [check] = await db.query(checkSql, [id, userId, userId]);
    if (check.length === 0) return res.status(403).send({ message: 'Unauthorized' });

    if (target_date !== undefined) {
        const dateObject = new Date(target_date);
        await db.query('UPDATE todo SET target_date = ?, updated = NOW() WHERE id = ?', [dateObject, id]);
    } else if (done !== undefined) {        
        await db.query('UPDATE todo SET done = ?, updated = NOW() WHERE id = ?', [done, id]);
    } else if (assignee !== undefined) {
        // Convert empty or whitespace-only strings to null
        const assigneeValue = (typeof assignee === 'string' && assignee.trim() === '') ? null : assignee;

        await db.query('UPDATE todo SET assignee = ?, updated = NOW() WHERE id = ?', [assigneeValue, id]);
    }
    
    res.send({ message: 'Todo updated successfully' });
};

exports.deleteTodo = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    
    const sql = 'DELETE FROM todo WHERE id = ? AND owner = ?';
    
    try {
        const [result] = await db.query(sql, [id, userId]);
        if (result.affectedRows === 0) return res.status(404).send({ message: 'Todo not found or unauthorized' });
        res.send({ message: 'Todo deleted successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
};