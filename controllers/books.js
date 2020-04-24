const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Book = require('../models/Book');
const  Contributor = require('../models/Contributor');

// @desc      Get Books
// @route     GET /api/v1/books
// @route     GET /api/v1/contributor/:contributorId/books
// @access    Public
exports.getBooks = asyncHandler(async (req, res, next) => {

    if (req.params.contributorId) {
     const books = await Book.find({ contributor: req.params.contributorId });
     return res.status(200).json({
      success: true,
      count: books.length,
      data: books
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc      Get single book
// @route     GET /api/v1/books/:id
// @access    Public
exports.getBook = asyncHandler(async (req, res, next) => {
    const book = await Book.findById(req.params.id).populate({
        path: 'contributor',
        select: 'name email phone'
    });

    if (!book) {
        return next(
            new ErrorResponse(`No book with the id of ${req.params.id}`),
            404
        );
    }

    res.status(200).json({
        success: true,
        data: book
    });
});

// @desc      Add book
// @route     POST /api/v1/contributor/:contributorId/books
// @access    Private
exports.addBook = asyncHandler(async (req, res, next) => {
    req.body.contributor = req.params.contributorId;
    req.body.user = req.user.id;

    const contributor = await Contributor.findById(req.params.contributorId);

    if (!contributor) {
        return next(
            new ErrorResponse(`No contributor with the id of ${req.params.contributorId}`),
            404
        );
    }

    // Make sure user is a contributor
    if (contributor.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(
            new ErrorResponse(
                `User ${req.user.id} is not authorized to add a book ${contributor._id}`,
                401
            )
        );
    }

    const book = await Book.create(req.body);

    res.status(200).json({
        success: true,
        data: book
    });
});


// @desc      Update book's record
// @route     PUT /api/v1/courses/:id
// @access    Private
exports.updateBook = asyncHandler(async (req, res, next) => {
    let book = await Book.findById(req.params.id);

    if (!book) {
        return next(
            new ErrorResponse(`No book with the id of ${req.params.id}`),
            404
        );
    }

    // Make sure user is book owner
    if (book.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(
            new ErrorResponse(
                `User ${req.user.id} is not authorized to update book ${book._id}`,
                401
            )
        );
    }

    book = await Book.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: book
    });
});

// // @desc      Delete book
// // @route     DELETE /api/v1/book/:id
// // @access    Private
exports.deleteBook = asyncHandler(async (req, res, next) => {
    const book = await Book.findById(req.params.id);

    if (!book) {
        return next(
            new ErrorResponse(`No book with the id of ${req.params.id}`),
            404
        );
    }

    // Make sure user is book owner
    if (book.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(
            new ErrorResponse(
                `User ${req.user.id} is not authorized to delete book ${book._id}`,
                401
            )
        );
    }

    await book.remove();

    res.status(200).json({
        success: true,
        data: {}
    });
});
