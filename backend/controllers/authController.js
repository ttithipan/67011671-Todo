const db = require('../config/db');
const axios = require('axios');
const passport = require('passport');
const bcrypt = require('bcrypt');

async function verifyCaptcha(token) {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;
    
    try {
        const response = await axios.post(verifyUrl);
        return response.data.success;
    } catch (error) {
        console.error('Captcha error:', error);
        return false;
    }
}


const googleCallback = async (accessToken, refreshToken, profile, done) => {
    const googleId = profile.id;
    const email = profile.emails[0].value;
    const fullName = profile.displayName;

    try {
        const [users] = await db.execute('SELECT * FROM users WHERE google_id = ?', [googleId]);

        if (users.length > 0) {

            const user = users[0];
            await db.execute('UPDATE users SET full_name = ? WHERE id = ?', [fullName, user.id]);
            return done(null, user);
        }

        const [emailUsers] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (emailUsers.length > 0) {
            const existingUser = emailUsers[0];
            await db.execute('UPDATE users SET google_id = ?, full_name = ? WHERE id = ?', 
                [googleId, fullName, existingUser.id]);
            return done(null, existingUser);
        }
        const [result] = await db.execute(
            'INSERT INTO users (google_id, email, full_name, username) VALUES (?, ?, ?, ?)',
            [googleId, email, fullName, email] 
        );

        const [defaultTeam] = await db.execute(
            'INSERT INTO team_members (user_id, team_id) VALUES (?, 1)',
            [result.insertId])
        const newUser = { id: result.insertId, email: email, full_name: fullName };
        return done(null, newUser);

    } catch (error) {
        return done(error, null);
    }
};

const loginLocal = async (req, res, next) => {
    const { captchaToken } = req.body;

    const isHuman = await verifyCaptcha(captchaToken);

    if (!isHuman) {
        return res.status(400).json({ message: 'Captcha verification failed' });
    }

    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ message: info.message });

        req.logIn(user, (err) => {
            if (err) return next(err);
            return res.json({ success: true, message: 'Login successful', user });
        });
    })(req, res, next);
};

const register = async (req, res) => {
    const { email, password, fullName } = req.body;

    // 1. Basic Validation
    if (!email || !password || !fullName) {
        return res.status(400).json({ message: 'Please provide email, password, and full name.' });
    }

    try {
        const [existing] = await db.query(
            'SELECT * FROM users WHERE email = ?', 
            [email]
        );

        if (existing.length > 0) {
            return res.status(409).json({ message: 'Email already taken' });
        }

        // 3. Password Hashing (The Lab Requirement)
        const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;

        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(password, salt);

        // 4. Insert into Database
        // We assume 'email' is same as username for local, or you can add an email field to the form
        const insertSql = `
            INSERT INTO users (email, full_name, password_hash, salt, username) 
            VALUES (?, ?, ?, ?, NULL)
        `;

        const [result] = await db.execute(
            'INSERT INTO users (email, full_name, password_hash, salt, username) VALUES (?, ?, ?, ?, NULL)',
            [email, fullName, hash, salt] 
        );

        const [defaultTeam] = await db.execute(
            'INSERT INTO team_members (user_id, team_id) VALUES (?, 1)',
            [result.insertId])

        const newUser = { id: result.insertId, email: email, full_name: fullName };
        return done(null, newUser);

    } catch (error) {
        return done(error, null);
    }
};

module.exports = {
    googleCallback,
    loginLocal,
    register
};