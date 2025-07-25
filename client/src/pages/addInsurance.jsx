import  { useState,useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Autocomplete from '@mui/material/Autocomplete';
import dayjs from 'dayjs';

import { getStyles } from "../styles/themeStyles";
import { useThemeMode } from "../context/ThemeContext";



const type = [{label:'Monthly'},{label:'Quaterly'},{label:'Half-Yearly'},{label:'Yearly'}]

const policytype = [{label:'ULIP'},{label:'Endowment'},{label:'MoneyBack'},{label:'Term'}]

const companyNames = 
  [{label:'LIC'}
  ,{label:'HDFC'}
  ,{label:'Axis'}
  ,{label:'ICIC'}
  ,{label:'Kotak'}
  ,{label:'Aditya Birla'}
  ,{label:'TATA'}
  ,{label:'SBI'}
  ,{label:'Bajaj Allianz'}
  ,{label:'PNB'}
  ,{label:'Reliance Nippon'}
  ,{label:'Aviva'}
  ,{label:'Sahara'}
  ,{label:'Bharti'}
  ,{label:'Future Generali'}
  ,{label:'Ageas Federal'}
  ,{label:'Canara HSBC'}
  ,{label:'Bandhan'}
  ,{label:'Pramerica'}
  ,{label:'Star Union Dai-ich'}
  ,{label:'IndiaFirst'}
  ,{label:'Edelweiss'}
  ,{label:'Credit Access'}
  ,{label:'Acko'}
  ,{label:'Go Digit'}
  ]
  
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
  const [sumAssured, setSumAssured] = useState('');
  const [nominee3Id, setNominee3Id] = useState('');
  const [mode, setMode] = useState('');
  const [policy, setPolicyType] = useState('');

  
  const [top100Films, setTop100Films] = useState([]);

  const [claimYears, setClaimYears] = useState(0);
  const [pendingClaimYears, setPendingClaimYears] = useState(0); // Store input value separately
  const [claims, setClaims] = useState(Array(0).fill({ year: "", premium: "" }));
  
  const [deathClaimDate, setDeathClaimDate] = useState(0);
  const [deathClaim, setDeathClaim] = useState(0);

  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('jwt');

  const { darkMode } = useThemeMode();
  const { inputStyles, buttonStyles,containerStyles, containerStyles1 } = getStyles(darkMode);
  const { primaryColor, secondaryColor, tertiaryColor, body } = getStyles(darkMode);

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
          const response = await fetch(`${backendURL}/api/v1/users/`, {
            headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          });
          const data = await response.json();
           // Log to check response structure
  
          // Access nested array and map the user names
          if (data?.data) {
            const userNames = data.data.map((user) => ({ label: user.name, id: user._id }));
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

        const formattedPolicyData = {
          ...policyData,
          premium: adjustedPremium,
          startPremiumDate: startPremiumDate ? dayjs(startPremiumDate).format('YYYY-MM-DDT00:00:00.000Z') : null,
          endPremiumDate: endPremiumDate ? dayjs(endPremiumDate).format('YYYY-MM-DDT00:00:00.000Z') : null,
          maturityDate: maturityDate ? dayjs(maturityDate).format('YYYY-MM-DDT00:00:00.000Z') : null,
          deathClaimDate: deathClaimDate ? dayjs(deathClaimDate).format('YYYY-MM-DDT00:00:00.000Z') : null,
          claim: claims.map((c) => ({
            year: parseInt(c.year, 10),
            claim: parseFloat(c.premium),
          })),
          mode,
          policyType : policy,
          clientId,
          nominee1ID: nominee1Id,
          sumAssured: sumAssured,
          nominee3ID: nominee3Id,
          policyName,
          companyName,
          policyNumber,
          deathClaim
        };

        const response = await fetch(`${backendURL}/api/v1/lifeInsurance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formattedPolicyData),
        });

        if (response.ok) {
          alert('Life Insurance Policy added successfully!');
          // Reset all form fields
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

        <Autocomplete 
          sx={inputStyles}
          disablePortal
          options={companyNames}
          value={companyNames.find(option => option.label === companyName) || null}
          onChange={(event, newValue) => setCompanyName(newValue?.label || '')}
          renderInput={(params) => <TextField {...params} label="Company Name" />}
          componentsProps={{
            paper: {
              sx: {
                bgcolor: "grey", // Background color of the dropdown menu
                color: "black",  // Text color (optional)
              },
            },
          }}
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
        <TextField 
          id="outlined-basic-2" 
          label="Premium" 
          type="number" 
          variant="outlined" 
          onChange={(e) => setPremium(e.target.value)}
          sx={inputStyles}
        />
        <Autocomplete 
          sx={inputStyles}
          disablePortal
          options={type}
          value={type.find(option => option.label === mode) || null}
          onChange={(event, newValue) => setMode(newValue?.label || '')}
          renderInput={(params) => <TextField {...params} label="Mode" />}
          componentsProps={{
            paper: {
              sx: {
                bgcolor: "grey", // Background color of the dropdown menu
                color: "black",  // Text color (optional)
              },
            },
          }}
        />
        <Autocomplete 
          options={top100Films}
          value={top100Films.find((option) => option.id === clientId) || null}
          onChange={(event, newValue) => setClientId(newValue?.id || '')}
          renderInput={(params) => <TextField {...params} label="Holder Name" />}
          sx={inputStyles}
          componentsProps={{
            paper: {
              sx: {
                bgcolor: "grey", // Background color of the dropdown menu
                color: "black",  // Text color (optional)
              },
            },
          }}
        />
        <Autocomplete 
          options={top100Films}
          value={top100Films.find((option) => option.id === nominee1Id) || null}
          onChange={(event, newValue) => setNominee1Id(newValue?.id || '')}
          renderInput={(params) => <TextField {...params} label="Nominee 1" />}
          sx={inputStyles}
          componentsProps={{
            paper: {
              sx: {
                bgcolor: "grey", // Background color of the dropdown menu
                color: "black",  // Text color (optional)
              },
            },
          }}
        />

        <TextField 
          id="outlined-basic-2" 
          label="Sum Assured" 
          type="number" 
          variant="outlined" 
          onChange={(e) => setSumAssured(e.target.value)}
          sx={inputStyles}
        />


        <Autocomplete 
          sx={inputStyles}
          disablePortal
          options={policytype}
          value={policytype.find(option => option.label === policy) || null}
          onChange={(event, newValue) => setPolicyType(newValue?.label || '')}
          renderInput={(params) => <TextField {...params} label="Policy Type" />}
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
        SUBMIT
    </Button>
    </Box>
  );
  
};

export default AddPolicy;
