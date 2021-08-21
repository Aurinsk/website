const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const data = {
    user: req.cookies.user
  };

  if (req.flash('invalid').length > 0) {
    data.invalid = true;
  }

  if (req.flash('verified').length > 0) {
    data.verified = true;
  }

  if (req.flash('invalid').length > 0) {
    res.render('index', data);
  } else {
    res.render('index', data);
  }
});

module.exports = router;