const express = require('express');
const router = express.Router();
const mariadb = require('mariadb');
const sqlstring = require('sqlstring');

router.get('/', (req, res) => {
    res.render('register', {username: req.flash('username')});
});

router.post('/', (req, res) => {
    // get username and password into own consts
    const username = sqlstring.escape(req.body.username);
    const password = sqlstring.escape(req.body.password);

    console.log(req.body);

    // initialize mariadb connection
    const pool = mariadb.createPool({
        host: '192.168.1.103',
        user: 'superuser',
        password: 'D6AZJ5mbEdn7N5Wj',
        connectionLimit: 5,
        database: 'aurinsk'
    });

    // db query function
    async function query(query) {
        let rows;
        let conn;
        try {
            conn = await pool.getConnection();
            rows = await conn.query(query);
        } catch (err) {
            throw err;
        } finally {
            if (conn) {
                conn.end();
                return rows;
            }
        }
    }

    // check if email already exists
    query(`SELECT * from users WHERE email=username`)
        .then((res) => {
            if (res[0]) {
                console.log(res)
            }
        });

    res.end();
});

module.exports = router;
