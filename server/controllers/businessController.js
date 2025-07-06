const axios = require('axios');
const BusinessSnapshot = require('../models/businessSnapshot');

// Utility to generate random numbers
const randomInRange = (min, max, decimals = 2) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

// Constants (base values)
const BASE_DATA = {
  AUM: 94363395.69601156,
  sipTotalBook: 83665232.11260498,
  lumpsumTotal: 10698163.583406562,
  lifeInsuranceTotal: 2773090,
  generalInsuranceTotal: 2349401,
  fdTotalAmount: 6492700
};

// Starting from 2025-07-05 going backwards 60 days
const BASE_DATE = new Date('2025-07-04T00:00:00.000Z');

exports.getFakeBusinessSnapshots = async (req, res) => {
  try {
    const totalDays = 60;
    const fakeData = [];

    for (let i = 0; i < totalDays; i++) {
      // Go backward each day
      const date = new Date(BASE_DATE);
      date.setUTCDate(BASE_DATE.getUTCDate() - i); // subtract i days

      // Growth factor increases as we move forward in time (reverse indexing)
      const growthFactor = 1 + (totalDays - 1 - i) * 0.002;

      const isoDate = new Date(
        Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate(),
          0,
          0,
          0
        )
      );

      fakeData.push({
        AUM: parseFloat((BASE_DATA.AUM * growthFactor).toFixed(6)),
        sipTotalBook: parseFloat(
          (BASE_DATA.sipTotalBook * growthFactor).toFixed(6)
        ),
        lumpsumTotal: parseFloat(
          (BASE_DATA.lumpsumTotal * growthFactor).toFixed(6)
        ),
        lifeInsuranceTotal: Math.round(
          BASE_DATA.lifeInsuranceTotal * growthFactor
        ),
        generalInsuranceTotal: Math.round(
          BASE_DATA.generalInsuranceTotal * growthFactor
        ),
        fdTotalAmount: Math.round(BASE_DATA.fdTotalAmount * growthFactor),

        timestamp: isoDate.toISOString(),
        date: isoDate.toISOString(),

        todaySip: randomInRange(2000, 10000),
        todayLumpsum: randomInRange(10000, 50000),
        todayRedemption: randomInRange(0, 10000),
        todayGeneralInsurance: randomInRange(0, 5000),
        todayLifeInsurance: randomInRange(0, 20000),
        todayDebt: randomInRange(0, 10000)
      });
    }

    await BusinessSnapshot.insertMany(fakeData);
      return res
        .status(201)
        .json({ message: 'Fake data saved to DB', count: fakeData.length });


    if (req.query.save === 'true') {
    //   await BusinessSnapshot.insertMany(fakeData);
    //   return res
    //     .status(201)
    //     .json({ message: 'Fake data saved to DB', count: fakeData.length });
    }

    res.json(fakeData);
  } catch (error) {
    console.error('Error generating fake business snapshots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getGroupedBusinessSnapshots = async (req, res) => {
  try {
    const { type } = req.params;

    let groupByFormat;
    if (type === 'day') {
      // Return full data sorted by date
      const data = await BusinessSnapshot.find().sort({ date: 1 });
      return res.json(data);
    } else if (type === 'week') {
      groupByFormat = '%Y-%U'; // Year + Week number
    } else if (type === 'month') {
      groupByFormat = '%Y-%m'; // Year + Month
    } else if (type === 'year') {
      groupByFormat = '%Y'; // Year
    } else {
      return res.status(400).json({ error: 'Invalid type. Use day, week, month, or year.' });
    }

    const result = await BusinessSnapshot.aggregate([
      {
        $addFields: {
          groupKey: { $dateToString: { format: groupByFormat, date: "$date" } }
        }
      },
      {
        $sort: { date: 1 }
      },
      {
        $group: {
          _id: "$groupKey",
          lastEntry: { $last: "$$ROOT" },
          totalTodaySip: { $sum: "$todaySip" },
          totalTodayLumpsum: { $sum: "$todayLumpsum" },
          totalTodayRedemption: { $sum: "$todayRedemption" },
          totalTodayGeneralInsurance: { $sum: "$todayGeneralInsurance" },
          totalTodayLifeInsurance: { $sum: "$todayLifeInsurance" },
          totalTodayDebt: { $sum: "$todayDebt" }
        }
      },
      {
        $project: {
          group: "$_id",
          date: "$lastEntry.date",
          AUM: "$lastEntry.AUM",
          sipTotalBook: "$lastEntry.sipTotalBook",
          lumpsumTotal: "$lastEntry.lumpsumTotal",
          lifeInsuranceTotal: "$lastEntry.lifeInsuranceTotal",
          generalInsuranceTotal: "$lastEntry.generalInsuranceTotal",
          fdTotalAmount: "$lastEntry.fdTotalAmount",
          todaySip: "$totalTodaySip",
          todayLumpsum: "$totalTodayLumpsum",
          todayRedemption: "$totalTodayRedemption",
          todayGeneralInsurance: "$totalTodayGeneralInsurance",
          todayLifeInsurance: "$totalTodayLifeInsurance",
          todayDebt: "$totalTodayDebt",
          _id: 0
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json(result);
  } catch (err) {
    console.error('Error in getGroupedBusinessSnapshots:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};