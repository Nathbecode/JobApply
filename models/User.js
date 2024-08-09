const mongoose = require('mongoose');
const { isEmail } = require('validator');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const jobSchema = new Schema({
    jobtitle: {
        type: String,
        required: [true, 'Please enter a jobtitle'],
    },
    website: {
        type: String,
        default: ''
    },
    companyname: {
        type: String,
        required: [true, 'Please enter the company name'],
    },
    emailcompany: {
        type:String,
        validate: [isEmail, 'Please enter a valid email'],
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    origin: {
        type: String,
        enum: ['Candidature', 'Job offer'], 
        required: true
    },
    status: {
        type: String,
        enum: ['Interested', 'CV-sent', 'Negative', 'Interview'], 
        required: true
    },
    comments: {
        type: String,
        default: ''
    }
}, { timestamps: true })

const userSchema = new Schema({
    firstname: {
        type: String,
        required: true,
    },
    lastname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: [true, 'Please enter an email'],
        unique: true,
        lowercase: true,
        validate: [isEmail , 'Please enter a valid email']
    },
    github: {
        type: String,
        unique: true,
    },
    picture: {
        type: String,
        required: false,
        default: ''
    },
    cv: {
        type: String,
        required:false,
        default: ''
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minlength:[8, 'Minimum 8 characters']
    },
    jobs: [jobSchema]
});


//fire a functionafter doc saved to db
userSchema.post('save', function(doc, next) {
    console.log('new user: ', doc.firstname);
    next();
})

//fire a function before doc saved to db
userSchema.pre('save', async function(next) {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt)
    next();
})

//static method to login user
userSchema.statics.login = async function(email, password) {
    const user = await this.findOne({email});
    if(user) {
        console.log(`Static : Login attempt for email: ${email}`);
        const auth = await bcrypt.compare(password, user.password);
        console.log(`Password match result: ${auth}`);
        if(auth) {
            return user;
        }
        throw Error ('incorrect password');
    }
    throw Error('incorrect email')
}

const User = mongoose.model('User', userSchema);
module.exports = User;

