import axios from 'axios';

// Helper function to format date
const formatDate = isoDate => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-GB'); // Formats to 'DD/MM/YYYY'
};

// Fetch Debt Funds and format dates
export const fetchLifeInsWithNAV = async userId => {
  try {
    const backendURL = import.meta.env.VITE_BACKEND_URL;
    const token = localStorage.getItem('jwt');
    const response = await axios.get(
      `${backendURL}/api/v1/lifeInsurance/user/${userId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );
    console.log(response);
    if (response.data && response.data.status === 'success') {
      return response.data.data.LifeIns;
    } else {
      throw new Error('Unexpected response format');
    }
  } catch (error) {
    console.error('Error fetching Life Ins:', error);
    return []; // Return an empty array in case of error
  }
};
