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
    console.log("PROFILE POST");
    console.log(req.body);
    const userId = res.locals.user.id;
    console.log(userId);
    const password = req.body.password;
    const cv = req.body.cv;
    console.log(password, cv);
    const toUpdate = {};
    if (password) {
        toUpdate.password = password;
    }
    if (cv) {
        toUpdate.cv = cv;
        // TODO cloudinary
    }
    console.log(toUpdate);

    try {
        await User.updateOne({_id: userId}, toUpdate);
        res.status(200);
        res.redirect('/profile');
    } catch(err) {
        res.status(400).json({ err });
    }
});

module.exports = router;
