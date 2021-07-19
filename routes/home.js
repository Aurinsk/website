const express = require('express');
const router = express.Router();
const user = require('../models/user.js');

router.get('/', (req, res) => {
    res.send('home');
    res.end();
});

module.exports = router;