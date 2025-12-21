// config/passport.js
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcrypt');
const db = require('./db');
const authController = require('../controllers/authController');

module.exports = function(passport) {
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Retrieve user details from ID in session
    passport.deserializeUser(async (id, done) => {
        try {
            const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
            done(null, rows[0]);
        } catch (err) {
            done(err, null);
        }
    });

    passport.use(new LocalStrategy({usernameField:'email', passwordField: 'password' }, async (email, password, done) => {
        try {
            // Find user
            const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
            
            if (rows.length === 0) {
                return done(null, false, { message: 'Incorrect email.' });
            }

            const user = rows[0];

            // If user exists but only has Google auth (no password set)
            if (!user.password_hash) {
                return done(null, false, { message: 'Please log in with Google.' });
            }

            // Compare password
            const match = await bcrypt.compare(password, user.password_hash);
            
            if (!match) {
                return done(null, false, { message: 'Incorrect password.' });
            }

            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }));

    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback"
      },
      authController.googleCallback
    ));
};