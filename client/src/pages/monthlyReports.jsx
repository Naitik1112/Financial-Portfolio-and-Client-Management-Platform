import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import { inputStyles, buttonStyles, containerStyles } from "./../styles/themeStyles";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const type = [
  { label: 'PDF', value: 'pdf' },
  { label: 'XLSX', value: 'excel' },
];

const AddClient = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [downloadFormat, setDownloadFormat] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    if (!startDate || !endDate || !downloadFormat) {
      alert('Please fill all fields!');
      return;
    }
  
    // Convert selected dates to dd/mm format
    const formatDate = (date) => dayjs(date).format('DD/MM');

    const payload = {
      startdate: formatDate(startDate),
      enddate: formatDate(endDate),
      format: downloadFormat.value,
    };
  
    try {
      const response = await fetch('/api/v1/reports/monthlyReport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const blob = await response.blob();
      const fileExtension = downloadFormat.value === 'pdf' ? 'pdf' : 'xlsx';
      const fileName = `Renewal_report.${fileExtension}`;
      const fileUrl = window.URL.createObjectURL(blob);
  
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
        Renewal Reports
      </Typography>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker 
          label={'Start Date'} 
          views={['month', 'day']} 
          value={startDate}
          onChange={(newValue) => setStartDate(newValue)}
          sx={inputStyles} 
        />
      </LocalizationProvider>
      
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker 
          label={'End Date'} 
          views={['month', 'day']} 
          value={endDate}
          onChange={(newValue) => setEndDate(newValue)}
          sx={inputStyles} 
        />
      </LocalizationProvider>

      <Autocomplete
        sx={inputStyles}
        disablePortal
        options={type}
        onChange={(event, value) => setDownloadFormat(value)}
        renderInput={(params) => <TextField {...params} label="Download Format" />}
        componentsProps={{
          paper: {
            sx: {
              bgcolor: "grey", 
              color: "black",  
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
