const Debt = require('./../models/debtModels');
// const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const User = require('./../models/userModels');

const findIdByName = async name => {
  const fund = await User.findOne({ name });
  if (!fund) {
    throw new Error(`No document found with the name: ${name}`);
  }
  return fund._id; // Assuming `_id` is the ID field in your Mutual Funds model
};

exports.convertNameToId = catchAsync(async (req, res, next) => {
  console.log(req.body);

  // Destructure variables from the request body
  const { holderId, nominee1Id, nominee2Id, nominee3Id } = req.body;

  // Convert holder name to ID if not already an ID
  // if (holderId && holderId.trim() !== '') {
  //   req.body.holderId = await findIdByName(holderId);
  // }

  // Process nominees, removing them if their value is empty
  if (!nominee1Id || nominee1Id.trim() === '') {
    delete req.body.nominee1Id; // Remove nominee1Id if it's empty
  } 
  // else {
  //   req.body.nominee1Id = await findIdByName(nominee1Id);
  // }

  if (!nominee2Id || nominee2Id.trim() === '') {
    delete req.body.nominee2Id; // Remove nominee2Id if it's empty
  } 
  // else {
  //   req.body.nominee2Id = await findIdByName(nominee2Id);
  // }

  if (!nominee3Id || nominee3Id.trim() === '') {
    delete req.body.nominee3Id; // Remove nominee3Id if it's empty
  } 
  // else {
  //   req.body.nominee3Id = await findIdByName(nominee3Id);
  // }

  next(); // Move to the next middleware or route handler
});

exports.getDebtByUser = catchAsync(async (req, res, next) => {
    const userId = req.params.id;
  
    const Debts = await Debt.find({ holderId: userId });
  
    if (!Debts.length) {
      return res.status(404).json({
        status: 'fail',
        message: 'No mutual funds found for the specified user.'
      });
    }
  
    res.status(200).json({
      status: 'success',
      results: Debts.length,
      data: {
        Debts
      }
    });
  });

exports.getAllLifePolicy = factory.getAll(Debt);
exports.getLifePolicy = factory.getOne(Debt, {
  path: 'holderId nominee1Id nominee2Id nominee3Id'
});
exports.updateLifePolicy = factory.updateOne(Debt);
exports.deleteLifePolicy = factory.deleteOne(Debt);
exports.createLifePolicy = factory.createOne(Debt);
