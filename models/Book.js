const mongoose = require('mongoose');
const slugify = require("slugify");
const geocoder = require('../utils/geocoder');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "please add a title"],
    unique: true,
    maxlength: [50, "Name cannot ve more than 50 characters"],
    trim: true
  },
  slug: String,
  description: {
    type: String,
    required: [true, "please add a description."],
    maxlength: [400, "Description cannot be more than 400 characters."]
  },
  authors: {
    type: String,
    required: [true, "Please add authors name."]
  },
  language: {
    type: String,
    required: [true, "Please enter the book language."]
  },
  category: {
    type: [String],
    required: true,
    enum: [
      "Drama,",
      "Engineering",
      "Fable",
      "Crime and Detective",
      "Fantasy",
      "Mystery",
      "Mythology",
      "Science",
      "Romance",
      "Satire",
      "Suspence/Thriller",
      "Comic/Novel",
      "Biography",
      "Poetry",
      "IT"
    ]
  },
  pages: {
    type: Number,
    required: [true, "Please add page numbers."]
  },
  price: {
    type: Number,
    required: [true, "Please add price for a book(in rupees)."],
    min: 0,
    max: 500
  },
  dimensions: {
    type: String,
    required: false
  },
  publisher: {
    type: String,
    required: [true, "Please add a publisher name."]
  },
  published_year: {
    type: Number,
    required: false
  },
  ISBN: {
    type: String,
    required: false,
    unique: true
  },
  average_rating: {
    type: Number,
    min: [1, "minimum rating should be 1,"],
    max: [10, "maximum rating should be 10."]
  },
  photo: {
    type: String,
    default: "no-photo.jpg"
  },
  area: {
    type: String,
    required: [true, "Address is required."]
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
    zipcode: String
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  contributor: {
    type: mongoose.Schema.ObjectId,
    ref: 'Contributor',
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
});

// Static method to get avg of books
bookSchema.statics.getAverageCost = async function (contributorId) {
  const obj = await this.aggregate([
    {
      $match: { contributor: contributorId }
    },
    {
      $group: {
        _id: '$contributor',
        averageCost: { $avg: '$price' }
      }
    }
  ]);

  try {
    await this.model('Contributor').findByIdAndUpdate(contributorId, {
      averageCost: Math.ceil(obj[0].averageCost / 10) * 10
    });
  } catch (err) {
    console.error(err);
  }
  console.log(obj);
};

// Call getAverageCost after save
bookSchema.post('save', function () {
  this.constructor.getAverageCost(this.contributor);
});

// Call getAverageCost before remove
bookSchema.pre('remove', function () {
  this.constructor.getAverageCost(this.contributor);
});

// Create a Book name slug 
bookSchema.pre('save', function(next) {
    this.slug = slugify(this.title, { lower: true});
    next();
});

//Geocode and create location field
bookSchema.pre('save', async function(next) {
    const loc = await geocoder.geocode(this.area);
    this.location = {
        type: 'Point',
        coordinates: [loc[0].longitude, loc[0].latitude],
        formattedAddress: loc[0].formattedAddress,
        street: loc[0].streetName,
        zipcode: loc[0].zipcode
    }

    // don't save address to database
    this.area = undefined;
    next();
});
module.exports = mongoose.model('Book', bookSchema);