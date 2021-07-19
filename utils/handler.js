module.exports = {
    handle(req, res, event) {
        switch (event) {
            case 'register':
                req.flash('error', true);
                res.redirect('/register');
                break;
        }
    }
}