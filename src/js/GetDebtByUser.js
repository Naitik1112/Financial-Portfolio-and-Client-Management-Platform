import axios from 'axios';

// Helper function to format date
const formatDate = isoDate => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-GB'); // Formats to 'DD/MM/YYYY'
};

// Fetch Debt Funds and format dates
export const fetchDebtsWithNAV = async userId => {
  try {
    console.log(userId);
    const response = await axios.get(
      `/api/v1/debt/user/${userId}`
    );
    if (response.data && response.data.status === 'success') {
      return response.data.data.Debts.map(debt => ({
        ...debt,
        MaturityDate: formatDate(debt.MaturityDate),
        startDate: formatDate(debt.startDate)
      }));
    } else {
      throw new Error('Unexpected response format');
    }
  } catch (error) {
    console.error('Error fetching debt funds:', error);
    return []; // Return an empty array in case of error
  }
};
