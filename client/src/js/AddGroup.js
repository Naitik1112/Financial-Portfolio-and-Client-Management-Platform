import axios from 'axios';

// Fetch All Groups
export const addGroup = async payload => {
  try {
    const backendURL = import.meta.env.VITE_BACKEND_URL;
    const token = localStorage.getItem('jwt');

    const response = await fetch(`${backendURL}/api/v1/group/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data && data.status === 'success') {
      return data.data;
    } else {
      throw new Error('Unexpected response format');
    }
  } catch (error) {
    console.error('Error adding group :', error);
    return []; // Return an empty array in case of error
  }
};
