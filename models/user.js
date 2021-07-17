const pool = require("../utils/db.js");
const SqlString = require('sqlstring');

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
    }
}