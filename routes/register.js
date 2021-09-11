const express = require('express');
const router = express.Router();
const user = require('../models/user');
const pool = require("../utils/db.js");
const handler = require('../utils/handler');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const SqlString = require('sqlstring');

router.get('/:registration_key', async (req, res) => {
    const registrationKey = req.params.registration_key;

    if (user.checkLoggedIn(req, res)) {
        res.redirect('/dashboard');
        return;
    }

    const query = SqlString.format('SELECT registration_key FROM registration_keys WHERE registration_key = ?', [registrationKey]);
    const connection = await pool.getConnection();
    const response = await connection.query(query);

    if (!response[0] || response[0][Object.keys(response[0])[0]] !== registrationKey) {
        res.redirect('/');
        return;
    }

    res.render('register');
});

router.post('/', async (req, res) => {
    const password = req.body.password;
    const registrationKey = req.body.registrationKey;

    const connection = await pool.getConnection();

    const id = Math.floor(10000000 + Math.random() * 90000000);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const emailQuery = SqlString.format('SELECT email FROM registration_keys WHERE registration_key=?', [registrationKey]);
    const emailResponse = await connection.query(emailQuery);

    const email = emailResponse[0].email;

    const insertQuery = SqlString.format('INSERT INTO users (email, password, id) VALUES (?, ?, ?)', [email, hashedPassword, id]);
    const insertResponse = await connection.query(insertQuery);

    const removeQuery = SqlString.format('DELETE FROM registration_keys WHERE registration_key = ?', [registrationKey]);
    const removeResponse = await connection.query(removeQuery);

    connection.close();

    let messageBody = `
    Hello,
                                
    This is the confirmation message to inform you that you have successfully signed up for the Aurinsk alpha test.
                                
    Please make sure that you remember your selected password, as it will not be changeable during the alpha testing period.
    `;
    messageBody = messageBody
        .split("\n")
        .map((line) => line.trim())
        .join("\n");

    const transporter = nodemailer.createTransport({
        host: "mail.aurinsk.com",
        port: 587,
        secure: false,
        auth: {
            user: "alerts@aurinsk.com",
            pass: "7Y<}Q+LfdMV>ZjEb8c6m"
        }
    });
    const mailOptions = {
        from: 'Waiting List <waitinglist@aurinsk.com>',
        to: email,
        subject: `Successful alpha test signup`,
        text: messageBody
    }

    transporter.sendMail(mailOptions);

    user.loginUser(res, email);
    res.redirect('/dashboard');

    return;
});

module.exports = router;
