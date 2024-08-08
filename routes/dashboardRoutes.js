const express = require('express');
const { requireAuth, checkUser } = require('../middleware/authMiddleware');
const Job = require('../models/Job');

const router = express.Router();

router.get('/', requireAuth, checkUser, async (req, res) => {
    const userId = res.locals.user.id;
    const jobs = (await Job.find({userId: userId})).map(job => {
        return {
            title: job.title,
            employer: job.employersname,
            status: job.status,
            jobId: job.id,
        }
    });
    console.log(jobs);
    res.render('dashboard', {jobs: jobs});
});

router.get('/:id', requireAuth, async (req, res) => {
    console.log("LA");
    const jobId = req.params.id;
    const job = await Job.findById(jobId);
    res.render('updatejob', {
        title: job.title,
        website: job.Website,
        employer: job.employersname,
        email: job.Emailofcontact,
        phone: job.phone,
        address: job.addresscontact,
        origin: job.offer,
        status: job.status,
        comments: job.comments || "",
    });
});

router.post('/:id', requireAuth, async (req, res) => {
    const jobId = req.params.id;
    const toUpdate = {};
    // TODO 

    await Job.updateOne(jobId, toUpdate, (err => {
        if (!err) {
            res.status(200);
            res.redirect('/dashboard');
        } else {
            res.status(400).json({ err });
        }
    }));
});

module.exports = router;
