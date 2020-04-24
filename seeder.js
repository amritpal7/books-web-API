const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');


// load env vars
dotenv.config({ path: './config/config.env' });

// Load models
const Book = require('./models/Book');
const Contributor = require('./models/Contributor');
const User = require("./models/User");
const Review = require("./models/Review");

//Connect to DB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
});

// Read JSON files
const books = JSON.parse(fs.readFileSync(`${__dirname}/book.json`, 'utf-8'));
const contributors = JSON.parse(fs.readFileSync(`${__dirname}/contributors.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf-8"));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, "utf-8"));

// Import into DB
const importData = async () => {
    try {
        await Book.create(books);
        await Contributor.create(contributors);
        await User.create(users);
        await Review.create(reviews);
        console.log("Data imported...");
        process.exit();      
    } catch (err) {
        console.log(err);   
    }
}

// Delete Data
const deleteData = async () => {
    try {
        await Book.deleteMany();
        await Contributor.deleteMany();
         await User.deleteMany();
         await Review.deleteMany();
        console.log("Data destroyed...");
        process.exit();
    } catch (err) {
        console.log(err);
    }
}

if(process.argv[2] === '-i'){
    importData();
}else if(process.argv[2] === '-d'){
    deleteData();
}