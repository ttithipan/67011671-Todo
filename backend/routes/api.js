const express = require('express');
const router = express.Router();
const passport = require('passport');

const assembleMultipartFormData = require('multer')();

const todoController = require('../controllers/todoController');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const teamController = require('../controllers/teamController')

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

// --- User ---
router.get('/users/list', isAuthenticated, userController.listUsers);
// --- TODO ROUTES (Protected) ---
router.post('/todos/list', isAuthenticated, todoController.getTodos);
router.post('/todos', isAuthenticated, todoController.createTodo);
router.put('/todos/:id', isAuthenticated, todoController.updateTodo);
router.delete('/todos/:id', isAuthenticated, todoController.deleteTodo);

// --- Team ROUTES (Protected) ---
router.post('/teams', isAuthenticated, teamController.createTeam);
router.post('/teams/name', isAuthenticated, teamController.getTeamnames);
router.post('/teams/listmemberships', isAuthenticated, teamController.listMemberships);
router.post('/teams/listteammember', isAuthenticated, teamController.listTeamMembers);
router.post('/teams/rename', isAuthenticated, teamController.updateTeamname);
router.post('/teams/add_member', isAuthenticated, teamController.addMember);
router.post('/teams/del_member', isAuthenticated, teamController.deleteMember);

router.get("/pfp/:id", userController.getProfilePicture);
const profilePictureNameInFormData = 'image';
router.put("/pfp/:id", assembleMultipartFormData.single(profilePictureNameInFormData), userController.putProfilePicture);

// Init Passport
router.use(passport.initialize());
router.use(passport.session());

module.exports = router;