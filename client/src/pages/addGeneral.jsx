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

const typelabels = [{label:'Health Insurance'},{label:'Car Insurance'},{label:'Travel Insurance'},{label:'PA Insurance'}]

const companyNames = 
  [{label:'Acko'}
  ,{label:'Aditya Birla'}
  ,{label:'Agriculture'}
  ,{label:'Bajaj Allianz'}
  ,{label:'Cholamandalam MS'}
  ,{label:'Manipal Cigna'}
  ,{label:'Navi'}
  ,{label:'Go Digit'}
  ,{label:'Zuno'}
  ,{label:'ECGC'}
  ,{label:'Future'}
  ,{label:'HDFC ERGO'}
  ,{label:'ICICI'}
  ,{label:'IFFCO'}
  ,{label:'Zurich Kotak'}
  ,{label:'Liberty'}
  ,{label:'Magma'}
  ,{label:'Niva Bupa'}
  ,{label:'National'}
  ,{label:'New India'}
  ,{label:'Raheja QBE'}
  ,{label:'Reliance'}
  ,{label:'Care'}
  ,{label:'Royal Sundaram'}
  ,{label:'SBI'}
  ,{label:'Shriram'}
  ,{label:'Star Health'}
  ,{label:'Tata AIG'}
  ,{label:'The Oriental'}
  ,{label:'United India'}
  ,{label:'Universal Sompo'}
  ,{label:'Kshema'}
  ,{label:'Galaxy'}
  ,{label:'Care'}
  ]

import { getStyles } from "../styles/themeStyles";
import { useThemeMode } from "../context/ThemeContext";
  
const AddGeneral = () => {
  const [policyData, setPolicyData] = useState({
  });
  const [policyName,setPolicyName] = useState('')
  const [companyName,setCompanyName] = useState('')
  const [policyNumber,setPolicyNumber] = useState('')
  const [startPremiumDate,setStartPremiumDate] = useState(null)
  const [claim,setClaim] = useState([])
  const [clientId, setClientId] = useState('');
  const [nominee1Id, setNominee1Id] = useState('');
  const [vehicleId, setvehicleId] = useState('');
  const [type, setType] = useState('');

  
  const [top100Films, setTop100Films] = useState([]);

  const [claims, setClaims] = useState([]);
  const [claimYears, setClaimYears] = useState(0);
  const [pendingClaimYears, setPendingClaimYears] = useState(0);

  const [premiumYears, setPremiumYears] = useState(0);
  const [pendingPremiumYears, setPendingPremiumYears] = useState(0); // Store input value separately
  const [premiums, setPremiums] = useState(Array(0).fill({ year: "", premium1: "" }));

  const handlePendingClaimYearsChange = (event) => {
    const value = Number(event.target.value);
    if (value >= 0) setPendingClaimYears(value);
  };

  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('jwt');

  const { darkMode } = useThemeMode();
  const { inputStyles, buttonStyles,containerStyles, containerStyles1 } = getStyles(darkMode);

  const handleApplyChanges = () => {
    if (pendingClaimYears >= 0) {
      setClaims((prevClaims) => {
        if (pendingClaimYears > claimYears) {
          return [...prevClaims, ...Array(pendingClaimYears - claimYears).fill({ claimId: "", requestDate: null, claim: "", approvalDate: null, approvalClaim: "" })];
        } else if (pendingClaimYears < claimYears) {
          return prevClaims.slice(0, pendingClaimYears);
        }
        return prevClaims;
      });
      setClaimYears(pendingClaimYears);
    }
  };

  const handleClaimChange = (index, field, value) => {
    const updatedClaims = [...claims];
    updatedClaims[index] = { ...updatedClaims[index], [field]: value };
    setClaims(updatedClaims);
  };


  const handlePendingPremiumYearsChange = (event) => {
    const value = Number(event.target.value);
    if (value >= 0) setPendingPremiumYears(value); // Only update the input state
  };

  const handleApplyChanges1 = () => {
    if (pendingPremiumYears >= 0) {
      setPremiums((prevPremiums) => {
        if (pendingPremiumYears > premiumYears) {
          // Append new empty claim objects
          return [
            ...prevPremiums,
            ...Array(pendingPremiumYears - premiumYears).fill({ year: "", premium1: "" }),
          ];
        } else if (pendingPremiumYears < premiumYears) {
          // Truncate the claims array
          return prevPremiums.slice(0, pendingPremiumYears);
        }
        return prevPremiums; // No change if values are the same
      });

      setPremiumYears(pendingPremiumYears); // Update claim years only on button click
    }
  };

  const handlePremiumChange = (index, field, value) => {
    const updatedPremiums = [...premiums];
    updatedPremiums[index] = { ...updatedPremiums[index], [field]: value };
    setPremiums(updatedPremiums);
  };

  const handleChange = (field, value) => {
    console.log(field,value)
    setPolicyData({ ...policyData, [field]: value });
  };

  useEffect(() => {
      const fetchUserNames = async () => {
        try {
          const response = await fetch(`${backendURL}/api/v1/users/`, {
            method: "GET", 
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
          });
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
    
        // Adjust premium based on Type
        // if (Type === "Monthly") {
        //   adjustedPremium *= 12;
        // } else if (Type === "Quaterly") {
        //   adjustedPremium *= 4;
        // } else if (Type === "Half-Yearly") {
        //   adjustedPremium *= 2;
        // }
        console.log(claims)

        const formattedPolicyData = {
          ...policyData,
          startPremiumDate: startPremiumDate
            ? dayjs(startPremiumDate.substring(0, 10))
            : null,
          claims: claims.map(claim => ({
            ...claim,
            claim: parseInt(claim.claim,10),
            approvalClaim: parseInt(claim.approvalClaim,10),
            requestDate: claim.requestDate ? dayjs(claim.requestDate.substring(0, 10)) : null, 
            approvalDate: claim.approvalDate ? dayjs(claim.approvalDate.substring(0, 10)): null
          })),
          premium: premiums.map((c) => ({
            year: parseInt(c.year, 10),
            premium1: parseFloat(c.premium1),
          })),
          type,
          clientId,
          // nominee1ID: nominee1Id,
          vehicleID: vehicleId,
          policyName: policyName,
          companyName: companyName,
          policyNumber: policyNumber,

        };
        
        console.log(formattedPolicyData)

        const response = await fetch(`${backendURL}/api/v1/generalInsurance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
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
    <Box sx={{display: 'flex',flexDirection: 'column',justifyContent: 'space-between',padding:'40px',marginTop: '120px', gap: 4,width: '100%',...containerStyles}}>
      <Typography sx={{fontSize: '2rem', fontWeight: 'bold', color: '#fff', textAlign: 'center',  marginBottom: '10px',}}>
        Add General Insurance
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between',  gap: 4, width: '100%', }}>
        <Box sx={{ display: 'flex',flexDirection: 'column',gap: 2,width: '45ch',}}>
        <TextField id="outlined-basic-1" label="Policy Number" variant="outlined" onChange={(e) => setPolicyNumber(e.target.value)}
          sx={inputStyles}/>
        <TextField id="outlined-basic-4" label="Policy Name" variant="outlined" onChange={(e) => setPolicyName(e.target.value)}
          sx={inputStyles}
        />
        <TextField id="outlined-basic-5" label="Company Name" onChange={(e) => setCompanyName(e.target.value)} variant="outlined"
          sx={inputStyles}
        />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker sx={inputStyles} label="Starting Date" onChange={(date) => setStartPremiumDate(date ? date.toISOString() : '')} />
        </LocalizationProvider>
      </Box>
  
      <Box sx={{display: 'flex',flexDirection: 'column',gap: 2,width: '45ch',}}>
        <Autocomplete sx={inputStyles} disablePortal options={top100Films} renderInput={(params) => <TextField {...params} label="Holder Name" />}
          onChange={(event, newValue) => setClientId(newValue?.id || '')}
          componentsProps={{
            paper: {
              sx: {
                bgcolor: "grey", // Background color of the dropdown menu
                color: "black",  // Text color (optional)
              },
            },
          }}
        />
        {/* <Autocomplete sx={inputStyles} disablePortal options={top100Films} renderInput={(params) => <TextField {...params} label="Nominee 1" />}
          onChange={(event, newValue) => setNominee1Id(newValue?.id || '')}
          componentsProps={{
            paper: {
              sx: {
                bgcolor: "grey", // Background color of the dropdown menu
                color: "black",  // Text color (optional)
              },
            },
          }}
        /> */}
        <TextField id="vehicle N.o" label="Vehicle N.o" onChange={(e) => setvehicleId(e.target.value)} variant="outlined"
          sx={inputStyles}
        />
        <Autocomplete sx={inputStyles} disablePortal options={typelabels} renderInput={(params) => <TextField {...params} label="Type" />}
          onChange={(event, newValue) => setType(newValue?.label || '')}
        />
      </Box>
    </Box>
    
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
      <Typography sx={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff', marginTop: '10px' }}>
        Add Premium Details
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4, width: '45ch' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '20.5ch' }}> 
          <TextField
            label="Total Premium Years"
            type="number"
            value={pendingPremiumYears}
            onChange={handlePendingPremiumYearsChange}
            sx={inputStyles}
        />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column',alignItems:'left',justifyContent:"center",  width: '30%' }}> 
          <Button size="large"
          sx={{ 
            // backgroundImage: 'linear-gradient(90deg,rgb(124, 97, 44),rgb(192, 169, 108))', 
            color: '#000', 
            height: "90%",
            width: "80%",
            ...buttonStyles
          }} onClick={handleApplyChanges1}>
            SHOW
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 4, width: '100%' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '45ch' }}>
          {premiums.slice(0, Math.ceil(premiumYears / 2)).map((premium, index) => (
            <Box key={index} sx={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
              <TextField
                label="Year"
                type='number'
                value={premium.year}
                onChange={(e) => handlePremiumChange(index, 'year', e.target.value)}
                sx={inputStyles}
              />
              <TextField
                label="Premium"
                type='number'
                value={premium.premium1}
                onChange={(e) => handlePremiumChange(index, 'premium1', e.target.value)}
                sx={inputStyles}
              />
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '45ch' }}>
          {premiums.slice(Math.ceil(premiumYears / 2)).map((premium, index) => (
            <Box key={index + Math.ceil(premiumYears / 2)} sx={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
              <TextField
                label="Year"
                value={premium.year}
                type='number'
                onChange={(e) => handlePremiumChange(index + Math.ceil(premiumYears / 2), 'year', e.target.value)}
                sx={inputStyles}
              />
              <TextField
                label="Premium"
                value={premium.premium1}
                type='number'
                onChange={(e) => handlePremiumChange(index + Math.ceil(premiumYears / 2), 'premium1', e.target.value)}
                sx={inputStyles}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
    
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
      <Typography sx={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff', marginTop: '10px' }}>
        Add Claim Details
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4, width: '45ch' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '20.5ch' }}> 
          <TextField
            label="Total Number of Claims"
            type="number"
            value={pendingClaimYears}
            onChange={handlePendingClaimYearsChange}
            sx={inputStyles}
        />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column',alignItems:'left',justifyContent:"center",  width: '30%' }}> 
          <Button size="large"
          sx={{ 
            // backgroundImage: 'linear-gradient(90deg,rgb(124, 97, 44),rgb(192, 169, 108))', 
            color: '#000', 
            height: "90%",
            width: "80%",
            ...buttonStyles
          }} onClick={handleApplyChanges}>
            SHOW
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 4, width: '100%' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '94ch' }}>
          {claims.slice(0, Math.ceil(claimYears)).map((claim, index) => (
            <Box key={index} sx={{ display: 'flex', flexDirection: 'row', gap: 2}}>
              <Typography sx={{fontSize: "20px",
                  fontWeight: "bold",
                  color: "grey",
                  display: "flex",
                  justifyContent: "center", // Centers horizontally
                  alignItems: "center", // Centers vertically
                  textAlign: "center", // Ensures text itself is centered
                  height: "100%", // Ensures it takes full height of parent
                  }}>
                {index+1}
              </Typography> 
              <TextField
                label="Claim Id"
                value={claim.claimId}
                onChange={(e) => handleClaimChange(index, 'claimId', e.target.value)}
                sx={{...inputStyles}}
              />
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Request Date"  
                  value={claim.requestDate ? dayjs(claim.requestDate.substring(0, 10)) : null}
                  onChange={(date) => handleClaimChange(index, 'requestDate', date ? date.format('YYYY-MM-DD') : null)}
                  sx={inputStyles}
                />
              </LocalizationProvider>
              <TextField
                label="Claim Requested"
                type='number'
                value={claim.premium}
                onChange={(e) => handleClaimChange(index, 'claim', e.target.value)}
                sx={inputStyles}
              />
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Approval Date"
                  value={claim.approvalDate ? dayjs(claim.approvalDate.substring(0, 10)) : null}
                  onChange={(date) => handleClaimChange(index, 'approvalDate', date ? date.format('YYYY-MM-DD') : null)}
                  sx={inputStyles}
                />
              </LocalizationProvider>
              <TextField
                label="Claim Approved"
                value={claim.approvalClaim}
                onChange={(e) => handleClaimChange(index, 'approvalClaim', e.target.value)}
                sx={inputStyles}
              />
            </Box>
          ))}
        </Box>

        {/* <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '45ch' }}>
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
                label="Claim"
                value={claim.premium}
                type='number'
                onChange={(e) => handleClaimChange(index + Math.ceil(claimYears / 2), 'premium', e.target.value)}
                sx={inputStyles}
              />
            </Box>
          ))}
        </Box> */}
      </Box>
    </Box>
    
    <Button size="large"
     sx={ 
      buttonStyles
    }
    variant="contained" color="success" onClick={handleSubmit}>
        Submit
    </Button>
    </Box>
  );
  
};

export default AddGeneral;
