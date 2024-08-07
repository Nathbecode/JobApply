const express = require('express');
const User = require("../models/User"); // DB
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const router = express.Router();
cloudinary.config({ 
    cloud_name: 'dhaij9evf', 
    api_key: '475535434537343', 
    api_secret: 'EvSOIWgHfH1bt1R_dPDqSp0BpMM' // Click 'View Credentials' below to copy your API secret
});
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Utils
// handle errors
const handleErrors = (err) => {
    console.log(err.message, err.code);
    let errors = { email: '', password: '' };
  
    // incorrect email
    if (err.message === 'incorrect email') {
        errors.email = 'That email is not registered';
    }
  
    // incorrect password
    if (err.message === 'incorrect password') {
        errors.password = 'That password is incorrect';
    }
  
    // duplicate email error
    if (err.code === 11000) {
        errors.email = 'that email is already registered';
        return errors;
    }
  
    // validation errors
    if (err.message.includes('user validation failed')) {
        // console.log(err);
        Object.values(err.errors).forEach(({ properties }) => {
            // console.log(val);
            // console.log(properties);
            errors[properties.path] = properties.message;
        });
    }
  
    return errors;
}

// Create a 3 days json web token
const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, 'net ninja secret', {
    expiresIn: maxAge
  });
};

// Register
router.get('/sign-up', (req, res) => {
    res.render('sign-up');
});

router.post('/sign-up', upload.single('profilePicture'), async (req, res) => {
    const { Firstname, Lastname, email, Github, cv, password } = req.body;
    const repeatPwd = req.body["repeat-password"];

    // if (password !== repeatPwd) {
    //     // TODO do something if passwords are not the same
    // }


    // Upload profile picture and CV on Cloudinary.
    console.log(req.file);
    let imageSrc = "";
    let cvSrc = "";
    // https://medium.com/@jatinumamtora/uploading-images-directly-to-cloudinary-from-a-form-in-node-js-6f3a087481b0
    // https://www.npmjs.com/package/multer

    await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ error: 'Error uploading to Cloudinary' });
            }
            console.log(result);
            uploadResult = result
            imageSrc = result.secure_url;
            // cvSrc = result.secure_url;
            resolve();
        }).end(req.file.buffer);
    });
    console.log(uploadResult.secure_url);


    try {
        const user = await User.create({ Firstname, Lastname, email, Github, profilePicture: imageSrc, cv: cvSrc, password });
        console.log("user", user);
        const token = createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.status(201)
        res.redirect('/');
    }
    catch(err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
});

// Login
router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', async (req, res) => {
    console.log(req.body);
    const { email, password } = req.body;
  
    try {
        const user = await User.login(email, password);
        const token = createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.status(200);
        res.redirect('/');
    } 
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
});

router.get('/logout', (req, res) => {
    res.cookie('jwt', '', { maxAge: 1 });
    res.redirect('/');
});

module.exports = router;
