const express = require('express');
const router = express.Router();
const user = require('../models/user');

router.get('/', (req, res) => {
    if (!user.checkLoggedIn(req, res)) {
        res.redirect('/');
        return;
    }

    res.render('dashboard');
});

router.get('/minecraftmonitors', (req, res) => {
    if (!user.checkLoggedIn(req, res)) {
        res.redirect('/');
        return;
    }

    res.render('minecraftmonitors');
});

module.exports = router;