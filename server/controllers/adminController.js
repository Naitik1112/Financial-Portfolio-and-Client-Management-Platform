const multer = require('multer');
const sharp = require('sharp');
const Admin = require('./../models/adminModels');
const User = require('./../models/userModels');
const AppError = require('./../utils/appError');
const CatchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadAdminPhoto = upload.single('photo');

exports.resizeAdminPhoto = CatchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `admin-${req.admin.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/admins/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getme = (req, res, next) => {
  req.params.id = req.admin.id;
  next();
};

exports.updateMe = CatchAsync(async (req, res, next) => {
  // 1) Create error if admin POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'adminName', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  // 3) Update admin document
  const updatedAdmin = await Admin.findByIdAndUpdate(
    req.admin.id,
    filteredBody,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    status: 'success',
    data: {
      admin: updatedAdmin
    }
  });
});

exports.deleteMe = CatchAsync(async (req, res, next) => {
  await Admin.findByIdAndUpdate(req.admin.id, { active: false });

  res.status(200).json({
    status: 'success',
    data: null
  });
});

exports.getAllAdmins = CatchAsync(async (req, res, next) => {
  const admins = await Admin.find().populate('adminName');

  res.status(200).json({
    status: 'success',
    results: admins.length,
    data: admins
  });
});

exports.updateMyPassword = CatchAsync(async (req, res, next) => {
  // 1) Create error if admin POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'adminName', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  // 3) Update admin document
  const updatedAdmin = await Admin.findByIdAndUpdate(
    req.admin.id,
    filteredBody,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    status: 'success',
    data: {
      admin: updatedAdmin
    }
  });
});

exports.getAdmin = CatchAsync(async (req, res, next) => {
  const { id } = req.params;

  const admin = await Admin.findById(id);

  if (!admin) return next(new AppError('Admin not found', 404));

  res.status(200).json({
    status: 'success',
    data: admin
  });
});

exports.createAdmin = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use signup instead'
  });
};

exports.getNumberOfClient = CatchAsync(async (req, res, next) => {
  const numberOfClients = await Admin.countDocuments();

  res.status(200).json({
    status: 'success',
    data: {
      numberOfClients
    }
  });
});

exports.getRecentClients = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10; // default to 10

    const recentClients = await Admin.find({
      role: { $in: ['admin', 'admin'] }
    })
      .sort({ createdAt: -1 }) // newest first
      .limit(limit)
      .select('adminName email createdAt'); // You can add more fields as needed

    res.status(200).json({
      status: 'success',
      results: recentClients.length,
      data: {
        recentClients
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

exports.getUserOfAdmin = async (req, res) => {
  try {
    const adminId = req.admin.id;

    const users = await User.find({ adminId });

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
      error: err.message
    });
  }
};

exports.updateAdmin = factory.updateOne(Admin);
exports.deleteAdmin = factory.deleteOne(Admin);

exports.createOne = factory.createOne(Admin);
