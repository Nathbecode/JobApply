const express = require('express');
const { requireAuth, checkUser } = require('../middleware/authMiddleware');
const User = require('../models/User');

const router = express.Router();

router.get('/', requireAuth, checkUser, (req, res) => {
    const user = res.locals.user;
    if (user) {
        res.render('profile', {
            fullname: user.Firstname + " " + user.Lastname,
            email: user.email,
            github: user.Github,
            profilePicture: user.profilePicture,
            cv: user.cv,
        });
    } else {
        res.redirect('/login');
    }
});

router.post('/', requireAuth, checkUser, async (req, res) => {
    const userId = res.locals.user.id;
    const password = req.body.password;
    const cv = req.body.cv;
    const toUpdate = {};
    if (password) {
        toUpdate.password = password;
    }
    if (cv) {
        // TODO cloudinary
    }

    await User.updateOne(userId, toUpdate, (err => {
        if (!err) {
            res.status(200);
            res.redirect('/profile');
        } else {
            res.status(400).json({ err });
        }
    }));
});

module.exports = router;
