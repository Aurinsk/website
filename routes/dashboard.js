const express = require('express');
const router = express.Router();
const user = require('../models/user');

router.get('/', (req, res) => {
    if (!user.checkLoggedIn(req, res)) {
        res.redirect('/');
        return;
    }

    res.render('dashboard', {buildVersion: req.app.get('buildVersion')});
});

router.get('/minecraftmonitors', (req, res) => {
    if (!user.checkLoggedIn(req, res)) {
        res.redirect('/');
        return;
    }

    res.render('minecraftmonitors', {buildVersion: req.app.get('buildVersion')});
});

module.exports = router;