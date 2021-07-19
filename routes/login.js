const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const user = require('../models/user.js');

router.get('/', (req, res) => {
    res.render('login');
});

router.post('/', (req, res) => {

});

module.exports = router;
