import React, { useState,useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import { inputStyles, buttonStyles, containerStyles } from "./../styles/themeStyles";

const reportType = [
  { label: 'Life Insurance of Client' },
  { label: 'General Insurance of Client' },
  { label: 'Debts of Client' },
  { label: 'Mutual Funds of Client' },
  { label: 'CashFlow of Client' },
  { label: 'Claims of Client' }
];

const type = [
  { label: 'PDF', value: 'pdf' },
  { label: 'XLSX', value: 'excel' },
];

const AddClient = () => {
  const [holderName, setHolderName] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [downloadFormat, setDownloadFormat] = useState(null);
  const [top100Films, setTop100Films] = useState([]);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    if (!holderName || !selectedReport || !downloadFormat) {
      alert('Please fill all fields!');
      return;
    }
  
    // Determine the API endpoint URL based on the selected report type
    let apiUrl;
    if (selectedReport.label === 'Life Insurance of Client') {
      apiUrl = '/api/v1/reports/policyByClient';
    } else if (selectedReport.label === 'Mutual Funds of Client') {
      apiUrl = '/api/v1/reports/schemeByClient';
    } else if (selectedReport.label === 'General Insurance of Client') {
      apiUrl = '/api/v1/reports/generalPolicyByClient';
    } else if (selectedReport.label === 'Debts of Client') {
      apiUrl = '/api/v1/reports/debtsByClient';
    } else if (selectedReport.label === 'CashFlow of Client'){
      apiUrl = '/api/v1/reports/cashFlowReport'
    } else if (selectedReport.label === 'Claims of Client'){
      apiUrl = '/api/v1/reports/claimsByClient'
    }
    else {
      alert('Invalid report type selected!');
      return;
    }
  
    const payload = {
      name: holderName.label,
      format: downloadFormat.value,
    };
  
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const blob = await response.blob();
      const fileExtension = downloadFormat.value === 'pdf' ? 'pdf' : 'xlsx';
      const fileName = `${holderName.label}_claim_report.${fileExtension}`;
      const fileUrl = window.URL.createObjectURL(blob); // Changed variable name to fileUrl
  
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName;
      a.click();
      window.location.reload();
      alert('Report downloaded successfully!');
    } catch (error) {
      console.error('Error:', error.message);
      alert(`Failed to download report: ${error.message}`);
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
        width: '53ch',
        bgcolor: '#1E1E1E',
        padding: '60px',
        paddingTop: '30px',
        paddingBottom: "30px",
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
        Individual Reports
      </Typography>

      
      <Autocomplete
        sx={inputStyles}
        disablePortal
        options={reportType}
        onChange={(event, value) => setSelectedReport(value)}
        renderInput={(params) => <TextField {...params} label="Report Type" />}
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
        sx={inputStyles}
        disablePortal
        options={top100Films}
        onChange={(event, value) => setHolderName(value)}
        renderInput={(params) => <TextField {...params} label="Holder Name" />}
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
        sx={inputStyles}
        disablePortal
        options={type}
        onChange={(event, value) => setDownloadFormat(value)}
        renderInput={(params) => <TextField {...params} label="Download Format" />}
        componentsProps={{
          paper: {
            sx: {
              bgcolor: "grey", // Background color of the dropdown menu
              color: "black",  // Text color (optional)
            },
          },
        }}
      />

      <Button size="medium" variant="contained" 
        sx={buttonStyles}
        type="submit">
        Submit
      </Button>
    </Box>
  );
};

export default AddClient;
