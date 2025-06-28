import axios from 'axios';

// Fetch Group Of User
export const fetchGroupOfUser = async userId => {
  try {
    const backendURL = import.meta.env.VITE_BACKEND_URL;
    const token = localStorage.getItem('jwt');

    const response = await axios.get(
      `${backendURL}/api/v1/group/user-groups/${userId}`,
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
    console.error('Error fetching Group Of User:', error);
    return []; // Return an empty array in case of error
  }
};
