// const Review = require('./../models/reviewModels');
// const factory = require('./handlerFactory');
// const Tour = require('./../models/tourModel');
// const CatchAsync = require('./../utils/catchAsync');

// exports.getAllReviews = factory.getAll(Review);

// exports.setTourUserIds = async (req, res, next) => {
//   const tour = await Tour.findOne({ slug: req.params.slug });
//   if (!tour) {
//     // If no tour is found, send a response or handle the error
//     return res.status(404).send('Tour not found');
//   }
//   if (!req.body.tour) req.body.tour = tour._id;
//   if (!req.body.user) req.body.user = req.user.id;

//   next();
// };

// exports.user = CatchAsync(async (req, res) => {
//   const userId = req.user.id;
//   const userReviews = await Review.find({ user: userId });

//   req.reviews = userReviews;

//   res.status(200).json({
//     status: 'success',
//     results: userReviews.length,
//     reviews: {
//       reviews: req.reviews
//     }
//   });
// });

// exports.createReview = factory.createOne(Review);

// exports.getReview = factory.getOne(Review);

// exports.updateReview = factory.updateOne(Review);

// exports.deleteReview = factory.deleteOne(Review);
