const express = require('express');
const router = express.Router();
const pool = require("../utils/db.js");
const SqlString = require('sqlstring');

router.post('/', async (req, res) => {
    const checkQuery = SqlString.format('SELECT email FROM waiting_list WHERE email=?', [req.body.email]);
    const checkConn = await pool.getConnection();
    const checkResponse = await checkConn.query(checkQuery);

    if (checkResponse[0]) {
        res.status(200).end();
        return;
    }

    const query = SqlString.format('INSERT INTO waiting_list (email) VALUES (?)', [req.body.email]);

    const conn = await pool.getConnection();
    const response = await conn.query(query);

    conn.end();

    res.status(201).end();
});

module.exports = router;