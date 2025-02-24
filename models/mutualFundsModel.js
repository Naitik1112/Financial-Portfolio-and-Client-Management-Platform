const mongoose = require('mongoose');
const axios = require('axios');

const mfSchema = new mongoose.Schema({
  schemeName: {
    type: String,
    required: [true, 'A policy must have a name'],
    trim: true
  },
  fundHouse: {
    type: String,
    required: [true, 'A policy must have a fund house']
  },
  AMFI: {
    type: Number,
    required: [true, 'A policy must have a number']
  },
  holderId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A policy must have a client ID']
  },
  nominee1Id: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  nominee2Id: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  nominee3Id: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  mode: {
    type: String,
    required: [true, 'A policy must have a mode']
  },
  startDate: {
    type: Date,
    required: [true, 'A policy must have a Start Premium Date']
  },
  totalunits: {
    type: Number
  },
  amount: {
    type: Number,
    required: true
  }
});

async function fetchNAV(AMFI, startDate) {
  try {
    const url = `https://api.mfapi.in/mf/${AMFI}`;
    const response = await axios.get(url);

    if (
      !response.data ||
      !response.data.data ||
      response.data.data.length === 0
    ) {
      throw new Error('No NAV data available for the given AMFI code');
    }

    const navData = response.data.data
      .map(record => ({
        date: new Date(
          record.date
            .split('-')
            .reverse()
            .join('-')
        ),
        nav: parseFloat(record.nav)
      }))
      .sort((a, b) => a.date - b.date);

    let closestNAV = null;
    const targetDate = new Date(startDate);
    let low = 0,
      high = navData.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const midDate = navData[mid].date;

      if (midDate.getTime() === targetDate.getTime()) {
        closestNAV = navData[mid].nav;
        break;
      } else if (midDate < targetDate) {
        closestNAV = navData[mid].nav;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    if (!closestNAV) {
      throw new Error('No NAV data available for the given transaction date');
    }

    return closestNAV;
  } catch (err) {
    throw new Error(`Failed to fetch NAV: ${err.message}`);
  }
}

async function updateUnits(next) {
  try {
    const mf = this;
    if (mf.isModified('AMFI') || mf.isModified('amount')) {
      const nav = await fetchNAV(mf.AMFI, mf.startDate);
      console.log(nav);
      mf.totalunits = mf.amount / nav;
    }
    next();
  } catch (err) {
    next(err);
  }
}

mfSchema.pre('save', updateUnits);
mfSchema.pre('findOneAndUpdate', async function(next) {
  try {
    const update = this.getUpdate();
    if (update.AMFI || update.amount) {
      const doc = await this.model.findOne(this.getQuery());
      const nav = await fetchNAV(update.AMFI || doc.AMFI, doc.startDate);
      update.totalunits = (update.amount || doc.amount) / nav;
      this.setUpdate(update);
      console.log(nav);
    }
    next();
  } catch (err) {
    next(err);
  }
});

const MutualFunds = mongoose.model('MutualFunds', mfSchema);
module.exports = MutualFunds;
