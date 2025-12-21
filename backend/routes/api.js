const express = require('express');
const router = express.Router();
const passport = require('passport');
const todoController = require('../controllers/todoController');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: 'Please log in' });
};


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

router.get('/auth/me', isAuthenticated, (req, res) => {
    res.json(req.user);
});

// --- TODO ROUTES (Protected) ---
router.get('/todos', isAuthenticated, todoController.getTodos);
router.post('/todos', isAuthenticated, todoController.createTodo);
router.put('/todos/:id', isAuthenticated, todoController.updateTodo);
router.delete('/todos/:id', isAuthenticated, todoController.deleteTodo);

module.exports = router;