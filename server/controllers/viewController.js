// const Tour = require('../models/tourModel');
// const User = require('../models/userModels');
// const Booking = require('../models/bookingModels');
// const Review = require('../models/reviewModels');
// const CatchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');

// exports.getOverview = CatchAsync(async (req, res) => {
//   const tours = await Tour.find();
//   res.status(200).render('overview', {
//     title: 'All Tours',
//     tours
//   });
// });

// exports.getTour = CatchAsync(async (req, res, next) => {
//   // 1) Get the data, for the requested tour (including reviews and guides)
//   const tour = await Tour.findOne({ slug: req.params.slug }).populate({
//     path: 'reviews',
//     fields: 'review rating user'
//   });

//   if (!tour) {
//     return next(new AppError('There is no tour with that name.', 404));
//   }

//   // 2) Build template
//   // 3) Render template using data from 1)

//   res.status(200).render('tour', {
//     title: `${tour.name} Tour`,
//     tour,
//     TourBooked: req.TourBooked
//   });
// });

// exports.getLoginForm = (req, res) => {
//   res.status(200).render('login', {
//     title: 'Log into your account'
//   });
// };

// exports.getSignupForm = (req, res) => {
//   res.status(200).render('signup', {
//     title: 'Create your account'
//   });
// };

// exports.getForgotPasswordForm = (req, res) => {
//   res.status(200).render('forgotPassword', {
//     title: 'Enter your registred Email Address'
//   });
// };

// exports.getResetPasswordForm = (req, res) => {
//   res.status(200).render('resetPassword', {
//     title: 'Reset your Password here !!'
//   });
// };

// exports.getAccount = (req, res) => {
//   res.status(200).render('account', {
//     title: 'Your account',
//     user: req.user
//   });
// };

// exports.getReviews = async (req, res) => {
//   const userId = req.user.id;

//   // Fetch reviews written by the user
//   const userReviews = await Review.find({ user: userId });

//   // Extract tour IDs from reviews
//   const tourIds = userReviews.map(review => review.tour);

//   // Fetch details of tours related to the reviews
//   const tourDetails = await Tour.find({ _id: { $in: tourIds } }).select(
//     'name duration price slug imageCover'
//   );

//   // Combine reviews with their corresponding tour details
//   const reviewsWithTours = userReviews.map(review => {
//     const tour = tourDetails.find(
//       tourDetail => tourDetail._id.toString() === review.tour.toString()
//     );
//     return { ...review._doc, tour }; // Spread `review` fields and add `tour`
//   });

//   // Pass combined reviews and user details to the view
//   res.status(200).render('reviews', {
//     title: 'Your Reviews',
//     reviews: reviewsWithTours, // Unified array of reviews with tours
//     user: req.user // Authenticated user details
//   });
// };

// exports.getMyTours = CatchAsync(async (req, res, next) => {
//   // 1) Find all bookings
//   const bookings = await Booking.find({ user: req.user.id });

//   // 2) Find tours with the returned IDs
//   const tourIDs = bookings.map(el => el.tour);
//   const tours = await Tour.find({ _id: { $in: tourIDs } });
//   res.status(200).render('overview', {
//     title: 'My Tours',
//     tours,
//     user: req.user
//   });
// });

// exports.updateUserData = CatchAsync(async (req, res, next) => {
//   const updatedUser = await User.findByIdAndUpdate(
//     req.user.id,
//     {
//       name: req.body.name,
//       email: req.body.email
//     },
//     {
//       new: true,
//       runValidators: true
//     }
//   );
//   res.status(200).render('account', {
//     title: 'Your account',
//     user: updatedUser
//   });
// });
