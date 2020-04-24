const express = require('express');
const {
  getBooks,
  getBook,
  addBook,
  updateBook,
  deleteBook
} = require('../controllers/books');

const Book = require('../models/Book');
const router = express.Router({ mergeParams: true });

const advancedResults = require('../middleware/advancedResults');

const { protect, authorize } = require('../middleware/auth');

router
  .route("/")
  .get(
    advancedResults(Book, {
      path: "contributor",
      select: "name email",
    }),
    getBooks
  )
  .post(protect, authorize("contributor", "admin"), addBook);

router
  .route("/:id")
  .get(getBook)
  .put(protect, authorize("contributor", "admin"), updateBook)
  .delete(protect, authorize("contributor", "admin"), deleteBook);

module.exports = router;
