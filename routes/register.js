const express = require('express');
const router = express.Router();
const user = require('../models/user');

router.get('/', (req, res) => {
    res.render('register', {username: req.flash('username')});
});

router.post('/', (req, res) => {
    // get username and password into own consts
    const email = req.body.email;
    const password = req.body.password;

    user.userExists(email)
        .then((response) => console.log(response));

    res.end();
});

module.exports = router;
