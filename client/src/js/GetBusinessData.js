import axios from 'axios';

// Helper function to format date
const formatDate = isoDate => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-GB'); // Formats to 'DD/MM/YYYY'
};

// Fetch Debt Funds and format dates
export const fetchBusinessData = async type => {
  try {
    const backendURL = import.meta.env.VITE_BACKEND_URL;
    const token = localStorage.getItem('jwt');

    const response = await axios.get(
      `${backendURL}/api/v1/snapshot/business-snapshot/${type}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );
    console.log(response);
    return response.data.map(business => ({
      ...business,
      date: formatDate(business.date)
    }));
  } catch (error) {
    console.error('Error fetching debt funds:', error);
    return []; // Return an empty array in case of error
  }
};
