import axios from 'axios';

// Fetch All Users
export const fetchAllUsers = async () => {
  try {
    const backendURL = import.meta.env.VITE_BACKEND_URL;
    const token = localStorage.getItem('jwt');

    const response = await axios.get(`${backendURL}/api/v1/users`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });
    // console.log('Response');
    // console.log(response.data);
    if (response.data && response.data.status === 'success') {
      return response.data.data;
    } else {
      throw new Error('Unexpected response format');
    }
  } catch (error) {
    console.error('Error fetching users :', error);
    return []; // Return an empty array in case of error
  }
};
