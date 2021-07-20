const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const user = require('../models/user.js');

router.get('/', (req, res) => {
    if (user.checkLoggedIn(req, res)) {
        res.redirect('/home');
        return;
    }

    res.render('login', {valid: req.flash('valid')});
});

router.post('/', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    const userInfo = await user.getUser(email);

    if (!userInfo) {
        req.flash('invalid', true);
        res.redirect('/');
        return;
    }

    const validation = await bcrypt.compare(password, userInfo.password);

    if (!validation) {
        req.flash('invalid', true);
        res.redirect('/');
        return;
    }

    user.loginUser(res, email);

    res.redirect('/home');

    res.end();
});

module.exports = router;
