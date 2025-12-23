const express = require('express');
const router = express.Router();
const passport = require('passport');
const todoController = require('../controllers/todoController');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const teamController = require('../controllers/teamController');
const protectedRoute = require('../middleware/auth');
// Middleware to check if user is logged in



router.post('/auth/register', authController.register);
router.post('/auth/login', authController.loginLocal)

// --- AUTH ROUTES ---
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        // Successful authentication, redirect home.
        res.redirect(`http://localhost:${process.env.FRONTEND_PORT}/`); 
    }
);

router.get('/auth/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});

router.get('/auth/me', protectedRoute, (req, res) => {
    res.json(req.user);
});

// --- TODO ROUTES (Protected) ---
router.get('/todos', protectedRoute, todoController.getTodos);
router.post('/todos', protectedRoute, todoController.createTodo);
router.put('/todos/:id', protectedRoute, todoController.updateTodo);
router.delete('/todos/:id', protectedRoute, todoController.deleteTodo);

// --- Team ROUTES (Protected) ---
router.post('/teams', protectedRoute, teamController.createTeam);
router.post('/teams/name', protectedRoute, teamController.getTeamNames);
router.post('/teams/listmemberships', protectedRoute, teamController.listMembership);

module.exports = router;