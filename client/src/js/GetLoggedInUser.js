import axios from 'axios';

// Fetch AUM Funds and format dates
export const fetchLoggedInUser = async () => {
  try {
    const backendURL = import.meta.env.VITE_BACKEND_URL;
    const token = localStorage.getItem('jwt');

    const response = await axios.get(`${backendURL}/api/v1/users/getme`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });
    if (response.data && response.data.status === 'success') {
      return response.data.data;
    } else {
      throw new Error('Unexpected response format');
    }
  } catch (error) {
    console.error('Error fetching AUM funds:', error);
    return []; // Return an empty array in case of error
  }
};
