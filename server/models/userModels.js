const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const axios = require('axios');

const userSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: false
    },
    name: {
      type: String,
      required: [true, 'A user must have a name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'A user should have an email'],
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email']
    },
    photo: {
      type: String,
      default: 'default.jpg'
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null
    },
    pancard: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user'
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false
    },
    DOB: {
      type: Date,
      required: true
    },
    contact: {
      type: Number
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Confirm the password'],
      validate: {
        validator: function(el) {
          return el === this.password;
        },
        message: 'Passwords are not the same'
      }
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false
    }
  },
  {
    toJSON: { virtuals: true }, // Include virtuals in JSON response
    toObject: { virtuals: true } // Include virtuals when converting to objects
  },
  {
    timestamps: true // <-- this adds createdAt and updatedAt
  }
);

function formatDOB(date_of_birth) {
  if (!date_of_birth) return null;
  let dobObj =
    date_of_birth instanceof Date ? date_of_birth : new Date(date_of_birth);
  const day = String(dobObj.getDate()).padStart(2, '0');
  const month = String(dobObj.getMonth() + 1).padStart(2, '0');
  const year = dobObj.getFullYear();
  return `${day}/${month}/${year}`; // DD/MM/YYYY
}

// Virtual property to calculate age
userSchema.virtual('age').get(function() {
  if (!this.DOB) return null;
  const ageDiff = Date.now() - this.DOB.getTime();
  const ageDate = new Date(ageDiff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Function to get access token
async function getAccessToken() {
  const response = await axios.post(
    `${process.env.SANDBOX_HOST}/authenticate`,
    {},
    {
      headers: {
        'x-api-key': process.env.API_KEY,
        'x-api-secret': process.env.API_SECRET,
        'x-api-version': process.env.API_VERSION
      }
    }
  );
  return response.data.access_token || response.data.data.access_token;
}

// Function to verify PAN
async function verifyPAN({ pan, name, date_of_birth }) {
  const accessToken = await getAccessToken();

  // Convert Date object to DD/MM/YYYY
  console.log('date_of_birth ', date_of_birth);
  const dob = formatDOB(date_of_birth);
  // console.log(accessToken);
  // console.log(dob);
  // console.log(pan);
  // console.log(process.env.API_KEY);
  // console.log(name);
  const response = await axios.post(
    `${process.env.SANDBOX_HOST}/kyc/pan/verify`,
    {
      '@entity': 'in.co.sandbox.kyc.pan_verification.request',
      pan: pan,
      name_as_per_pan: name,
      date_of_birth: dob,
      consent: 'Y',
      reason: 'For onboarding customers'
    },
    {
      headers: {
        Authorization: accessToken,
        'x-api-key': process.env.API_KEY,
        'Content-Type': 'application/json'
      }
    }
  );
  // console.log(response);
  const data = response.data.data;

  if (!data.name_as_per_pan_match) {
    throw new Error('Name does not match PAN records');
  }
  if (!data.date_of_birth_match) {
    throw new Error('Date of birth does not match PAN records');
  }

  return true; // PAN verified
}

// Pre-save hook for creating user
userSchema.pre('save', async function(next) {
  try {
    await verifyPAN({
      pan: this.pancard,
      name: this.name,
      date_of_birth: this.DOB
    });
    next();
  } catch (err) {
    next(err); // Will stop save and throw error
  }
});

// Pre-findOneAndUpdate hook for updating user
userSchema.pre('findOneAndUpdate', async function(next) {
  try {
    const update = this.getUpdate();
    if (update.pancard || update.name || update.date_of_birth) {
      await verifyPAN({
        pan: update.pancard || update.$set?.pancard,
        name: update.name || update.$set?.name,
        date_of_birth: update.DOB || update.$set?.DOB
      });
    }
    next();
  } catch (err) {
    next(err); // Will stop update and throw error
  }
});

userSchema.index({ pancard: 1, adminId: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);
module.exports = User;
