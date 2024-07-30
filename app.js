const express = require('express');
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended : true}));
app.use(express.static("public"));

app.get('/createjob', (req, res) => {
    res.render('createjob');
})

app.get('/dashboard', (req,res) => {
    res.render('dashboard');
})

app.get('/login', (req,res) => {
    res.render('login');
})

app.get('/profile', (req,res) => {
    res.render('profile');
})

app.get('/sign-up', (req,res) => {
    res.render('sign-up');
})

app.get('/updatejob', (req,res) => {
    res.render('updatejob');
})

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});