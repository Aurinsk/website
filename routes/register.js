const express = require('express');
const router = express.Router();
const user = require('../models/user');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

router.get('/', (req, res) => {
    res.render('register', {username: req.flash('username')});
});

router.get('/:verification_code', (req, res) => {
    const verification_code = req.params.verification_code;
    user.confirmUser(verification_code)
        .then((r) => console.log(r));

    res.end();
});

router.post('/', (req, res) => {
    // get username and password into own consts
    const email = req.body.email;
    const password = req.body.password;
    const verificationCode = crypto.randomBytes(16).toString('hex');

    let userExists;
    return Promise.all([
        userExists = user.userExists(email),
        user.insertUnconfirmed(email, password, verificationCode)
    ]).then(() => {
        /*
        NEED TO CHECK HERE FOR PASSWORD LENGTH, IF EMAIL ALREADY EXISTS, ETC
         */

        const messagebody = `
        Hello,
        
        Please click the link below to verify your account.
        
        http://localhost:3000/register/${verificationCode}
        `;

        const transporter = nodemailer.createTransport('smtp://hwgilbert16@gmail.com:tjzecesmgkxgpmsw@smtp.gmail.com');
        const mailOptions = {
            from: 'hwgilbert16@gmail.com',
            to: 'hwgilbert16@gmail.com',
            subject: 'Email Verification',
            text: messagebody
        };

        transporter.sendMail(mailOptions, (err, data) => {
            if (err) {
                console.log('Error');
            } else {
                console.log('Email sent successfully');
            }
        });

        res.redirect('/hello');
    }).catch((e) => {
        throw e;
    })
});

module.exports = router;
