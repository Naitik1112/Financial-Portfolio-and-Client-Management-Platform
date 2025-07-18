import axios from 'axios';

export const fetchMutualFundsWithNAV = async userId => {
  try {
    const backendURL = import.meta.env.VITE_BACKEND_URL;
    const token = localStorage.getItem('jwt');

    const mutualFundsResponse = await axios.get(
      `${backendURL}/api/v1/mutualFunds/user/${userId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );
    const mutualFundsData = mutualFundsResponse.data.data.mutualFunds;

    const updatedDataPromises = mutualFundsData.map(async fund => {
      try {
        const amfiCode = fund.AMFI;
        console.log(amfiCode);
        console.log(`https://api.mfapi.in/mf/${amfiCode}/latest`);
        const navResponse = await axios.get(
          `https://api.mfapi.in/mf/${amfiCode}/latest`,
          {
            // Override headers to remove Authorization for this request
            headers: {
              Authorization: undefined
            }
          }
        );
        console.log(navResponse);
        const currNAV = parseFloat(navResponse.data.data[0]?.nav || 0);

        // Calculate total invested amount
        const totalInvested =
          fund.investmentType === 'sip'
            ? fund.sipTransactions.reduce((sum, txn) => sum + txn.amount, 0)
            : fund.lumpsumAmount;

        // Determine total units
        const totalUnits =
          fund.investmentType === 'sip'
            ? fund.sipTransactions.reduce((sum, txn) => sum + txn.units, 0)
            : fund.lumpsumUnits;

        // Determine redeemed units
        const redeemedUnits =
          fund.investmentType === 'sip'
            ? fund.sipTransactions.reduce(
                (sum, txn) => sum + (txn.redeemedUnits || 0),
                0
              )
            : parseFloat(fund.redeemedUnits || 0); // ✅ corrected

        const effectiveUnits = totalUnits - redeemedUnits;

        // Compute current value
        const currentValue = effectiveUnits * currNAV;

        return {
          name: fund.schemeName?.split(' - ')[0] || fund.schemeName,
          investmentType: fund.investmentType,
          status: fund.investmentType === 'sip' ? fund.sipStatus : 'N/A',
          totalInvested: totalInvested.toFixed(2),
          totalUnits: effectiveUnits.toFixed(2),
          currentValue: currentValue.toFixed(2),
          _id: fund._id
        };
      } catch (navError) {
        console.error(
          `Error fetching NAV for AMFI code ${fund.AMFI}:`,
          navError.message
        );
        return null;
      }
    });

    const updatedData = (await Promise.all(updatedDataPromises)).filter(
      fund => fund !== null
    );
    return updatedData;
  } catch (error) {
    console.error(
      'Error fetching mutual funds data:',
      error.response?.data || error.message
    );
    throw error;
  }
};
