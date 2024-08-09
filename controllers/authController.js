const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');

//handle errors
const handleErrors = (err) => {
    console.log('Error:', err.message, err.code);
    let errors = { email: '', password: '' };

    // Handle specific errors (validation errors)
    if (err.message && err.message.includes('validation failed')) {
        Object.values(err.errors).forEach(({ properties }) => {
            if (properties && properties.path) {
                errors[properties.path] = properties.message;
            }
        });
    }

    // Incorrect password error
    if (err.code === 'incorrect password'|| err.message === 'incorrect password') {
        errors.password = 'That password is incorrect';
    }

    if (err.code === 'incorrect email' || err.message === 'incorrect email') {
        errors.email = 'That email is not registered';
    }

    // Duplicate email error (MongoDB error code 11000)
    if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
        errors.email = 'That email is already registered';
    }

    if (err.code === 'Minimum 8 characters' || err.message === 'Minimum 8 characters') {
        errors.password = 'Minimum 8 characters';
    }

    if (err.code === 'User validation failed' || err.message === 'User validation failed') {
        errors.password = 'Minimum 8 characters';
    }

    return errors;
};

const maxAge = 3*24*60*60;

const createToken = (id) => {
    return jwt.sign({id}, 'jobappjwt_secret', {
        expiresIn: maxAge
    });
}


module.exports.signup_post = async (req, res) => {
    try {
        console.log('Form Data:', req.body);
        const { firstname, lastname, email, github, password } = req.body;
        if (!firstname || !lastname || !email || !password) {
            return res.status(400).render('register', { alert: 'Please fill in all required fields.' });
        }
        const picture = req.files && req.files.picture ? req.files.picture[0].path : '';
        const cv = req.files && req.files.cv ? req.files.cv[0].path : '';

        const user = User({
            firstname,
            lastname,
            email,
            github,
            password,
            picture,
            cv
        });
        await user.save();

        const token = createToken(user._id);
        res.cookie('jwt', token,  { httpOnly:true, maxAge: maxAge *1000});
        res.status(201).render('profile',{user, alert: ''});
    } catch (error) {
        res.status(400).render('register', { alert: error });    }
};

module.exports.login_post = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`Login attempt for email: ${email}`);

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).render('login', { err: 'Invalid email' });
        }

        // Compare the password with the stored hash
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).render('login', { err: 'Incorrect password' });
        }

        // If passwords match, proceed with login
        console.log('Login successful:', user);
        const token = createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.redirect('/dashboard');
    } catch (err) {
        console.log('Login failed:', err.message);
        const errors = handleErrors(err);
        res.status(400).render('login', { err: errors });
    }
};


module.exports.logout_get = (req,res) =>{
    res.cookie('jwt', '', {maxAge: 1});
    res.redirect('/');
};

module.exports.checkPassword = (req, res, next) =>{
    const {password, confirm}= req.body;
    if(password === confirm) {
        next();
    } else {
        const alert = 'Confirm the password please';
        res.render('register', { alert });
    }
}

module.exports.create_job = async (req, res) => {
    try {
        console.log('Form Data:', req.body);
        const { jobtitle, website, companyname, emailcompany, phone, address, origin, status, comments } = req.body;
        if (!jobtitle || !companyname || !emailcompany || !origin || !status ) {
            return res.status(400).render('createjob', { alert: 'Please fill in all required fields.' });
        }
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).render('createjob', { alert: 'User not found' });
        }

        const newJob = {
            jobtitle,
            website,
            companyname,
            emailcompany,
            phone,
            address,
            origin,
            status,
            comments
        };

        user.jobs.push(newJob);
        await user.save();
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).render('createjob', { alert: 'Failed to create job' , user: req.user });
    }
};
module.exports.dashboard_jobs = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        // If the user is not found, return an error response
        if (!user) {
            return console.log({ error: 'User not found' });
        }

        // Get the user's jobs
        const jobs = user.jobs;

        // Render the dashboard template and pass the jobs data to the EJS template
        res.status(200).render('dashboard', { jobs, user });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).render('login', { err: 'Failed to load dashboard' });
    }
};

module.exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = req.user.id;

        // Ensure new password and confirmation match
        if (newPassword !== confirmPassword) {
            return res.status(400).render('profile', { alert: 'New passwords do not match', user: req.user });
        }

        // Fetch user from the database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).render('profile', { alert: 'User not found', user: req.user });
        }

        // Check if the current password is correct
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).render('profile', { alert: 'Incorrect current password', user: req.user });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        console.log('New hashed password:', hashedPassword);


        // Connect to MongoDB
        const uri = "mongodb+srv://natha:56515651mimiMI@cluster0.uwbp62c.mongodb.net/node-auth";
        const client = new MongoClient(uri);

        await client.connect();
        const database = client.db("node-auth");
        const users = database.collection("users");

        // Update the user's password in the database
        const updateResult = await users.updateOne(
            { _id: user._id },
            { $set: { password: hashedPassword } }
        );

        // Fetch the updated user for verification
        const updatedUser = await users.findOne({ _id: user._id });
        console.log('User object after update:', updatedUser);

        await client.close();

        // Check if the password was successfully updated
        if (updateResult.modifiedCount === 1) {
            res.status(200).render('profile', { alert: 'Password updated successfully', user: updatedUser });
        } else {
            res.status(400).render('profile', { alert: 'Failed to update password', user: req.user });
        }
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).render('profile', { alert: 'An error occurred', user: req.user });
    }
};

module.exports.updateJob = async(req, res) => {
    try {
        const userId = req.user.id;
        const { jobId } = req.params;
        const jobUpdates = req.body; 

        const user = await User.findById(userId);

        if (!user) {
        return res.status(404).render('info',{ alert: 'User not found' });
        }

         // Find the specific job in the user's jobs array
        const job = user.jobs.id(jobId);
        if (!job) {
            return res.status(404).render('info',{ alert: 'Job not found' });
        }

         // Update the job with new data from the form
        job.set(jobUpdates);

         // Save the updated user document back to the database
        await user.save();

         // Respond with success or redirect back to the profile page
        res.status(200).render('info', { user, job, alert: 'Job updated successfully'});

    } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).render('dashboard', { alert: 'An error occurred', user: req.user });
    }
}


module.exports.filterJobs = async (req, res) => {
    try {
        const { status, order } = req.query;
        let filter = {};
        let sort = {};

        // Apply status filter if selected
        if (status && status !== '') {
            filter.status = status;
        }

        // Apply sorting order if selected
        if (order === 'asc' || order === 'desc') {
            sort.createdAt = order === 'asc' ? 1 : -1;
        }

        // Fetch the user from the database
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Manually filter and sort jobs
        let jobs = user.jobs;

        if (status && status !== '') {
            jobs = jobs.filter(job => job.status === status);
        }

        if (order === 'asc' || order === 'desc') {
            jobs = jobs.sort((a, b) => {
                return order === 'asc' ? 
                    new Date(a.createdAt) - new Date(b.createdAt) : 
                    new Date(b.createdAt) - new Date(a.createdAt);
            });
        }

        // Render the dashboard with the filtered and sorted jobs
        res.render('dashboard', { user, jobs });
    } catch (err) {
        console.error('Error fetching jobs:', err);
        res.status(500).send('Server Error');
    }
};
