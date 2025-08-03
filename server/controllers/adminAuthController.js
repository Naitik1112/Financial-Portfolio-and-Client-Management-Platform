const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const Admin = require('./../models/adminModels');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const Email = require('./../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES
  });
};

const createSendToken = (admin, statusCode, res) => {
  const token = signToken(admin._id);
  // console.log(token);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: false,
    sameSite: 'Lax', // Change 'None' to 'Lax'
    secure: false // False for HTTP (localhost)
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true; // Secure in production (HTTPS)
  } else {
    cookieOptions.secure = false; // Allow in localhost (HTTP)
  }

  // console.log(process.env.NODE_ENV);
  // console.log(cookieOptions);
  res.cookie('jwt', token, cookieOptions);
  // console.log('Cookies Set:', res.getHeaders()['set-cookie']);
  // Remove password from output
  admin.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newAdmin = await Admin.create({
    companyName: req.body.companyName,
    adminName: req.body.adminName,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  // const url = `${req.protocol}://${req.get('host')}/me`;
  // await new Email(newAdmin, url).sendWelcome();
  createSendToken(newAdmin, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const admin = await Admin.findOne({ email }).select('+password');
  console.log(req.body);
  if (!admin || !(await admin.correctPassword(password, admin.password))) {
    return next(new AppError('Either email or Password is incorrect', 400));
  }

  createSendToken(admin, 200, res);
});

exports.logout = (req, res) => {
  // console.log(req.cookies.jwt);
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // console.log('Headers:', req.headers); // Debug request headers
  // console.log('Cookies:', req.cookies); // Debug request cookies

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.split(' ')[0] === 'Bearer'
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  // console.log('Token Found:', token); // Debug token value

  if (!token) {
    return next(
      new AppError('You are not logged in, Please login to get access', 400)
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentAdmin = await Admin.findById(decoded.id);
  if (!currentAdmin) {
    return next(
      new AppError('The Admin belonging to this token no longer exists', 401)
    );
  }

  if (currentAdmin.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('Admin recently changed password! Please log-in', 401)
    );
  }

  req.admin = currentAdmin;
  next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if admin still exists
      const currentAdmin = await Admin.findById(decoded.id);
      if (!currentAdmin) {
        return next();
      }

      // 3) Check if admin changed password after the token was issued
      if (currentAdmin.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.admin = currentAdmin;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // console.log(req.admin);
    if (!roles.includes(req.admin.role)) {
      return next(
        new AppError('You do not have permission to access this route', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get admin based on POSTed email
  const admin = await Admin.findOne({ email: req.body.email });
  if (!admin) {
    return next(new AppError('There is no admin with email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = admin.createPasswordResetToken();
  await admin.save({ validateBeforeSave: false });

  // 3) Send it to admin's email

  // const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/resetPassword/${resetToken}`;
    await new Email(admin, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    admin.passwordResetToken = undefined;
    admin.passwordResetExpires = undefined;
    await admin.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get admin based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const admin = await Admin.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2) If token has not expired, and there is admin, set the new password
  if (!admin) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  admin.password = req.body.password;
  admin.passwordConfirm = req.body.passwordConfirm;
  admin.passwordResetToken = undefined;
  admin.passwordResetExpires = undefined;
  await admin.save();

  // 3) Update changedPasswordAt property for the admin
  // 4) Log the admin in, send JWT
  createSendToken(admin, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const admin = await Admin.findById(req.admin.id).select('+password');
  if (
    !(await admin.correctPassword(req.body.passwordCurrent, admin.password))
  ) {
    return next(new AppError('Password is incorrect', 400));
  }
  admin.password = req.body.password;
  admin.passwordConfirm = req.body.passwordConfirm;
  await admin.save();
  createSendToken(admin, 200, res);
});
