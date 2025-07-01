import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Typography from '@mui/material/Typography';

import { getStyles } from "../styles/themeStyles";
import { useThemeMode } from "../context/ThemeContext";



const AddClient = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [DOB, setDOB] = useState(null);
  const [group, setGroup] = useState('');
  const [contact, setcontact] = useState('');
  const [pancard, setpancard] = useState('');
  
  const { darkMode } = useThemeMode();
  const { containerStyles, containerStyles1 , containerStyles2} = getStyles(darkMode);
  const {
    inputStyles,
    buttonStyles,
    primaryColor,
    secondaryColor,
    tertiaryColor,
    fourthColor,
    fontColor,
    body,
    background,
    background1,
    background2,
  } = getStyles(darkMode);
  

  const handleSubmit = async (e) => {
    e.preventDefault();

    let name1 = name.split(" ")[0]; 
    const password = name1 + name.length + "123456";
    const passwordConfirm = password;

    const clientData = {
      name,
      email,
      DOB,
      contact,
      pancard,
      password,
      passwordConfirm,
    };

    const backendURL = import.meta.env.VITE_BACKEND_URL;
    const token = localStorage.getItem('jwt');

    try {
      const response = await fetch(`${backendURL}/api/v1/users/addUser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(clientData),
      });

      if (response.ok) {
        alert('Client added successfully');
        window.location.href = "/myClient"; // ✅ Redirect on success
      } else {
        const responseText = await response.text();
        if (responseText) {
          try {
            const error = JSON.parse(responseText);
            alert(error.message || 'Something went wrong!');
          } catch (e) {
            alert('Failed to parse error response.');
          }
        } else {
          alert('No response body received.');
        }

        // 🔁 Reset form fields
        setName('');
        setEmail('');
        setDOB('');
        setcontact('');
        setpancard('');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error occurred while submitting the form');

      // 🔁 Reset form fields
      setName('');
      setEmail('');
      setDOB('');
      setcontact('');
      setpancard('');
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
        width: '60ch',
        marginTop: '120px',
        padding:'40px',
        paddingTop:'25px',
        paddingBottom:'10px',
        ...containerStyles1
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
        SUBMIT
      </Button>
    </Box>
  );
};

export default AddClient;
