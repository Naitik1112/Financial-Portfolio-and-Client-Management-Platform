import axios from 'axios';

// Helper function to format date

// Fetch RecentMutualFunds Funds and format dates
export const fetchRecentMutualFunds = async () => {
  try {
    const backendURL = import.meta.env.VITE_BACKEND_URL;
    const token = localStorage.getItem('jwt');

    const response = await axios.get(
      `${backendURL}/api/v1/dashboard/getRecentMFS`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );
    if (response.data && response.data.status === 'success') {
      return response.data.data;
    } else {
      throw new Error('Unexpected response format');
    }
  } catch (error) {
    console.error('Error fetching Recent Mutual Funds:', error);
    return []; // Return an empty array in case of error
  }
};
