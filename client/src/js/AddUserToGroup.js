export const addUserToGroup = async payload => {
  try {
    const backendURL = import.meta.env.VITE_BACKEND_URL;
    const token = localStorage.getItem('jwt');
    // console.log(payload);

    const response = await fetch(`${backendURL}/api/v1/group/add-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json(); // ✅ Fix here

    if (data && data.status === 'success') {
      return data.data;
    } else {
      throw new Error('Unexpected response format');
    }
  } catch (error) {
    console.error('Error adding user to group:', error);
    return []; // Optional: return null or undefined depending on how you handle errors
  }
};
