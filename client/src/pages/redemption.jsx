import React, { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { inputStyles, buttonStyles, containerStyles } from "./../styles/themeStyles";
import { fetchMutualFundsWithNAV } from './../js/GetMFByUser';

const AddClient = () => {
  const [holderName, setHolderName] = useState(null);
  const [top100Films, setTop100Films] = useState([]);
  const [mfData, setMfData] = useState([]);
  const [redemptionAmounts, setRedemptionAmounts] = useState({});
  const [hasFetched, setHasFetched] = useState(false);
  const [navMap, setNavMap] = useState({});
  const [loading, setLoading] = useState(false);
  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('jwt');

  useEffect(() => {
    const fetchUserNames = async () => {
      try {
        const response = await fetch(`${backendURL}/api/v1/users/`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data?.data?.data) {
          const userNames = data.data.data.map((user) => ({ label: user.name, id: user._id }));
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

  useEffect(() => {
    const fetchHolderMFs = async () => {
      if (!holderName?.id) {
        setMfData([]);
        setHasFetched(false);
        setRedemptionAmounts({}); // ✅ reset on no holder
        return;
      }
      setLoading(true);
      try {
        const data = await fetchMutualFundsWithNAV(holderName.id);
        console.log(data)
        setMfData(data);
        setRedemptionAmounts({}); // ✅ reset on new data fetch
      } catch (error) {
        console.error('Error fetching MF data:', error);
        setMfData([]);
      } finally {
        setLoading(false);
        setHasFetched(true);
      }
    };

    fetchHolderMFs();
  }, [holderName]);



  const [errorMessages, setErrorMessages] = useState({}); // ✅ Error state

  const handleRedemptionChange = (id, value) => {
    const numValue = parseFloat(value);
    const fund = mfData.find(f => f._id === id);

    setRedemptionAmounts(prev => ({
      ...prev,
      [id]: value
    }));

    if (fund && numValue > parseFloat(fund.totalInvested)) {
      setErrorMessages(prev => ({
        ...prev,
        [id]: 'Redeem amount exceeds total investment'
      }));
    } else {
      setErrorMessages(prev => {
        const { [id]: _, ...rest } = prev;
        return rest; // remove error if resolved
      });
    }
  };

  const hasErrors = Object.keys(errorMessages).length > 0;


  const handleSubmit = async (event) => {
    event.preventDefault();

    const redemptionPayload = {};
    // console.log(mfData)
    for (const fund of mfData) {
      const amount = parseFloat(redemptionAmounts[fund._id]);
      if (!amount || amount <= 0) continue;

      const currentValue = Number(fund.currentValue);
      const totalUnits = Number(fund.totalUnits);

      if (!currentValue || !totalUnits || totalUnits === 0) {
        alert(`Unable to get NAV for mutual fund ${fund._id} (${fund.name || 'Unnamed'})`);
        return;
      }

      const nav = currentValue / totalUnits;
      const units = amount / nav;

      if (amount > Number(fund.totalInvested)) {
        alert(`Cannot redeem ₹${amount} from ${fund.name}. Amount exceeds investment.`);
        return;
      }
      // console.log(nav,amount,totalUnits)
      redemptionPayload[fund._id] = units.toFixed(4);
    }

    try {
      // console.log("redemptionPayload : ",redemptionPayload)
      const res = await fetch(`${backendURL}/api/v1/mutualFunds/redeemUnits`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' , Authorization: `Bearer ${token}`},
        body: JSON.stringify(redemptionPayload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Redemption failed');

      alert('Redemption successful');
      setRedemptionAmounts({});

      setRedemptionAmounts({});
      const data1 = await fetchMutualFundsWithNAV(holderName.id);
      setMfData(data1);

    } catch (err) {
      console.error(err);
      alert(`Redemption error: ${err.message}`);
    }
  };



  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        marginTop: '40px',
        width: mfData.length > 0 ? '110ch' : '53ch',  // ✅ dynamic width
        bgcolor: '#1E1E1E',
        padding: '40px',
        borderRadius: '8px',
        ...containerStyles
      }}
    >

      <Typography
        sx={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#fff',
          textAlign: 'center',
          marginBottom: '15px',
        }}
      >
        Redemption
      </Typography>

      <Autocomplete
        sx={inputStyles}
        disablePortal
        options={top100Films}
        onChange={(event, value) => setHolderName(value)}
        renderInput={(params) => <TextField {...params} label="Holder Name" />}
        componentsProps={{
          paper: {
            sx: {
              bgcolor: "grey",
              color: "black",
            },
          },
        }}
      />

      {holderName && hasFetched && (
        loading ? (
          <Typography sx={{ color: '#fff', mt: 2, textAlign: 'center' }}>
            Loading...
          </Typography>
        ) : mfData.length === 0 ? (
          <Typography sx={{ color: '#fff', mt: 2, textAlign: 'center' }}>
            No mutual funds data
          </Typography>
        ) : (
          <TableContainer component={Paper} sx={{ mt: 3, bgcolor: '#2E2E2E' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#fff', bgcolor: '#1D1D1D'}}>Scheme Name</TableCell>
                  <TableCell sx={{ color: '#fff', bgcolor: '#1D1D1D'}}>Current NAV</TableCell>
                  <TableCell sx={{ color: '#fff', bgcolor: '#1D1D1D'}}>Total Units</TableCell>
                  <TableCell sx={{ color: '#fff', bgcolor: '#1D1D1D'}}>Total Investment</TableCell>
                  <TableCell sx={{ color: '#fff', bgcolor: '#1D1D1D'}}>Current Valuation</TableCell>
                  <TableCell sx={{ color: '#fff', bgcolor: '#1D1D1D'}}>Redeem Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mfData.map((fund) => {
                  const nav = (Number(fund.currentValue) / Number(fund.totalUnits)).toFixed(2);
                  return (
                    <TableRow key={fund._id}>
                      <TableCell sx={{ color: '#fff' }}>{fund.name}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{nav}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{fund.totalUnits}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{fund.totalInvested}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{fund.currentValue}</TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          sx={inputStyles}
                          value={redemptionAmounts[fund._id] || ''}
                          onChange={(e) => handleRedemptionChange(fund._id, e.target.value)}
                          error={!!errorMessages[fund._id]}
                          helperText={errorMessages[fund._id] || ''}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}


      <Button
        size="medium"
        variant="contained"
        sx={{ ...buttonStyles, mt: 2 }}
        type="submit"
        disabled={hasErrors || loading}
      >
        {loading ? 'Submitting...' : 'Submit'}
      </Button>
    </Box>
  );
};

export default AddClient;
