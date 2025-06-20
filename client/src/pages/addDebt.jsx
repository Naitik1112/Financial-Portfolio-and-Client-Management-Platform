import  { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Autocomplete from '@mui/material/Autocomplete';
import { inputStyles, buttonStyles, containerStyles } from "./../styles/themeStyles";
import dayjs from 'dayjs';
  
const AddFixedDeposit = () => {
  const [BankDetails, setBankDetails] = useState('');
  const [AccountNumber, setAccountNumber] = useState('');
  const [intrestRate, setintrestRate] = useState('');
  const [holderId, setHolderId] = useState('');
  const [nominee1Id, setNominee1Id] = useState('');
  const [nominee2Id, setNominee2Id] = useState('');
  const [nominee3Id, setNominee3Id] = useState('');
  const [maturityDate, setmaturityDate] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [top100Films, setTop100Films] = useState([]); // State to hold user names

  useEffect(() => {
    const fetchUserNames = async () => {
      try {
        const response = await fetch('/api/v1/users/');
        const data = await response.json();

        console.log('API Response:', data); // Log to check response structure

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

  const handleSubmit = async () => {
    console.log(startDate)
    if (!BankDetails || !amount || !holderId || !maturityDate || !startDate) {
      alert('Please fill in all required fields');
      return;
    }

    const payload = {
      AccountNumber,
      intrestRate,
      bankDetails:BankDetails,
      holderId,
      nominee1Id,
      nominee2Id,
      nominee3Id,
      MaturityDate: maturityDate.format('YYYY-MM-DD'),
      amount,
      startDate: startDate.format('YYYY-MM-DD'), // Format date for backend
    };

    try {
      const response = await fetch('/api/v1/debt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('FD added successfully');
        // Reset form fields
        setBankDetails('');
        setAmount('');
        setHolderId('');
        setNominee1Id('');
        setNominee2Id('');
        setNominee3Id('');
        setintrestRate('');
        setmaturityDate(null);
        setStartDate(null);

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
        marginTop: '120px',
        padding: '40px',
        paddingTop: '0px',
        paddingBottom: '15px',
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
            marginTop: '20px',
            marginBottom: '10px',
          }}
        >
        Add Fixed Deposit
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
          label="Bank Details"
          variant="outlined"
          value={BankDetails}
          onChange={(e) => {
            const value = e.target.value;
            setBankDetails(value);
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
          label="Account Number"
          variant="outlined"
          value={AccountNumber}
          onChange={(e) => {
            const value = e.target.value;
            setAccountNumber(value);
          }}
          sx={inputStyles}
        />
        <TextField
          id="outlined-basic-5"
          label="Intrest Rate ( in % )"
          variant="outlined"
          value={intrestRate}
          onChange={(e) => {
            const value = e.target.value;
            if (/^\d*$/.test(value)) {
                setintrestRate(value);
              }
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
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Maturity Date"
            value={maturityDate}
            onChange={(newValue) => setmaturityDate(newValue)}
            sx={inputStyles}
          />
        </LocalizationProvider>
        {[nominee1Id, nominee2Id, nominee3Id].map((_, index) => (
          <Autocomplete
            key={index}
            options={top100Films}
            getOptionLabel={(option) => option.label}
            renderInput={(params) => (
              <TextField
                {...params}
                label={`Nominee ${index + 1} ID`}
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
      sx={{
        ...buttonStyles
      }}
      onClick={handleSubmit}>
        Submit
    </Button>
    </Box>
  );
  
};

export default AddFixedDeposit;
