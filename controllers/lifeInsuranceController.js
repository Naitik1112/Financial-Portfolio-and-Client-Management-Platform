const Life = require('./../models/lifeInsuranceModel');
// const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const User = require('./../models/userModels');

const findIdByName = async name => {
  const user = await User.findOne({ name }); // Find user by name
  if (!user) {
    throw new Error(`No user found with the name: ${name}`);
  }
  return user._id; // Return ObjectId
};

exports.convertNameToId = catchAsync(async (req, res, next) => {
  const { clientId, nominee1ID, nominee2ID, nominee3ID } = req.body;
  // Convert names to ObjectIds
  if (clientId && clientId.trim() !== '') {
    req.body.clientId = await findIdByName(clientId);
  }

  if (nominee1ID && nominee1ID.trim() !== '') {
    req.body.nominee1ID = await findIdByName(nominee1ID);
  } else {
    delete req.body.nominee1ID;
  }

  if (nominee2ID && nominee2ID.trim() !== '') {
    req.body.nominee2ID = await findIdByName(nominee2ID);
  } else {
    delete req.body.nominee2ID;
  }

  if (nominee3ID && nominee3ID.trim() !== '') {
    req.body.nominee3ID = await findIdByName(nominee3ID);
  } else {
    delete req.body.nominee3ID;
  }

  next();
});

exports.getLifeInsByUser = catchAsync(async (req, res, next) => {
  const userId = req.params.id;

  const LifeIns = await Life.find({ clientId: userId });

  if (!LifeIns.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'No mutual funds found for the specified user.'
    });
  }

  res.status(200).json({
    status: 'success',
    results: LifeIns.length,
    data: {
      LifeIns
    }
  });
});

exports.getAllLifePolicy = factory.getAll(Life);
exports.getLifePolicy = factory.getOne(Life, {
  path: 'clientId nominee1ID nominee2ID nominee3ID'
});
exports.updateLifePolicy = factory.updateOne(Life);
exports.deleteLifePolicy = factory.deleteOne(Life);
exports.createLifePolicy = factory.createOne(Life);
