import  { useState,useEffect } from 'react';
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


const type = [{label:'Monthly'},{label:'Quaterly'},{label:'Half-Yearly'},{label:'Yearly'}]
  
const AddPolicy = () => {
  const [policyData, setPolicyData] = useState({
  });
  const [policyName,setPolicyName] = useState('')
  const [companyName,setCompanyName] = useState('')
  const [policyNumber,setPolicyNumber] = useState('')
  const [startPremiumDate,setStartPremiumDate] = useState(null)
  const [endPremiumDate,setEndPremiumDate] = useState('')
  const [premium,setPremium] = useState(0)
  const [claim,setClaim] = useState([])
  const [maturityDate,setMaturityDate] = useState('')
  const [clientId, setClientId] = useState('');
  const [nominee1Id, setNominee1Id] = useState('');
  const [nominee2Id, setNominee2Id] = useState('');
  const [nominee3Id, setNominee3Id] = useState('');
  const [mode, setMode] = useState('');

  
  const [top100Films, setTop100Films] = useState([]);

  const [claimYears, setClaimYears] = useState(0);
  const [pendingClaimYears, setPendingClaimYears] = useState(0); // Store input value separately
  const [claims, setClaims] = useState(Array(0).fill({ year: "", premium: "" }));
  
  const [deathClaimDate, setDeathClaimDate] = useState(0);
  const [deathClaim, setDeathClaim] = useState(0);

  const handlePendingClaimYearsChange = (event) => {
    const value = Number(event.target.value);
    if (value >= 0) setPendingClaimYears(value); // Only update the input state
  };

  const handleApplyChanges = () => {
    if (pendingClaimYears >= 0) {
      setClaims((prevClaims) => {
        if (pendingClaimYears > claimYears) {
          // Append new empty claim objects
          return [
            ...prevClaims,
            ...Array(pendingClaimYears - claimYears).fill({ year: "", premium: "" }),
          ];
        } else if (pendingClaimYears < claimYears) {
          // Truncate the claims array
          return prevClaims.slice(0, pendingClaimYears);
        }
        return prevClaims; // No change if values are the same
      });

      setClaimYears(pendingClaimYears); // Update claim years only on button click
    }
  };

  const handleClaimChange = (index, field, value) => {
    const updatedClaims = [...claims];
    updatedClaims[index] = { ...updatedClaims[index], [field]: value };
    setClaims(updatedClaims);
  };

  const handleChange = (field, value) => {
    console.log(field,value)
    setPolicyData({ ...policyData, [field]: value });
  };

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


    const handleSubmit = async () => {
      try {
        let adjustedPremium = parseFloat(premium);
    
        // Adjust premium based on mode
        // if (mode === "Monthly") {
        //   adjustedPremium *= 12;
        // } else if (mode === "Quaterly") {
        //   adjustedPremium *= 4;
        // } else if (mode === "Half-Yearly") {
        //   adjustedPremium *= 2;
        // }
    
        const formattedPolicyData = {
          ...policyData,
          premium: adjustedPremium, // Updated premium value
          startPremiumDate: startPremiumDate
            ? dayjs(startPremiumDate).format('YYYY-MM-DDT00:00:00.000Z')
            : null,
          endPremiumDate: endPremiumDate
            ? dayjs(endPremiumDate).format('YYYY-MM-DDT00:00:00.000Z')
            : null,
          maturityDate: maturityDate
            ? dayjs(maturityDate).format('YYYY-MM-DDT00:00:00.000Z')
            : null,
          deathClaimDate: deathClaimDate
            ? dayjs(deathClaimDate).format('YYYY-MM-DDT00:00:00.000Z')
            : null,
          claim: claims.map((c) => ({
            year: parseInt(c.year, 10),
            claim: parseFloat(c.premium),
          })),
          mode,
          clientId,
          nominee1ID: nominee1Id,
          nominee2ID: nominee2Id,
          nominee3ID: nominee3Id,
          policyName: policyName,
          companyName: companyName,
          policyNumber: policyNumber,
          deathClaim: deathClaim
        };
        
        console.log(formattedPolicyData)
        const response = await fetch('/api/v1/lifeInsurance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formattedPolicyData),
        });
    
        if (response.ok) {
          const result = await response.json();
          alert('Policy added successfully!');
          window.location.reload();
        } else {
          const error = await response.json();
          alert(`Error: ${error.message}`);
        }
      } catch (error) {
        console.error('Error submitting policy:', error);
        alert('An error occurred while submitting the policy.');
      }
    };
    
    
  

  return (
    <Box sx={{display: 'flex',flexDirection: 'column',justifyContent: 'space-between', gap: 4,width: '100%',marginTop: '120px',padding: '40px',...containerStyles}}>
      <Typography sx={{fontSize: '2rem', fontWeight: 'bold', color: '#fff', textAlign: 'center',  marginBottom: '10px',}}>
        Add Life Insurance
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between',  gap: 4, width: '100%', }}>
        <Box sx={{ display: 'flex',flexDirection: 'column',gap: 2,width: '45ch',}}>
        <TextField id="outlined-basic-1" label="Policy Number" variant="outlined" onChange={(e) => setPolicyNumber(e.target.value)}
          sx={inputStyles}/>
        <TextField id="outlined-basic-4" label="Policy Name" variant="outlined" onChange={(e) => setPolicyName(e.target.value)}
          sx={inputStyles}
        />
        <TextField id="outlined-basic-5" label="Fund House" onChange={(e) => setCompanyName(e.target.value)} variant="outlined"
          sx={inputStyles}
        />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker sx={inputStyles} label="Starting Date" onChange={(date) => setStartPremiumDate(date ? date.toISOString() : '')} />
        </LocalizationProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker sx={inputStyles} label="Maturity Date" onChange={(date) => setMaturityDate(date ? date.toISOString() : '')} />
        </LocalizationProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker sx={inputStyles} label="Ending Date" onChange={(date) => setEndPremiumDate(date ? date.toISOString() : '')}/>
        </LocalizationProvider>
      </Box>
  
      <Box sx={{display: 'flex',flexDirection: 'column',gap: 2,width: '45ch',}}>
        <TextField id="outlined-basic-2" label="Premium" type="number" variant="outlined" onChange={(e) => setPremium(e.target.value)}
            sx={inputStyles}/>
        <Autocomplete sx={inputStyles} disablePortal options={type} renderInput={(params) => <TextField {...params} label="Mode" />}
          onChange={(event, newValue) => setMode(newValue?.label || '')}
          componentsProps={{
            paper: {
              sx: {
                bgcolor: "grey", // Background color of the dropdown menu
                color: "black",  // Text color (optional)
              },
            },
          }}
        />
        <Autocomplete sx={inputStyles} disablePortal options={top100Films} renderInput={(params) => <TextField {...params} label="Holder Name" />}
          onChange={(event, newValue) => setClientId(newValue?.label || '')}
          componentsProps={{
            paper: {
              sx: {
                bgcolor: "grey", // Background color of the dropdown menu
                color: "black",  // Text color (optional)
              },
            },
          }}
        />
        <Autocomplete sx={inputStyles} disablePortal options={top100Films} renderInput={(params) => <TextField {...params} label="Nominee 1" />}
          onChange={(event, newValue) => setNominee1Id(newValue?.label || '')}
          componentsProps={{
            paper: {
              sx: {
                bgcolor: "grey", // Background color of the dropdown menu
                color: "black",  // Text color (optional)
              },
            },
          }}
        />
        <Autocomplete sx={inputStyles} disablePortal options={top100Films} renderInput={(params) => <TextField {...params} label="Nominee 2" />}
          onChange={(event, newValue) => setNominee2Id(newValue?.label || '')}
          componentsProps={{
            paper: {
              sx: {
                bgcolor: "grey", // Background color of the dropdown menu
                color: "black",  // Text color (optional)
              },
            },
          }}
        />
        <Autocomplete sx={inputStyles} disablePortal options={top100Films} renderInput={(params) => <TextField {...params} label="Nominee 3" />}
          onChange={(event, newValue) => setNominee3Id(newValue?.label || '')}
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
    
    
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
      <Typography sx={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fff',textAlign:'center', marginTop: '10px',marginBottom:'10px' }}>
        Add Maturity Details
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4, width: '45ch' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '20.5ch' }}> 
          <TextField
            label="Total Maturity Years"
            type="number"
            value={pendingClaimYears}
            onChange={handlePendingClaimYearsChange}
            sx={inputStyles}
        />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column',alignItems:'left',justifyContent:"center",  width: '30%' }}> 
          <Button size="large"
          sx={{ 
            backgroundImage: 'linear-gradient(90deg,rgb(124, 97, 44),rgb(192, 169, 108))', 
            color: '#000', 
            height: "80%",
            width: "80%",
            ...buttonStyles,
          }} onClick={handleApplyChanges}>
            SHOW
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 4, width: '100%' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '45ch' }}>
          {claims.slice(0, Math.ceil(claimYears / 2)).map((claim, index) => (
            <Box key={index} sx={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
              <TextField
                label="Year"
                type='number'
                value={claim.year}
                onChange={(e) => handleClaimChange(index, 'year', e.target.value)}
                sx={inputStyles}
              />
              <TextField
                label="Maturity Amount"
                type='number'
                value={claim.premium}
                onChange={(e) => handleClaimChange(index, 'premium', e.target.value)}
                sx={inputStyles}
              />
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '45ch' }}>
          {claims.slice(Math.ceil(claimYears / 2)).map((claim, index) => (
            <Box key={index + Math.ceil(claimYears / 2)} sx={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
              <TextField
                label="Year"
                value={claim.year}
                type='number'
                onChange={(e) => handleClaimChange(index + Math.ceil(claimYears / 2), 'year', e.target.value)}
                sx={inputStyles}
              />
              <TextField
                label="Maturity Amount"
                value={claim.premium}
                type='number'
                onChange={(e) => handleClaimChange(index + Math.ceil(claimYears / 2), 'premium', e.target.value)}
                sx={inputStyles}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>

    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%'}}>
      <Typography sx={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fff',textAlign:'center', marginTop: '10px',marginBottom:'10px' }}>
        Add Death Claim Details
      </Typography>
      <Box sx={{ display: 'flex', gap: 4, width: '100%'}}>
        <Box sx={{ display: 'flex',flexDirection:'column', width: '45ch'}}> 
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker sx={inputStyles} label="Date of Death Claim" onChange={(date) => setDeathClaimDate(date ? date.toISOString() : '')}/>
          </LocalizationProvider>
        </Box>
        <Box sx={{ display: 'flex',flexDirection:'column', width: '45ch' }}> 
          <TextField
            label="Death Claim Amount"
            type="number"
            onChange={(e) => setDeathClaim(e.target.value)}
            sx={inputStyles}
          /> 
        </Box>
      </Box>
    </Box>
    
    <Button size="large"
     sx={{ 
      ...buttonStyles,
    }}
    variant="contained" color="success" onClick={handleSubmit}>
        Submit
    </Button>
    </Box>
  );
  
};

export default AddPolicy;
