const pool = require("../utils/db.js");
const SqlString = require('sqlstring');
const bcrypt = require('bcrypt');

module.exports = {
    // check if user exists in user table or unconfirmed users table
    async userExists(email) {
        try {
            // escape characters
            const query = SqlString.format('SELECT email FROM users WHERE email=? union SELECT email FROM unconfirmed_users WHERE email=?', [email, email]);

            const conn = await pool.getConnection();
            const rows = await conn.query(query);

            conn.end();

            return rows.length > 0;
        } catch (e) {
            throw e;
        }
    },

    // get user from db
    async getUser(email) {
        try {
            email = sqlstring.escape(email);
            const conn = await pool.getConnection();
            const rows = await conn.query(`SELECT * FROM users WHERE email=${email}`);

            conn.end();

            if (rows.length > 0) {
                return rows[0];
            } else {
                return false;
            }

        } catch (e) {
            throw e;
        }
    },

    // insert user into unconfirmed table
    // have to do verification code in register.js since it doesn't make sense for this to return the code
    async insertUnconfirmed(email, password, verificationCode) {
        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const query = SqlString.format('INSERT INTO unconfirmed_users (email, password, verification_code) VALUES (?, ?, ?)', [email, hashedPassword, verificationCode]);

            const conn = await pool.getConnection();
            const response = await conn.query(query);

            conn.end();

        } catch (e) {
            throw e;
        }
    },

    async verifyUser(verificationCode) {
        const query = SqlString.format('INSERT INTO users (email, password) SELECT email, password FROM unconfirmed_users WHERE verification_code = ?', [verificationCode]);

        const conn = await pool.getConnection();
        const verifyUser = await conn.query(query);

        console.log(verifyUser);

        conn.end();
    }

}