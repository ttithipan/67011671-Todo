require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const apiRoutes = require('./routes/api');

require('./config/passport')(passport);

const app = express();
const host = process.env.API_HOST;
const port = process.env.API_PORT;

app.use(cors(
    {origin: `http://localhost:${process.env.FRONTEND_PORT}`, credentials: true },
    {origin: `http://localhost:${process.env.DB_PORT}`, credentials: true}
));
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '1mb'}));

// Session Setup
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Init Passport
app.use(passport.initialize());
app.use(passport.session());

// Mount Routes
app.use('/api', apiRoutes);

app.listen(port, host, () => {
    console.log(`Server listening at http://${host}:${port}`);
});