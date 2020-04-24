const express = require("express");
const {
  getAllContributors,
  getSingleContributor,
  updateContributor,
  postContributor,
  deleteContributor,
  getAllContributorsInRadius,
  contributorPhotoUpload
} = require("../controllers/contributors");

const Contributor = require('../models/Contributor');
const advancedResults = require('../middleware/advancedResults');

// Include other resource routers
const bookRouter = require('./books');
const reviewRouter = require('./reviews');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Re-route into other resource routers
router.use("/:contributorId/books", bookRouter);
router.use("/:contributorId/reviews", reviewRouter);

router
  .route("/radius/:zipcode/:distance")
  .get(protect, authorize("contributor", "admin"), getAllContributorsInRadius);

router
  .route("/")
  .get(advancedResults(Contributor, 'books'), getAllContributors)
  .post(protect, authorize("user", "admin"), postContributor);

router
  .route("/:id/photo")
  .put(protect, authorize("contributor", "admin"), contributorPhotoUpload); 

router
  .route("/:id")
  .get(getSingleContributor)
  .put(protect, authorize("contributor", "admin"), updateContributor)
  .delete(protect, authorize("contributor", "admin"), deleteContributor);

module.exports = router;
