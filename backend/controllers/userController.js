const db = require('../config/db');

exports.updateProfile = async (req, res) => {
    const userId = req.user.id; // From Session
    const { newUsername } = req.body;

    if (!newUsername) return res.status(400).send('Username required');

    try {
        // Check uniqueness
        const [taken] = await db.query('SELECT id FROM users WHERE username = ?', [newUsername]);
        if (taken.length > 0) return res.status(409).send('Username taken');

        // Update
        await db.query('UPDATE users SET username = ? WHERE id = ?', [newUsername, userId]);
        
        res.json({ success: true, message: 'Username updated' });
    } catch (err) {
        res.status(500).send(err.message);
    }
};