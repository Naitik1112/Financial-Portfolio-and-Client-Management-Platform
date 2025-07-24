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
import { useParams } from 'react-router-dom';
import axios from 'axios';

import { getStyles } from "../styles/themeStyles";
import { useThemeMode } from "../context/ThemeContext";

const type = [{label:'Monthly'},{label:'Quaterly'},{label:'Half-Yearly'},{label:'Yearly'}]

const policytype = [{label:'ULIP'},{label:'Endowment'},{label:'MoneyBack'},{label:'Term'}]
  
const EditPolicy = () => {
  const [policyData, setPolicyData] = useState({});
  const [policyName,setPolicyName] = useState('')
  const [companyName,setCompanyName] = useState('')
  const [policyNumber,setPolicyNumber] = useState('')
  const [startPremiumDate,setStartPremiumDate] = useState(null)
  const [endPremiumDate,setEndPremiumDate] = useState(null)
  const [premium,setPremium] = useState(0)
  const [claim,setClaim] = useState([])
  const [maturityDate,setMaturityDate] = useState(null)
  const [clientId, setClientId] = useState('');
  const [nominee1Id, setNominee1Id] = useState('');
  const [sumAssured, setSumAssured] = useState('');
  const [policy, setPolicyType] = useState('');
  const [mode, setMode] = useState('');
  const { id } = useParams()
  const [error, setError] = useState('');
  
  const [top100Films, setTop100Films] = useState([]);

  const [intialLenght, setLenght] = useState(2);

  const [claimYears, setClaimYears] = useState(4);
  const [pendingClaimYears, setPendingClaimYears] = useState(4); // Store input value separately
  const [claims, setClaims] = useState(Array(4).fill({ year: "", claim: "" }));

  const [deathClaim,setDeathClaim] = useState(0)
  const [deathClaimDate,setDeathClaimDate] = useState(null)

  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('jwt');

  const { darkMode } = useThemeMode();
  const {  inputStyles, buttonStyles,containerStyles, containerStyles1 } = getStyles(darkMode)

  

  useEffect(() => {
    const fetchPolicyData = async () => {
      try {
        const response = await axios.get(`${backendURL}/api/v1/lifeInsurance/${id}`,{
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
        });
        const data = response.data.data.data;
        console.log(data)
        setClientId(data.clientId?._id || '');
        setNominee1Id(data.nominee1ID?._id || '');
        setSumAssured(data.sumAssured || '');
        setPolicyType(data.policyType || '');
        setMode(data.mode || '');
        setPolicyName(data.policyName || '');
        setCompanyName(data.companyName || ' ');
        setPremium(data.premium || ' ');
        setPolicyNumber(data.policyNumber || " ");
        setStartPremiumDate(data.startPremiumDate ? dayjs(data.startPremiumDate) : null)
        setEndPremiumDate(data.endPremiumDate ? dayjs(data.endPremiumDate) : null)
        setMaturityDate(data.maturityDate ? dayjs(data.maturityDate) : null)
        setDeathClaimDate(data.deathClaimDate ? dayjs(data.deathClaimDate) : null );
        setDeathClaim(data.deathClaim || 0);
        setClaimYears(data.claim.length || 0)
        setPendingClaimYears(data.claim.length || 0)
        const cleanedClaims = data.claim?.map(({ _id, ...rest }) => rest) || [];
        setClaims(cleanedClaims)
        // setLenght(data.claim?.length || 4)
        console.log("claims",claims)
        console.log(cleanedClaims)
      } catch (err) {
        setError('Failed to fetch policy data. Please try again later.');
        console.error(err);
      }
    };

    if (id) fetchPolicyData();
  }, [id]);

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
            ...Array(pendingClaimYears - claimYears).fill({ year: "", claim: "" }),
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
          })
          const data = await response.json();
           // Log to check response structure
  
          // Access nested array and map the user names
          if (data?.data) {
            const userNames = data.data.map((user) => ({ label: user.name , id: user._id}));
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
          claim: claims.map((c) => ({
            year: parseInt(c.year, 10),
            claim: parseFloat(c.claim),
          })),
          mode,
          clientId,
          nominee1ID: nominee1Id,
          sumAssured: sumAssured,
          policyName: policyName,
          companyName: companyName,
          policyNumber: policyNumber,
          deathClaim: deathClaim,
          deathClaimDate: deathClaimDate

        };
        const response = await fetch(`${backendURL}/api/v1/lifeInsurance/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formattedPolicyData),
        });
    
        if (response.ok) {
          const result = await response.json();
          alert('Policy Updated successfully!');
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
      
  const clientName = top100Films.find(user => user.id === clientId)?.label || clientId;

  return (
    <Box sx={{display: 'flex',flexDirection: 'column',justifyContent: 'space-between', marginTop: '120px',padding:'40px', gap: 4,width: '100%',...containerStyles}}>
      <Typography sx={{fontSize: '2rem', fontWeight: 'bold', color: 'rgb(187,187,187)', textAlign: 'center', marginBottom: '10px',}}>
        Update {policyName} of {clientName}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between',  gap: 4, width: '100%', }}>
        <Box sx={{ display: 'flex',flexDirection: 'column',gap: 2,width: '45ch',}}>
        <TextField id="outlined-basic-1" label="Policy Number" variant="outlined" value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)}
          sx={inputStyles} InputProps={{ readOnly: true }}/>
        <TextField id="outlined-basic-4" label="Policy Name" variant="outlined" value={policyName} onChange={(e) => setPolicyName(e.target.value)}
          sx={inputStyles}
          InputProps={{ readOnly: true }}
        />
        <TextField id="outlined-basic-5" label="Fund House" value={companyName} onChange={(e) => setCompanyName(e.target.value)} variant="outlined"
          sx={inputStyles} InputProps={{ readOnly: true }}
        />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker sx={inputStyles} renderInput={(params) => (
            <TextField {...params} InputProps={{ ...params.InputProps, readOnly: true }} sx={inputStyles} />
          )} label="Starting Date" value={startPremiumDate} onChange={setStartPremiumDate} />
        </LocalizationProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker sx={inputStyles} renderInput={(params) => (
            <TextField {...params} InputProps={{ ...params.InputProps, readOnly: true }} sx={inputStyles} />
          )} label="Maturity Date" value={maturityDate} onChange={setMaturityDate} />
        </LocalizationProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker sx={inputStyles} renderInput={(params) => (
            <TextField {...params} InputProps={{ ...params.InputProps, readOnly: true }} sx={inputStyles} />
          )} label="Ending Date" value={endPremiumDate} onChange={setEndPremiumDate}/>
        </LocalizationProvider>
      </Box>
  
      <Box sx={{display: 'flex',flexDirection: 'column',gap: 2,width: '45ch',}}>
        <TextField 
          id="outlined-basic-2" 
          label="Premium" 
          type="number" 
          variant="outlined" 
          value={premium} 
          onChange={(e) => setPremium(e.target.value)}
          sx={inputStyles} 
          InputProps={{ readOnly: true }}
        />
        <Autocomplete sx={inputStyles} disablePortal options={type} renderInput={(params) => <TextField {...params} label="Mode" />} componentsProps={{
            paper: {
              sx: {
                bgcolor: "grey", // Background color of the dropdown menu
                color: "black",  // Text color (optional)
              },
            },
          }}
          value={mode} onChange={(event, newValue) => setMode(newValue?.label || '')}
          readOnly
        />
        <Autocomplete sx={inputStyles} disablePortal options={top100Films} renderInput={(params) => <TextField {...params} label="Holder Name" />} componentsProps={{
            paper: {
              sx: {
                bgcolor: "grey", // Background color of the dropdown menu
                color: "black",  // Text color (optional)
              },
            },
          }}
          value={top100Films.find((option) => option.id === clientId) || null}
          onChange={(event, newValue) => setClientId(newValue?.id || '')}
          readOnly
        />
        <Autocomplete sx={inputStyles} disablePortal options={top100Films} renderInput={(params) => <TextField {...params} label="Nominee 1" />} componentsProps={{
            paper: {
              sx: {
                bgcolor: "grey", // Background color of the dropdown menu
                color: "black",  // Text color (optional)
              },
            },
          }}
          value={top100Films.find((option) => option.id === nominee1Id) || null}
          onChange={(event, newValue) => setNominee1Id(newValue?.id || '')}
          readOnly
        />
        <TextField 
          id="outlined-basic-2" 
          label="Sum Assured" 
          type="number" 
          variant="outlined" 
          value={sumAssured} 
          onChange={(e) => setSumAssured(e.target.value)}
          sx={inputStyles} 
          InputProps={{ readOnly: true }}
        />
        <Autocomplete sx={inputStyles} disablePortal options={policytype} renderInput={(params) => <TextField {...params} label="Policy Type" />} componentsProps={{
            paper: {
              sx: {
                bgcolor: "grey", // Background color of the dropdown menu
                color: "black",  // Text color (optional)
              },
            },
          }}
          value={policytype.find((option) => option.label === policy) || null}
          onChange={(event, newValue) => setPolicyType(newValue?.label || '')}
          readOnly
        />
        
      </Box>
    </Box>
    
    
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
      <Typography sx={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'rgb(187, 187, 187)', textAlign: 'center' , marginTop: '10px' }}>
        Add Claim Details
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4, width: '45ch' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '20.5ch' }}> 
          <TextField
            label="Total Claim Years"
            type="number"
            value={pendingClaimYears}
            onChange={handlePendingClaimYearsChange}
            sx={inputStyles}
            InputProps={{ readOnly: true }}
        />
        </Box>
        {/* <Box sx={{ display: 'flex', flexDirection: 'column',alignItems:'left',justifyContent:"center",  width: '30%' }}> 
          <Button size="large"
            sx={{ 
              color: '#000', 
              height: "80%",
              width: "80%",
              ...buttonStyles
            }} onClick={handleApplyChanges}>
              SHOW
          </Button>
        </Box> */}
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
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Claim"
                type='number'
                value={claim.claim}
                onChange={(e) => handleClaimChange(index, 'claim', e.target.value)}
                sx={inputStyles}
                InputProps={{ readOnly: true }}
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
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Claim"
                value={claim.claim}
                type='number'
                onChange={(e) => handleClaimChange(index + Math.ceil(claimYears / 2), 'claim', e.target.value)}
                sx={inputStyles}
                InputProps={{ readOnly: true }}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%'}}>
      <Typography sx={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'rgb(187, 187, 187)',textAlign:'center', marginTop: '10px',marginBottom:'10px' }}>
        Add Death Claim Details
      </Typography>
      <Box sx={{ display: 'flex', gap: 4, width: '100%'}}>
        <Box sx={{ display: 'flex',flexDirection:'column', width: '45ch'}}> 
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker sx={inputStyles} label="Date of Death Claim" value={deathClaimDate} onChange={setDeathClaimDate}/>
          </LocalizationProvider>
        </Box>
        <Box sx={{ display: 'flex',flexDirection:'column', width: '45ch' }}> 
          <TextField
            label="Death Claim Amount"
            type="number"
            value={deathClaim}
            onChange={(e) => setDeathClaim(e.target.value)}
            sx={inputStyles}
          /> 
        </Box>
      </Box>
    </Box>
    
    <Button size="large"
     sx={{ 
      color: '#000', // Text color // Slightly darker gradient on hover
      marginBottom: "50px",
      ...buttonStyles
    }}
    variant="contained" color="success" onClick={handleSubmit}>
        Update Death Claim
    </Button>
    </Box>
  );
  
};

export default EditPolicy;
