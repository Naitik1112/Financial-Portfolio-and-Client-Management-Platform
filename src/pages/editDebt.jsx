import { useState, useEffect } from 'react';
import { TextField, Box, Button, Typography, Autocomplete } from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { inputStyles, buttonStyles, containerStyles } from "./../styles/themeStyles";

const EditFixedDeposit = () => {
  const [BankDetails, setBankDetails] = useState('');
  const [AccountNumber, setAccountNumber] = useState('');
  const [intrestRate, setintrestRate] = useState('');
  const [holderId, setHolderId] = useState('');
  const [nominee1Id, setNominee1Id] = useState('');
  const [nominee2Id, setNominee2Id] = useState('');
  const [nominee3Id, setNominee3Id] = useState('');
  const [maturityDate, setMaturityDate] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [amount, setAmount] = useState('');
  const [top100Films, setTop100Films] = useState([]);
  const { id } = useParams();
  
  useEffect(() => {
    const fetchUserNames = async () => {
      try {
        const response = await fetch('/api/v1/users/');
        const data = await response.json();
        if (data?.data?.data) {
          setTop100Films(data.data.data.map((user) => ({ label: user.name })));
        }
      } catch (error) {
        console.error('Error fetching user names:', error);
      }
    };

    const fetchDebtDetails = async () => {
      try {
        const response = await fetch(`/api/v1/debt/${id}`);
        const data = await response.json();
        if (data?.data) {
          setBankDetails(data.data.data.bankDetails || '');
          setAccountNumber(data.data.data.AccountNumber || '');
          setintrestRate(data.data.data.intrestRate || '');
          setAmount(data.data.data.amount || '');
          setStartDate(data.data.data.startDate ? dayjs(data.data.startDate) : null);
          setMaturityDate(data.data.data.MaturityDate ? dayjs(data.data.MaturityDate) : null);
          setHolderId(data.data.data.holderId?.name || '');
          setNominee1Id(data.data.data.nominee1Id?.name || '');
          setNominee2Id(data.data.data.nominee2Id?.name || '');
          setNominee3Id(data.data.data.nominee3Id?.name || '');
        }
        console.log(data.data.data.holderId)
      } catch (error) {
        console.error('Error fetching debt details:', error);
      }
    };

    fetchUserNames();
    fetchDebtDetails();
  }, []);

  const handleSubmit = async () => {
    if (!BankDetails || !amount || !holderId || !maturityDate || !startDate) {
      alert('Please fill in all required fields');
      return;
    }
    const payload = {
      AccountNumber,
      intrestRate,
      bankDetails: BankDetails,
      holderId,
      nominee1Id,
      nominee2Id,
      nominee3Id,
      MaturityDate: maturityDate.format('YYYY-MM-DD'),
      amount,
      startDate: startDate.format('YYYY-MM-DD'),
    };

    try {
      const response = await fetch(`/api/v1/debt/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        alert('FD updated successfully');
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to update FD. Please try again.');
    }
  };
  console.log(BankDetails)
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%',marginTop:'120PX',padding:'40px', ...containerStyles }}>
      <Typography sx={{ fontSize: '2rem', fontWeight: 'bold', color: 'rgb(178, 178, 178)', textAlign: 'center' }}>Edit Fixed Deposit</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4, width: '100%' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '45ch' }}>
          <TextField label="Bank Details" variant="outlined" value={BankDetails} onChange={(e) => setBankDetails(e.target.value)} sx={inputStyles} />
          <TextField label="Account Number" variant="outlined" value={AccountNumber} onChange={(e) => setAccountNumber(e.target.value)} sx={inputStyles} />
          <TextField label="Interest Rate (%)" variant="outlined" value={intrestRate} onChange={(e) => setintrestRate(e.target.value)} sx={inputStyles} />
          <TextField label="Amount" variant="outlined" value={amount} onChange={(e) => setAmount(e.target.value)} sx={inputStyles} />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker label="Starting Date" value={startDate} onChange={setStartDate} sx={inputStyles} />
          </LocalizationProvider>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '45ch' }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker label="Maturity Date" value={maturityDate} onChange={setMaturityDate} sx={inputStyles} />
          </LocalizationProvider>
          {[nominee1Id, nominee2Id, nominee3Id].map((nominee, index) => (
            <Autocomplete
              key={index}
              options={top100Films}
              getOptionLabel={(option) => option.label || ""}
              renderInput={(params) => <TextField {...params} label={`Nominee ${index + 1} ID`} sx={inputStyles} />}
              value={top100Films.find((option) => option.label === nominee) || null}
              onChange={(e, newValue) => {
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
            options={top100Films}
            getOptionLabel={(option) => option.label || ""}
            renderInput={(params) => <TextField {...params} label="Holder Name" sx={inputStyles} />}
            value={top100Films.find((option) => option.label === holderId) || null}
            onChange={(e, newValue) => setHolderId(newValue?.label || '')}
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
      sx={buttonStyles} onClick={handleSubmit}>Submit</Button>
    </Box>
  );
};

export default EditFixedDeposit;
