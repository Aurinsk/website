const express = require('express');
const router = express.Router();
const pool = require("../utils/db.js");
const SqlString = require('sqlstring');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const fetch = require('isomorphic-fetch');

router.post('/', async (req, res) => {
    const conn = await pool.getConnection();
    const email = req.body.email;
    const token = req.body.token

    const reCaptchaUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${token}`;
    let googleResponse = await fetch(reCaptchaUrl, {
        method: 'POST'
    })
    googleResponse = await googleResponse.json();

    if (googleResponse.score < 0.6) {
        res.send('recaptcha_error').end();
        return;
    }

    const checkConfirmedQuery = SqlString.format('SELECT email FROM waiting_list WHERE email=?', [email]);
    const checkConfirmedResponse = await conn.query(checkConfirmedQuery);

    const checkUnconfirmedQuery = SqlString.format('SELECT email FROM unconfirmed_waiting_list WHERE email=?', [email]);
    const checkUnconfirmedResponse = await conn.query(checkUnconfirmedQuery);

    if (checkConfirmedResponse[0] || checkUnconfirmedResponse[0]) {
        res.send('exists').end();
        return;
    }

    const verificationCode = crypto.randomBytes(20).toString('hex').substr(0, 32);

    const query = SqlString.format('INSERT INTO unconfirmed_waiting_list (email, verification_code) VALUES (?, ?)', [email, verificationCode]);
    const response = await conn.query(query);

    conn.end();

    let messageBody = `
    Hello,
    
    Thank you for signing up to participate in the Aurinsk closed alpha.
    
    Please click the link below to confirm your waiting list placement.
    
    https://aurinsk.com/waitinglist/confirm/${verificationCode}
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
            user: "waitinglist@aurinsk.com",
            pass: "m2.*Dd=A4z^_C3$BG]cu"
        }
    });
    const mailOptions = {
        from: 'Waiting List <waitinglist@aurinsk.com>',
        to: email,
        subject: `Confirm your waiting list placement`,
        text: messageBody
    }

    await transporter.sendMail(mailOptions);

    res.send('success').end();
});

router.get('/confirm/:verificationCode', async (req, res) => {
    const conn = await pool.getConnection();
    const verificationCode = req.params.verificationCode;

    const checkQuery = SqlString.format('SELECT * FROM unconfirmed_waiting_list WHERE verification_code=?', [verificationCode]);
    const checkResponse = await conn.query(checkQuery);

    if (!checkResponse[0]) {
        conn.end();
        res.redirect('/');
        return;
    }

    const moveQuery = SqlString.format('INSERT INTO waiting_list (email, time) SELECT email, time FROM unconfirmed_waiting_list WHERE verification_code = ?; DELETE FROM unconfirmed_waiting_list WHERE verification_code = ?', [verificationCode, verificationCode]);
    await conn.query(moveQuery);
    conn.end();

    req.flash('verified', true);
    res.redirect('/');
})

module.exports = router;