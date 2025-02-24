import axios from 'axios';

// Fetch Mutual Funds and their NAVs
export const fetchMutualFundsWithNAV = async userId => {
  try {
    // Fetch mutual funds of the user
    const mutualFundsResponse = await axios.get(
      `/api/v1/mutualFunds/user/${userId}`
    );
    const mutualFundsData = mutualFundsResponse.data.data.mutualFunds;

    // Fetch NAVs for each mutual fund
    const updatedDataPromises = mutualFundsData.map(async fund => {
      try {
        const amfiCode = fund.AMFI;
        const navResponse = await axios.get(
          `https://api.mfapi.in/mf/${amfiCode}/latest`
        );
        const currNAV = parseFloat(navResponse.data.data[0]?.nav || 0); // Handle missing data

        return {
          name: fund.schemeName,
          amfi: amfiCode,
          unit: fund.totalunits.toFixed(2),
          currNAV: currNAV.toFixed(2),
          _id: fund._id,
          totalAmount: (fund.totalunits * currNAV).toFixed(2)
        };
      } catch (navError) {
        console.error(
          `Error fetching NAV for AMFI code ${fund.AMFI}:`,
          navError.message
        );
        return null; // Skip this fund if the NAV fetch fails
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
