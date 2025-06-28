import axios from 'axios';

// Fetch All Groups
export const fetchAllGroup = async () => {
  try {
    const backendURL = import.meta.env.VITE_BACKEND_URL;
    const token = localStorage.getItem('jwt');

    const response = await axios.get(`${backendURL}/api/v1/group/all-groups`, {
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
    console.error('Error fetching All Groups :', error);
    return []; // Return an empty array in case of error
  }
};
