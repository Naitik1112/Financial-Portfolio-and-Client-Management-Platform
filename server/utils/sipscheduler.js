// eslint-disable-next-line import/no-extraneous-dependencies
const schedule = require('node-schedule');
const axios = require('axios');
const Transactions = require('../models/mutualFundTransactionsModel'); // Adjust path if needed
const MutualFunds = require('../models/mutualFundsModel'); // Adjust path if needed

async function fetchNAV(amfi) {
  const apiUrl = `https://api.mfapi.in/mf/${amfi}`;
  const response = await axios.get(apiUrl, {
    // Override headers to remove Authorization for this request
    headers: {
      Authorization: undefined
    }
  });
  if (response.status === 200 && response.data && response.data.data) {
    const today = new Date();
    let nav = null;
    response.data.data.forEach(record => {
      const recordDate = new Date(
        record.date
          .split('-')
          .reverse()
          .join('-')
      );
      if (recordDate <= today) {
        nav = parseFloat(record.nav);
      }
    });
    return nav;
  }
  return Error('Failed to fetch NAV data from the API');
}

async function processSIPTransactions() {
  const today = new Date();
  const transactions = await Transactions.find({ type: 'SIP' }).populate(
    'fundId'
  );

  transactions.forEach(async transaction => {
    if (transaction.TransactionDate.getDate() === today.getDate()) {
      try {
        const amfi = transaction.fundId.AMFI;
        const nav = await fetchNAV(amfi);

        if (nav) {
          const newUnits = transaction.Amount / nav;
          transaction.UNIT += newUnits;
          transaction.NAV = nav;
          await transaction.save();

          const mutualFund = await MutualFunds.findById(transaction.fundId._id);
          mutualFund.totalunits += newUnits;
          await mutualFund.save();
        }
      } catch (err) {
        console.error(
          `Error processing transaction ${transaction._id}: ${err.message}`
        );
      }
    }
  });
}

schedule.scheduleJob('0 0 * * *', async () => {
  console.log('Running scheduled SIP transactions update...');
  await processSIPTransactions();
});
