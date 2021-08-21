const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.redirect('https://discord.gg/q93c5PHB3e');
});

module.exports = router;