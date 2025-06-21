import  { useState } from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Autocomplete from '@mui/material/Autocomplete';

const top100Films = [
    { label: 'The Shawshank Redemption', year: 1994 },
    { label: 'The Godfather', year: 1972 },
    { label: 'The Godfather: Part II', year: 1974 },
    { label: 'The Dark Knight', year: 2008 }
  ];

const EditPolicy = () => {
  const [amfiCode, setAmfiCode] = useState('');
  const [schemeName, setSchemeName] = useState('');
  const [fundHouse, setFundHouse] = useState('');
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('');

  

  const fetchPolicyDetails = async (code) => {
    try {
      const response = await fetch(`https://api.mfapi.in/mf/${code}/latest`,
          {
            // Override headers to remove Authorization for this request
            headers: {
              Authorization: undefined
            }
          });
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

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between', // Align boxes parallel
        gap: 4, // Add space between the two boxes
        width: '100%', // Ensure the container spans full width
      }}
    >
      {/* Existing Box */}
      <Typography
          sx={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#fff',
            textAlign: 'center',
            marginTop: '30px',
            marginBottom: '10px',
          }}
        >
        Mutual Funds Details
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
          onChange={handleAmfiCodeChange}
          sx={{
            '& .MuiInputBase-input': { color: '#fff' },
            '& .MuiInputLabel-root': { color: '#fff' },
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#fff' },
              '&:hover fieldset': { borderColor: '#fff' },
              '&.Mui-focused fieldset': { borderColor: '#E4B912' },
            },
          }}
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
          sx={{
            '& .MuiInputBase-input': { color: '#fff' },
            '& .MuiInputLabel-root': { color: '#fff' },
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#fff' },
              '&:hover fieldset': { borderColor: '#fff' },
              '&.Mui-focused fieldset': { borderColor: '#E4B912' },
            },
          }}
        />
        <TextField
          id="outlined-basic-5"
          label="Fund House"
          variant="outlined"
          value={fundHouse}
          InputProps={{ readOnly: true }}
          sx={{
            '& .MuiInputBase-input': { color: '#fff' },
            '& .MuiInputLabel-root': { color: '#fff' },
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#fff' },
              '&:hover fieldset': { borderColor: '#fff' },
              '&.Mui-focused fieldset': { borderColor: '#E4B912' },
            },
          }}
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
          sx={{
            '& .MuiInputBase-input': { color: '#fff' },
            '& .MuiInputLabel-root': { color: '#fff' },
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#fff' },
              '&:hover fieldset': { borderColor: '#fff' },
              '&.Mui-focused fieldset': { borderColor: '#E4B912' },
              },
            }}
          />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            sx={{
              '& .MuiInputBase-input': { color: '#fff' },
              '& .MuiInputLabel-root': { color: '#fff' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#fff' },
                '&:hover fieldset': { borderColor: '#fff' },
                '&.Mui-focused fieldset': { borderColor: '#E4B912' },
              },
            }}
            label="Starting Date"
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
            sx={{
                '& .MuiInputBase-input': { color: '#fff' },
                '& .MuiInputLabel-root': { color: '#fff' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#fff' },
                  '&:hover fieldset': { borderColor: '#fff' },
                  '&.Mui-focused fieldset': { borderColor: '#E4B912' },
                },
              }}
            disablePortal
            options={top100Films}
            renderInput={(params) => <TextField {...params} label="Holder Name" />}
        />
        <Autocomplete
            sx={{
                '& .MuiInputBase-input': { color: '#fff' },
                '& .MuiInputLabel-root': { color: '#fff' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#fff' },
                  '&:hover fieldset': { borderColor: '#fff' },
                  '&.Mui-focused fieldset': { borderColor: '#E4B912' },
                },
              }}
            disablePortal
            options={top100Films}
            renderInput={(params) => <TextField {...params} label="Nominee 1" />}
        />
        <Autocomplete
            sx={{
                '& .MuiInputBase-input': { color: '#fff' },
                '& .MuiInputLabel-root': { color: '#fff' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#fff' },
                  '&:hover fieldset': { borderColor: '#fff' },
                  '&.Mui-focused fieldset': { borderColor: '#E4B912' },
                },
              }}
            disablePortal
            options={top100Films}
            renderInput={(params) => <TextField {...params} label="Nominee 2" />}
        />
        <Autocomplete
            sx={{
                '& .MuiInputBase-input': { color: '#fff' },
                '& .MuiInputLabel-root': { color: '#fff' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#fff' },
                  '&:hover fieldset': { borderColor: '#fff' },
                  '&.Mui-focused fieldset': { borderColor: '#E4B912' },
                },
              }}
            disablePortal
            options={top100Films}
            renderInput={(params) => <TextField {...params} label="Nominee 3" />}
        />
        <Autocomplete
            sx={{
                '& .MuiInputBase-input': { color: '#fff' },
                '& .MuiInputLabel-root': { color: '#fff' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#fff' },
                  '&:hover fieldset': { borderColor: '#fff' },
                  '&.Mui-focused fieldset': { borderColor: '#E4B912' },
                },
              }}
            disablePortal
            options={top100Films}
            renderInput={(params) => <TextField {...params} label="Nominee 4" />}
        />
      </Box>
    </Box>
      
    <Button size="large" variant="contained" color="success">
        Save Changes
    </Button>
    </Box>
  );
  
};

export default EditPolicy;
