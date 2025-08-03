const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: false
    },
    name: {
      type: String,
      required: true,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  { timestamps: true }
);

// Compound index for uniqueness of (adminId, name)
groupSchema.index({ adminId: 1, name: 1 }, { unique: true });

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
