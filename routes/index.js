const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const userCookie = req.cookies.user;
  if (req.flash('invalid').length > 0) {
    res.render('index', {invalid: true, user: userCookie});
  } else {
    res.render('index', {user: userCookie});
  }
});

module.exports = router;
