const Group = require('../models/groupModels');
const User = require('../models/userModels');
const CatchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// 1. Create a new group
exports.createGroup = CatchAsync(async (req, res, next) => {
  const { name } = req.body;

  const group = await Group.create({ name });

  res.status(201).json({
    status: 'success',
    message: 'Group created',
    data: group
  });
});

// 2. Delete a group and remove groupId from users
exports.deleteGroup = CatchAsync(async (req, res, next) => {
  const { id } = req.params;

  const group = await Group.findByIdAndDelete(id);
  if (!group) return next(new AppError('Group not found', 404));

  const u = await User.updateMany(
    { groupId: id },
    { $set: { groupId: null, group: '' } }
  );
  console.log(id)
  console.log(u);
  res.status(200).json({
    status: 'success',
    message: 'Group deleted and groupId removed from users'
  });
});

// 3. Add user to group (update user's groupId)
exports.addUserToGroup = CatchAsync(async (req, res, next) => {
  const { groupId, userId } = req.body;

  const group = await Group.findById(groupId);
  const user = await User.findById(userId);
  if (!group) return next(new AppError('Group not found', 404));
  if (!user) return next(new AppError('User not found', 404));

  user.groupId = groupId;
  await User.findByIdAndUpdate(userId, { groupId });

  res.status(200).json({
    status: 'success',
    message: 'User assigned to group',
    data: user
  });
});

// 4. Get all group names
exports.getAllGroupNames = CatchAsync(async (req, res, next) => {
  const groups = await Group.find({}, 'name');
  res.status(200).json({
    status: 'success',
    data: groups
  });
});

// 5. Get all users in a group
exports.getUsersInGroup = CatchAsync(async (req, res, next) => {
  const { groupId } = req.params;

  const group = await Group.findById(groupId);
  if (!group) return next(new AppError('Group not found', 404));

  const users = await User.find({ groupId }, 'name email');

  res.status(200).json({
    status: 'success',
    data: users
  });
});

// 6. Get group name from a user
exports.getGroupOfUser = CatchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findById(userId).populate('groupId', 'name');
  if (!user) return next(new AppError('User not found', 404));

  res.status(200).json({
    status: 'success',
    data: user.groupId
  });
});

exports.removeUserFromGroup = CatchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findByIdAndUpdate(
    userId,
    { groupId: null },
    { new: true } // return the updated document
  );

  if (!user) return next(new AppError('User not found', 404));

  res.status(200).json({
    status: 'success',
    message: 'User removed from group',
    data: {
      userId: user._id
    }
  });
});
