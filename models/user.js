const pool = require("../utils/db.js");
const SqlString = require('sqlstring');
const bcrypt = require('bcrypt');

// this should probably all be in a class but module.exports is fine for now until beta

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

            const id = Math.floor(10000000 + Math.random() * 90000000);

            const query = SqlString.format('INSERT INTO unconfirmed_users (email, password, id, verification_code) VALUES (?, ?, ?, ?)', [email, hashedPassword, id, verificationCode]);

            const conn = await pool.getConnection();
            const response = await conn.query(query);

            conn.end();

        } catch (e) {
            throw e;
        }
    },

    async confirmUser(verificationCode) {
        const copyQuery = SqlString.format('INSERT INTO users (email, password, id) SELECT email, password, id FROM unconfirmed_users WHERE verification_code = ?; DELETE FROM unconfirmed_users WHERE verification_code = ?', [verificationCode, verificationCode]);

        const conn = await pool.getConnection();
        const verifyUser = await conn.query(copyQuery);

        conn.end();

        return true;
    }

}