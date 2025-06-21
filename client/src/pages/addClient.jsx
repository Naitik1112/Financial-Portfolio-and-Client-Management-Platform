import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Typography from '@mui/material/Typography';
import { inputStyles, buttonStyles, containerStyles } from "./../styles/themeStyles"; 

const AddClient = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [DOB, setDOB] = useState(null);
  const [group, setGroup] = useState('');
  const [contact, setcontact] = useState('');
  const [pancard, setpancard] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    let name1
    name1 = name.split(" ")[0]; 
    const password = name1 + name.length + "123456";
    const passwordConfirm = password;
    console.log("DOB : ",DOB)
    const clientData = {
      name,
      email,
      DOB,
      group,
      contact,
      pancard,
      password,
      passwordConfirm,
    };

    const backendURL = import.meta.env.VITE_BACKEND_URL;

    try {
      const response = await fetch(`${backendURL}/api/v1/users/addUser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });
  
      console.log('Response status:', response.status);
  
      if (response.ok) {
        alert('Client added successfully');
      } else {
        const responseText = await response.text();  // Get response as plain text
        console.log('Response body:', responseText);
        if (responseText) {
          try {
            const error = JSON.parse(responseText);
            console.error('Error:', error);
          } catch (e) {
            console.error('Error: Failed to parse error response', e);
          }
        } else {
          console.error('Error: No response body');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error occurred while submitting the form');
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
        width: '45ch',
        marginTop: '120px',
        padding:'40px',
        paddingTop:'25px',
        paddingBottom:'10px',
        ...containerStyles
      }}
    >
      <Typography
        sx={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#fff',
          textAlign: 'center',
          marginBottom: '0px',
        }}
      >
        Add Client
      </Typography>
      <TextField
        id="outlined-basic-1"
        label="Name"
        variant="outlined"
        value={name}
        onChange={(e) => setName(e.target.value)}
        sx={inputStyles}
      />
      <TextField
        id="outlined-basic-2"
        label="Email"
        variant="outlined"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        sx={inputStyles}
      />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          label="Date of Birth"
          value={DOB}
          onChange={(newValue) => setDOB(newValue)}
          sx={inputStyles}
        />
      </LocalizationProvider>
      <TextField
        id="outlined-basic-4"
        label="Group"
        variant="outlined"
        value={group}
        onChange={(e) => setGroup(e.target.value)}
        sx={inputStyles}
      />
      <TextField
        id="outlined-basic-5"
        label="Contact Number"
        variant="outlined"
        value={contact}
        onChange={(e) => setcontact(e.target.value)}
        sx={inputStyles}
      />
      <TextField
        id="outlined-basic-6"
        label="Pancard Number"
        variant="outlined"
        value={pancard}
        onChange={(e) => setpancard(e.target.value)}
        sx={inputStyles}
      />
      <Button
        size="medium"
        variant="contained"
        color="success"
        type="submit"
        sx={buttonStyles}
      >
        Submit
      </Button>
    </Box>
  );
};

export default AddClient;
