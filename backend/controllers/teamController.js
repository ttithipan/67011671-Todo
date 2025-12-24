const db = require('../config/db');

exports.createTeam = async (req, res) => {
    const userId = req.user.id;
    const { name } = req.body;
    console.log(name); 
    try {
        const [result] = await db.query(
            'INSERT INTO teams (name) VALUES (?)',
            [name]
        );
        const teamId = result.insertId
        await db.query(
            'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)',
            [teamId, userId, 'leader']
        );
        res.status(201).json({ message: 'Team created successfully', teamId });
    } catch (error) {
        res.status(500).json({ message: 'Error creating team', error: error.message });
    };
};

exports.listMemberships = async (req, res) => {
    const userId = req.user.id;
    try {
        const [result] = await db.query('SELECT team_id, role FROM team_members WHERE user_id = ?', [userId]);
        if (result.length === 0) {
            return res.status(404).json({ message: 'Membership not found' });
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching memberships', error: error.message });
    };
};

exports.getTeamNames = async (req, res) => {
    const { teamIds } = req.body;

    if (!teamIds || teamIds.length === 0) {
        return res.json([]); 
    }

    try {
        const placeholders = teamIds.map(() => '?').join(',');
        const query = `SELECT id, name FROM teams WHERE id IN (${placeholders})`;
        const [results] = await db.query(query, teamIds);
        res.json(results);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};