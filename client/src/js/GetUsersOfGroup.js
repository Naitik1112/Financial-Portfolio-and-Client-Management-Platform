import axios from 'axios';

// Fetch Users Of Group
export const fetchUsersOfGroup = async groupId => {
  try {
    const backendURL = import.meta.env.VITE_BACKEND_URL;
    const token = localStorage.getItem('jwt');

    const response = await axios.get(
      `${backendURL}/api/v1/group/group-users/${groupId}`,
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
    console.error('Error fetching Users Of Group:', error);
    return []; // Return an empty array in case of error
  }
};
