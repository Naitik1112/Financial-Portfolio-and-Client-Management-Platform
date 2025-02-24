import  { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Autocomplete from '@mui/material/Autocomplete';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { inputStyles, buttonStyles, containerStyles } from "./../styles/themeStyles";

const type = [{label:'SIP'},{label:'LUMPSUM'}]
  
const AddPolicy = () => {
  const [amfiCode, setAmfiCode] = useState('');
  const [schemeName, setSchemeName] = useState('');
  const [fundHouse, setFundHouse] = useState('');
  const [holderId, setHolderId] = useState('');
  const [nominee1Id, setNominee1Id] = useState('');
  const [nominee2Id, setNominee2Id] = useState('');
  const [nominee3Id, setNominee3Id] = useState('');
  const [typeValue, setTypeValue] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [top100Films, setTop100Films] = useState([]); // State to hold user names
  const { id } = useParams();

  useEffect(() => {
    const fetchPolicyData = async () => {
      try {
        const response = await axios.get(`/api/v1/mutualFunds/${id}`);
        const data = response.data.data.data;
        setAmfiCode(data.AMFI || '');
        setSchemeName(data.schemeName || '');
        setFundHouse(data.fundHouse || '');
        setHolderId(data.holderId?.name || '');
        setNominee1Id(data.nominee1Id?.name || '');
        setNominee2Id(data.nominee2Id?.name || '');
        setNominee3Id(data.nominee3Id?.name || '');
        setTypeValue(data.mode || '');
        setStartDate(data.startDate ? dayjs(data.startDate) : null);
        setAmount(data.amount || '');
      } catch (err) {
        setError('Failed to fetch policy data. Please try again later.');
        console.error(err);
      }
    };

    if (id) fetchPolicyData();
  }, [id]);
 

  useEffect(() => {
    const fetchUserNames = async () => {
      try {
        const response = await fetch('/api/v1/users/');
        const data = await response.json();
         // Log to check response structure

        // Access nested array and map the user names
        if (data?.data?.data) {
          const userNames = data.data.data.map((user) => ({ label: user.name }));
          setTop100Films(userNames);
        } else {
          throw new Error('Unexpected response structure');
        }
      } catch (error) {
        console.error('Error fetching user names:', error);
      }
    };
  
    fetchUserNames();
  }, []);
  

  const fetchPolicyDetails = async (code) => {
    try {
      //TO CHECK STATUS "http://status.mfapi.in/"
      
      const response = await fetch(`https://api.mfapi.in/mf/${code}/latest`);
      const data = await response.json();

      // Check if status is SUCCESS and meta is not empty
      if (data.status === 'SUCCESS' && data.meta && Object.keys(data.meta).length > 0) {
        setSchemeName(data.meta.scheme_name || ''); // Fallback to empty if not present
        setFundHouse(data.meta.fund_house || ''); // Fallback to empty if not present
        setError(''); // Clear any previous errors
      } else {
        setSchemeName('');
        setFundHouse('');
        setError('PLEASE ENTER VALID AMFI CODE'); // Show error for empty meta or invalid response
      }
    } catch (error) {
      console.error('Error fetching policy details:', error);
      setSchemeName('');
      setFundHouse('');
      setError('PLEASE ENTER VALID AMFI CODE'); // Handle fetch errors
    }
  };

  const handleAmfiCodeChange = (event) => {
    const value = event.target.value;
    setAmfiCode(value);

    if (value.trim() !== '') {
      fetchPolicyDetails(value);
    } else {
      setSchemeName('');
      setFundHouse('');
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!amfiCode || !amount || !holderId || !typeValue || !startDate) {
      alert('Please fill in all required fields');
      return;
    }

    const payload = {
      schemeName,
      fundHouse,
      AMFI: amfiCode,
      holderId,
      nominee1Id,
      nominee2Id,
      nominee3Id,
      mode: typeValue,
      amount,
      startDate: startDate.format('YYYY-MM-DD'), // Format date for backend
    };

    console.log(payload)
    try {
      const response = await fetch(`/api/v1/mutualFunds/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Policy Updated successfully');
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to add policy. Please try again.');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between', // Align boxes parallel
        gap: 4, // Add space between the two boxes
        width: '100%', // Ensure the container spans full width
        padding:'40px',
        marginTop: '120px',
        ...containerStyles
      }}
    >
      {/* Existing Box */}
      <Typography
          sx={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#fff',
            textAlign: 'center',
            marginBottom: '0px',
          }}
        >
        Update Policy
    </Typography>
    <Box sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between', // Align boxes parallel
        gap: 4, // Add space between the two boxes
        width: '100%', // Ensure the container spans full width
      }}
    >
        <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          width: '45ch',
        }}
      >
        
        <TextField
          id="outlined-basic-1"
          label="AMFI CODE"
          variant="outlined"
          value={amfiCode}
          onChange={(e) => {
            const value = e.target.value;
            setAmfiCode(value);
            if (value.trim()) fetchPolicyDetails(value);
          }}
          sx={inputStyles}
        />
        {error && (
          <Typography
            sx={{
              color: 'red',
              fontSize: '0.875rem',
              marginTop: '-10px',
            }}
          >
            {error}
          </Typography>
        )}
        <TextField
          id="outlined-basic-4"
          label="Scheme Name"
          variant="outlined"
          value={schemeName}
          InputProps={{ readOnly: true }}
          onChange={(e) => {
            const value = e.target.value;
            setSchemeName(value);
          }}
          sx={inputStyles}
        />
        <TextField
          id="outlined-basic-5"
          label="Fund House"
          variant="outlined"
          value={fundHouse}
          InputProps={{ readOnly: true }}
          onChange={(e) => {
            const value = e.target.value;
            setFundHouse(value);
          }}
          sx={inputStyles}
        />
        <TextField
          id="outlined-basic-2"
          label="Amount"
          variant="outlined"
          value={amount}
          onChange={(event) => {
            const value = event.target.value;
            if (/^\d*$/.test(value)) {
              setAmount(value);
            }
          }}
          sx={inputStyles}
          />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Starting Date"
            value={startDate}
            onChange={(newValue) => setStartDate(newValue)}
            sx={inputStyles}
          />
        </LocalizationProvider>
      </Box>
  
      {/* New Parallel Box */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          width: '45ch',
        }}
      >
        <Autocomplete
          sx={inputStyles}
          disablePortal
          options={type}
          getOptionLabel={(option) => option.label}
          value={type.find((option) => option.label === typeValue) || null}
          renderInput={(params) => <TextField {...params} label="Type" />}
          onChange={(event, newValue) => setTypeValue(newValue?.label || '')}
          componentsProps={{
            paper: {
              sx: {
                bgcolor: "grey", // Background color of the dropdown menu
                color: "black",  // Text color (optional)
              },
            },
          }}
        />

        {[nominee1Id, nominee2Id, nominee3Id].map((nominee, index) => (
          <Autocomplete
            key={index}
            options={top100Films}
            getOptionLabel={(option) => option.label}
            value={top100Films.find((option) => option.label === nominee) || null} // Set default value
            renderInput={(params) => (
              <TextField
                {...params}
                label={`Nominee ${index + 1} Name`}
                variant="outlined"
                sx={inputStyles}
              />
            )}
            onChange={(event, newValue) => {
              if (index === 0) setNominee1Id(newValue?.label || '');
              if (index === 1) setNominee2Id(newValue?.label || '');
              if (index === 2) setNominee3Id(newValue?.label || '');
            }}
            componentsProps={{
              paper: {
                sx: {
                  bgcolor: "grey", // Background color of the dropdown menu
                  color: "black",  // Text color (optional)
                },
              },
            }}
          />
        ))}

        <Autocomplete
          sx={inputStyles}
          disablePortal
          options={top100Films}
          getOptionLabel={(option) => option.label}
          value={top100Films.find((option) => option.label === holderId) || null}
          renderInput={(params) => <TextField {...params} label="Holder Name" />}
          onChange={(event, newValue) => setHolderId(newValue?.label || '')}
          componentsProps={{
            paper: {
              sx: {
                bgcolor: "grey", // Background color of the dropdown menu
                color: "black",  // Text color (optional)
              },
            },
          }}
        />
        
      </Box>
    </Box>
      
    <Button size="large" variant="contained" 
      sx={buttonStyles}
      onClick={handleSubmit}>
        Update Details
    </Button>
    </Box>
  );
  
};

export default AddPolicy;
