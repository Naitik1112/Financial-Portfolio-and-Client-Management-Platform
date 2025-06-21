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
  { label: 'Life Insurance of Group' }, 
  { label: 'General Insurance of Group' },
  { label: 'Debts of Group' },
  { label: 'Mutual Funds of Group' }
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

  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('jwt');

  useEffect(() => {
    const fetchUserNames = async () => {
      try {
        const response = await fetch(`${backendURL}/api/v1/users/` , {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
        });
        const data = await response.json();
          // Log to check response structure

        // Access nested array and map the user names
        if (data?.data?.data) {
            const userNames = [...new Set(data.data.data.map((user) => user.group))].map((group) => ({ label: group }));
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
    if (selectedReport.label === 'Life Insurance of Group') {
      apiUrl = `${backendURL}/api/v1/reports/policyByGroup`;
    } else if (selectedReport.label === 'Mutual Funds of Group') {
      apiUrl = `${backendURL}/api/v1/reports/schemeByGroup`;
    } else if (selectedReport.label === 'General Insurance of Group') {
      apiUrl = `${backendURL}/api/v1/reports/generalPolicyByGroup`;
    } else if (selectedReport.label === 'Debts of Group') {
      apiUrl = `${backendURL}/api/v1/reports/debtsByGroup`;
    }
    else {
      alert('Invalid report type selected!');
      return;
    }
    console.log("GroupName", holderName.label)
    const payload = {
      groupName: holderName.label,
      format: downloadFormat.value,
    };
    console.log(payload)
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const blob = await response.blob();
      const fileExtension = downloadFormat.value === 'pdf' ? 'pdf' : 'xlsx';
      const fileName = `${holderName.label}_Group_Report.${fileExtension}`;
      const fileUrl = window.URL.createObjectURL(blob); // Changed variable name to fileUrl
  
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(fileUrl);
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
        width: '53ch',
        bgcolor: '#1E1E1E',
        padding: '50px',
        borderRadius: '30px',
        ...containerStyles
      }}
    >
      <Typography
        sx={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#fff',
          textAlign: 'center',
          marginBottom: '10px',
        }}
      >
        Group Reports
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
        renderInput={(params) => <TextField {...params} label="Group Name" />}
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
