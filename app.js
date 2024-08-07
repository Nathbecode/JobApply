const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const { requireAuth } = require('./middleware/authMiddleware');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended : true}));
app.use(express.static("public"));
app.use(cookieParser());

// Connect DB
mongoose.connect('mongodb://localhost:27017/jobApplyDB')
  .then(() => {
    app.listen(port, () => {
      console.log(`App listening at http://localhost:${port}`);
    });
  })
  .catch((err) => console.log(err));

// Routes
const authRoute = require('./routes/authRoutes');
const createjobRoute = require('./routes/createjobRoutes');
const profileRoute = require('./routes/profileRoutes');
const dashboardRoute = require('./routes/dashboardRoutes');

app.use('/', authRoute);
app.use('/create-job', createjobRoute);
app.use('/profile', profileRoute);
app.use('/dashboard', dashboardRoute);

// Redirect '/' to '/dashboard' if logged in
app.get('/', requireAuth, (req, res) => {
    res.redirect('/dashboard');
})
