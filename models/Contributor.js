const mongoose = require('mongoose');
const geocoder = require('../utils/geocoder');
const slugify = require('slugify');

const contributorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter your name."],
        maxlength: [50, "Name should not proceed 50 characters."],
        trim: true
    },
    slug: String,
    email: {
        type: String,
        required: [true, "Email is required."],
        unique: true,
        match: [
            /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "please enter a valid email ID"
            ]
    },
    website: {
        type: String,
        required: false,
        match: [
            /(http(s)?:\/\/.)?(www.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/,
            "please enter valid URL or http(s) address"
        ]
    },
    phone: {
        type: Number,
        required: [true, "Phone number is reqiured."],
        unique: true,
        maxlength: [20, "length exceeds the normal phone number."]
    },
    address: {
        type: String,
        required: [true, "Address is required."]
    },
    city:{
        type: String,
        required:[true, "Enter city"]
    },
    state:{
        type:String,
        required: [true,"Enter state here."]
    },
    zipcode:{
        type: Number,
        required:[true, "zipcode is required."]
    },
    location: {
        // GeoJSON Point
        type: { String, enum: ["Point"], required: true },
        coordinates: {
        type: [Number],
        required: true,
        index: "2dsphere"
        },
        formattedAddress: String,
        street: String,
        city: String,
        state: String,
        zipcode: String,
        country: String
    },
    averageCost: Number,
    photo:{
        type: String,
        default: 'no-photo.jpg'
    },
    created_at:{
        type: Date,
        default: Date.now
    },
    user:{
        type: mongoose.Schema.ObjectId,
        ref: 'Contributor',
        required: true
    }
    },
    {
        toJSON:{ virtuals: true },
        toObject: { virtuals: true  }
    }
);


// Create a contributors name slug 
contributorSchema.pre('save', function(next) {
    this.slug = slugify(this.name, { lower: true});
    next();
});

//Geocode and create location field
contributorSchema.pre('save', async function(next) {
    const loc = await geocoder.geocode(this.address);
    this.location = {
        type: 'Point',
        coordinates: [loc[0].longitude, loc[0].latitude],
        formattedAddress: loc[0].formattedAddress,
        street: loc[0].streetName,
        city: loc[0].city,
        state: loc[0].stateCode,
        zipcode: loc[0].zipcode,
        country: loc[0].countryCode
    }

    // don't save address to database
    this.address = undefined;
    next();
});

// Cascade delete books when a contributor is deleted
contributorSchema.pre('remove', async function (next) {
    console.log(`books being removed from contributors ${this._id}`);
    await this.model('Book').deleteMany({ contributor: this._id });
    next();
}); 

// Reverse populate with virtuals
contributorSchema.virtual('books', {
    ref: 'Book',
    localField: '_id',
    foreignField: 'contributor',
    justOne: false
});

    module.exports = mongoose.model("Contributor", contributorSchema);