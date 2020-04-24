const path = require("path");
const ErrorResponse = require("../utils/errorResponse");
const geocoder = require("../utils/geocoder");
const asyncHandler = require("../middleware/async");
const Contributor = require("../models/Contributor");

exports.getAllContributors = asyncHandler(async (req, res, next) => {
  res.status(200).json( res.advancedResults );
});

exports.getSingleContributor = asyncHandler(async (req, res, next) => {
  const contributor = await Contributor.findById(req.params.id);
  if (!contributor) {
    return next(
      new ErrorResponse(
        `contributor doesn't exist with id of ${req.params.id}`,
        404
      )
    );
  }
  res.status(200).json({ success: true, data: contributor });
});

exports.postContributor = asyncHandler(async (req, res, next) => {

  // Add user to req,body
  req.body.user = req.user.id;

  // Check for registered contributor
  const registeredContributor = await Contributor.findOne({ user: req.user.id });

  // If the user is not an admin, they can only add one contributor
  if (registeredContributor && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `The user with ID ${req.user.id} is already a member of contributors community.`,
        400
      )
    );
  }

  const contributor = await Contributor.create(req.body);
  res.status(201).json({ success: true, data: contributor });
});

exports.updateContributor = asyncHandler(async (req, res, next) => {
  let contributor = await Contributor.findById(req.params.id);

  if (!contributor) {
    return next(
      new ErrorResponse(`contributor doesn't exist with id of ${req.params.id}`, 404)
    );
  }
  // Make sure user is account's owner
  if (contributor.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.params.id} is not authorized to update other's contributor's details.`,
        401
      )
    );
  }
  contributor = await Contributor.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })
  res.status(200).json({ success: true, data: contributor });
});

exports.deleteContributor = asyncHandler(async (req, res, next) => {
  const contributor = await Contributor.findById(req.params.id);
  if (!contributor) {
    return next(
      new ErrorResponse(`contributor doesn't exist with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is accounts owner
  if (contributor.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.params.id} is not authorized to delete other's contributor's details.`,
        401
      )
    );
  }
  contributor.remove();

  res.status(200).json({ success: true, data: {} });
});

// Get all contributors within the radius

// @route      GET /api/v1/contributors/radius/:zipcode/:distance
exports.getAllContributorsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

//calculate the radius by dividing..
// distance with earth's radius.
  const radius = distance/ 6378;

  const contributors = await Contributor.find({
    location:{ $geoWithin: { $centerSphere: [ [ lng, lat ], radius ] } }
  });
  res.status(200).json({
    success: true,
    count: contributors.length,
    data: contributors
  });
});


// @desc      Upload photo for contributor
// @route     PUT /api/v1/contributors/:id/photo
// @access    Private
exports.contributorPhotoUpload = asyncHandler(async (req, res, next) => {
  const contributor = await Contributor.findById(req.params.id);

  if (!contributor) {
    return next(
      new ErrorResponse(
        `Contributor not found with id of ${req.params.id}`,
        404
      )
    );
  }

  // Make sure user is contributor owner
  // if (
  //   contributor.user.toString() !== req.user.id &&
  //   req.user.role !== "admin"
  // ) {
  //   return next(
  //     new ErrorResponse(
  //       `User ${req.params.id} is not authorized to update this.`,
  //       401
  //     )
  //   );
  // }

  if (!req.files) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }

  const file = req.files.file;

  // Make sure the image is a photo
  if (!file.mimetype.startsWith("image")) {
    return next(new ErrorResponse(`Please upload an image file`, 400));
  }

  // // Check filesize
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
        400
      )
    );
  }

  // Create custom filename
  file.name = `photo_${contributor._id}${path.parse(file.name).ext}`;
  console.log(file.name);


  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }

    await Contributor.findByIdAndUpdate(req.params.id, { photo: file.name });

    res.status(200).json({
      success: true,
      data: file.name,
    });
  });
});
