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
exports.listTeamMembers = async (req, res) => {
    // Expecting an array of IDs from the client, e.g., { "teamIds": [1, 2, 5] }
    const { teamIds } = req.body; 

    // 1. Basic Validation
    if (!teamIds || !Array.isArray(teamIds) || teamIds.length === 0) {
        return res.status(400).json({ message: 'Please provide a non-empty array of teamIds' });
    }

    try {
        const query = 'SELECT team_id, user_id, role FROM team_members WHERE team_id IN (?)';
        
        const [results] = await db.query(query, [teamIds]);
        const teamMemberList = teamIds.map(id => {
            return results.filter(member => member.team_id === id);
        });

        res.json(teamMemberList);

    } catch (error) {
        res.status(500).json({ message: 'Error fetching team members', error: error.message });
    }
};
exports.getTeamnames = async (req, res) => {
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

exports.updateTeamname = async (req, res) => {
    const userId = req.user.id; // From Session
    const { newTeamname, teamId } = req.body;
    

    if (!newTeamname) return res.status(400).send('Teamname required');

    try {
        const status = await db.query('SELECT role FROM team_members WHERE user_id = ? and team_id = ?', [userId, teamId])
        const role = status[0]
        if (role[0]?.role === 'leader') {
            await db.query('UPDATE teams SET name = ? WHERE id = ?', [newTeamname, teamId]);
            res.json({ success: true, message: 'Teamname updated' });
        }
        else {
            res.status(403).send("Forbidden");
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.addMember = async (req, res) => {
    const { teamId, userId, role } = req.body;

    if (!teamId || !userId) {
        return res.status(400).json({ 
            message: "teamId and userId are required fields." 
        });
    }

    try {
        // 2. Check if the membership already exists (Optional but recommended)
        const checkSql = 'SELECT * FROM team_members WHERE team_id = ? AND user_id = ?';
        const [existing] = await db.execute(checkSql, [teamId, userId]);

        if (existing.length > 0) {
            return res.status(409).json({ message: "User is already a member of this team." });
        }

        // 3. Insert the new member
        // We use '?' placeholders to prevent SQL Injection
        const insertSql = `
            INSERT INTO team_members (team_id, user_id, role, joined_at) 
            VALUES (?, ?, ?, NOW())
        `;
        
        const [result] = await db.execute(insertSql, [teamId, userId, role || 'member']);

        // 4. Success response
        return res.status(201).json({
            message: "Member added successfully",
            membershipId: result.insertId
        });

    } catch (error) {
        console.error("Error in addMember:", error);
        return res.status(500).json({ 
            message: "Internal server error", 
            error: error.message 
        });
    }
};

exports.deleteMember = async (req, res) => {
    const { teamId, userId } = req.body;

    if (!teamId || !userId) {
        return res.status(400).json({ 
            message: "teamId and userId are required to remove a member." 
        });
    }

    try {
        const deleteSql = 'DELETE FROM team_members WHERE team_id = ? AND user_id = ?';
        const [result] = await db.execute(deleteSql, [teamId, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                message: "Member not found in this team." 
            });
        }

        return res.status(200).json({
            message: "Member removed successfully from the team."
        });

    } catch (error) {
        console.error("Error in deleteMember:", error);
        return res.status(500).json({ 
            message: "Internal server error", 
            error: error.message 
        });
    }
};