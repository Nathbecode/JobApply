const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');


const { requireAuth, checkUser } = require('./middleware/authMiddleware');
const authRoutes = require('./routes/authroutes');
const authController = require('./controllers/authController');
const User = require('./models/User');


// Initialize express app
const app = express();

// Cloudinary configuration
cloudinary.config({
  cloud_name: 'dxfqlb1gs',
  api_key: '455822296725549',
  api_secret: '1rgw5ghXD3a_V8kTa9F3KUJRIpM'
});

// Set up Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads', // Folder name in Cloudinary
    format: async (req, file) => 'png', // Format you want to save the file in
    public_id: (req, file) => file.fieldname + '-' + Date.now(),
  },
});

// Multer middleware for file uploads
const upload = multer({ storage: storage });

// Middleware setup
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/auth', authRoutes);

// View engine setup
app.set('view engine', 'ejs');

// Route protection middleware
app.get('*', checkUser);

// MongoDB connection
const dbURI = "mongodb+srv://natha:56515651mimiMI@cluster0.uwbp62c.mongodb.net/node-auth";
mongoose.connect(dbURI)
  .then(() => {
    app.listen(3000, () => {
      console.log('Server running on port 3000');
      console.log('Connected to DB');
    });
  })
  .catch((err) => console.log(err));

// Routes
app.get("/", requireAuth, (req, res) => {
  res.render('login', { user: res.locals.user, err: '' });
});

app.get('/login', (req, res) => {
  res.render('login', { err: '' });
});

app.get("/dashboard", requireAuth, authController.dashboard_jobs);
app.get("/dashboard/filter" , requireAuth, authController.filterJobs);

app.get("/profile", requireAuth, (req, res) => {
  res.render('profile', { user: req.user, alert: '' });
});

app.get("/register", (req, res) => {
  res.render('register', { alert: '' });
});

app.get("/createjob", (req, res) => {
  res.render('createjob', { alert: '' });
});

app.get('/log-out', authController.logout_get);

app.post('/register', upload.fields([{ name: 'picture' }, { name: 'cv' }]), authController.checkPassword, authController.signup_post);

app.post('/upload', upload.fields([{ name: 'picture' }, { name: 'cv' }]), (req, res) => {
  const pictureUrl = req.files['picture'] ? req.files['picture'][0].path : null;
  const cvUrl = req.files['cv'] ? req.files['cv'][0].path : null;

  res.send({
    message: 'Files uploaded successfully!',
    pictureUrl: pictureUrl,
    cvUrl: cvUrl,
  });
});

app.post('/profile/upload', requireAuth, upload.single('cv'), async (req, res) => {
  try {
    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).render('profile', { user: res.locals.user, alert: 'No file uploaded' });
    }

    const cvUrl = req.file.path; 
    const userId = req.user._id; 

    console.log(userId);

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).render('profile', { user: res.locals.user, alert: 'User not found' });
    }

    // Update the user's CV URL
    user.cv = cvUrl;
    console.log(user.cv)
    await user.save();

    // Render the profile page with updated user information
    res.status(201).render('profile', { user, alert: 'CV uploaded successfully!' });

  } catch (err) {
    console.error('Error uploading CV:', err);
    res.status(500).render('profile', { user: res.locals.user, alert: 'Error uploading CV' });
  }
});



app.post('/login', authController.login_post);

app.post('/createjob', requireAuth, authController.create_job);

app.post('/change-password', requireAuth, authController.changePassword);

app.get("/info/:jobId", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).render('login',{ err: 'User not found' });
    }

    const job = user.jobs.id(req.params.jobId);

    if (!job) {
      return res.status(404).render('dashboard',{ alert: 'Job not found' });
    }

    res.render('info', { user: res.locals.user, job, alert: '' });
  } catch (error) {
    console.error('Error fetching job info:', error);
    res.status(500).render('dashboard',{ alert: 'Failed to load job info' });
  }
});

app.post('/update-job/:jobId', requireAuth, authController.updateJob );


