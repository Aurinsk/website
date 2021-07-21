const express = require('express');
const router = express.Router();
const user = require('../models/user');
const handler = require('../utils/handler');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

router.get('/', (req, res) => {
    if (user.checkLoggedIn(req, res)) {
        res.redirect('/home');
        return;
    }

    res.render('register', {emailExists: req.flash('emailExists')});
});

router.get('/:verification_code', (req, res) => {
    const verification_code = req.params.verification_code;

    if (verification_code.length < 32) {
        res.redirect('/');
        return;
    }

    user.confirmUser(verification_code)
        .then((r) => console.log(r))
        .catch((e) => handler.handle('register'))

    res.end();
});

// router.get('/success', (req, res) => {
//     res.render('registerSuccess');
// });

router.post('/', async (req, res) => {
    // get username and password into own consts
    const email = req.body.email;
    const password = req.body.password;
    const verificationCode = crypto.randomBytes(16).toString('hex');

    // values are escaped in user model
    const userExists = await user.userExists(email);

    // check if email already exists
    if (userExists) {
        req.flash('emailExists', true);
        res.redirect('/register');
        return;
    }

    const insertUnconfirmed = await user.insertUnconfirmed(email, password, verificationCode);

    // error handling for insertUnconfirmed
    if (!insertUnconfirmed) {
        req.flash('error', true);
        res.redirect('/register');
        return;
    }

    const messageBody = `
    Hello,

    Please click the link below to verify your account.

    http://localhost:3000/register/${verificationCode}
    `;

    const transporter = nodemailer.createTransport('smtp://hwgilbert16@gmail.com:tjzecesmgkxgpmsw@smtp.gmail.com');
    const mailOptions = {
        from: 'hwgilbert16@gmail.com',
        to: email,
        subject: 'Email Verification',
        text: messageBody
    };

    transporter.sendMail(mailOptions, (err, data) => {
        if (err) {
            handler.handle(req, res, 'register');
        } else {
            console.log('Email sent successfully');
        }
    });

    res.redirect('/dashboard');

    return true;
});

module.exports = router;
