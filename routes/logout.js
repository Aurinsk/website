const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.clearCookie('user');
    res.clearCookie('email');
    res.redirect('/');
})

module.exports = router;