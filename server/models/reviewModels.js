// const mongoose = require('mongoose');
// // const User = require('./userModels');
// const Tour = require('./tourModel');

// const reviewSchma = new mongoose.Schema(
//   {
//     review: {
//       type: String,
//       required: [true, 'This Field cannot remain empty'],
//       trim: true
//     },
//     rating: {
//       type: Number,
//       min: 1,
//       max: 5
//     },
//     createdAt: {
//       type: Date,
//       default: Date.now()
//     },
//     tour: [
//       {
//         type: mongoose.Schema.ObjectId,
//         ref: 'Tour',
//         required: [true, 'Review must belong to tour']
//       }
//     ],
//     user: {
//       type: mongoose.Schema.ObjectId,
//       ref: 'User',
//       required: [true, 'Review must belong to a user']
//     }
//   },
//   {
//     toJSON: { virtuals: true },
//     toObject: { virtuals: true }
//   }
// );

// reviewSchma.index({ tour: 1, user: 1 }, { unique: true });

// reviewSchma.statics.calcAverageRatings = async function(tourId) {
//   const stats = await this.aggregate([
//     {
//       $match: { tour: tourId }
//     },
//     {
//       $group: {
//         _id: '$tour',
//         nRating: { $sum: 1 },
//         avgRating: { $avg: '$rating' }
//       }
//     }
//   ]);
//   // console.log(stats);

//   if (stats.length > 0) {
//     await Tour.findByIdAndUpdate(tourId, {
//       ratingsQuantity: stats[0].nRating,
//       ratingsAverage: stats[0].avgRating
//     });
//   } else {
//     await Tour.findByIdAndUpdate(tourId, {
//       ratingsQuantity: 0,
//       ratingsAverage: 4.5
//     });
//   }
// };

// reviewSchma.post('save', function() {
//   // this points to current review
//   this.constructor.calcAverageRatings(this.tour);
// });

// reviewSchma.pre(/^find/, function(next) {
//   // this.populate({
//   //   path: 'tour',
//   //   select: 'name'
//   // }).populate({
//   //   path: 'user',
//   //   select: 'name photo'
//   // });

//   this.populate({
//     path: 'user',
//     select: 'name photo'
//   });
//   next();
// });

// reviewSchma.pre(/^findOneAnd/, async function(next) {
//   this.r = await this.findOne();
//   // console.log(this.r);
//   next();
// });

// reviewSchma.post(/^findOneAnd/, async function() {
//   // await this.findOne(); does NOT work here, query has already executed
//   await this.r.constructor.calcAverageRatings(this.r.tour);
// });

// const Review = mongoose.model('Review', reviewSchma);

// module.exports = Review;
