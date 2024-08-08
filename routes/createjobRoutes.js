const express = require('express');
const Job = require("../models/Job");
const { requireAuth, checkUser } = require('../middleware/authMiddleware');

const router = express.Router();

// Utils
const handleErrors = (err) => {
    console.log(err.message, err.code);
    let errors = [];
  
    // validation errors
    if (err.message.includes('user validation failed')) {
        // console.log(err);
        Object.values(err.errors).forEach(({ properties }) => {
            errors.push(properties.message);
        });
    }
    console.log(errors);
    return errors;
}

// Routes
router.get('/', requireAuth, (req, res) => {
    res.render('createjob');
})

router.post('/', requireAuth, checkUser, async (req, res) => {
    const userId = res.locals.user.id;
    const {Website, employersname, Emailofcontact, phone, addresscontact, origin, status, comments} = req.body;
    const title = req.body["job-title"];

    try {
        const job = await Job.create({ title: title, Website, employersname, Emailofcontact, phone, addresscontact, origin, status, comments, userId: userId});
        res.status(201);
        res.redirect('/');
    } catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
})

module.exports = router;
