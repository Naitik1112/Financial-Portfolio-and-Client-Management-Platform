import React, { useState, useEffect } from "react";
import { Box, TextField, Button, Stack } from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

import { getStyles } from "../styles/themeStyles";
import { useThemeMode } from "../context/ThemeContext";

const UserDetails = ({ id }) => {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    DOB: null,
    group: "",
    pancard: "",
    contact: "",
  });

  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('jwt');

  
  const { darkMode } = useThemeMode();
  const { containerStyles, containerStyles1 } = getStyles(darkMode);
  
  const { primaryColor, secondaryColor, tertiaryColor, body, inputStyles } = getStyles(darkMode);
  
  // Fetch user data when the component loads
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${backendURL}/api/v1/users/${id}`, {
          method: "GET",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();
        const user = data.data;

        setUserData({
          name: user.name || "",
          email: user.email || "",
          DOB: user.DOB ? dayjs(user.DOB) : null,
          group: user.groupId.name || "",
          pancard: user.pancard || "",
          contact: user.contact || "",
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [id]);

  // Handle form field changes
  const handleChange = (field, value) => {
    setUserData((prevData) => ({ ...prevData, [field]: value }));
  };

  // Save changes and update user data
  const handleSave = async () => {
    try {
      const response = await fetch(`${backendURL}/api/v1/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" , Authorization: `Bearer ${token}`},
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error("Failed to save changes");
      }

      alert("Changes saved successfully!");
    } catch (error) {
      console.error("Error saving changes:", error);
      alert("Failed to save changes");
    }
  };

  return (
    <Box
      sx={{
        width: { 
          xs: '200px',   // 0-599px
          sm: '400px',   // 600-899px
          md: '770px',   // 900-1199px
          lg: '1000px',   // 1200-1535px
          xl: 'max(65%, 830px)' // 1536px+
        },
        borderColor: "#fff",
        marginLeft: "50px",
        display: "flex",
        gap: 4,
        flexDirection: "column",
      }}
    >
      <Box
      sx={{
        width: "70ch",
        borderColor: "#fff",
        display: "flex",
        gap: 4,
        flexDirection: "row",
      }}
    >
      <Box
        sx={{
          width: "35ch",
          borderColor: "#fff",
          display: "flex",
          gap: 4,
          flexDirection: "column",
        }}
      >
        <TextField
          label="Name"
          variant="outlined"
          value={userData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          sx={inputStyles}
        />
        <TextField
          label="Email Id"
          variant="outlined"
          value={userData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          sx={inputStyles}
          InputProps={{ readOnly: true }}
        />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="DOB"
            value={userData.DOB}
            onChange={(value) => handleChange("DOB", value)}
            sx={inputStyles}
          />
        </LocalizationProvider>
      </Box>

      
      <Box
        component="form"
        sx={{
          width: "35ch",
          borderColor: "#fff",
          display: "flex",
          gap: 4,
          flexDirection: "column",
        }}
      >
        <TextField
          label="Group"
          variant="outlined"
          value={userData.group}
          onChange={(e) => handleChange("group", e.target.value)}
          sx={inputStyles}
          InputProps={{ readOnly: true }}
        />
        <TextField
          label="Pancard"
          variant="outlined"
          value={userData.pancard}
          onChange={(e) => handleChange("pancard", e.target.value)}
          sx={inputStyles}
        />
        <TextField
          label="Contact Number"
          variant="outlined"
          value={userData.contact}
          onChange={(e) => handleChange("contact", e.target.value)}
          sx={inputStyles}
        />
      </Box>
      
      
      
    </Box>
    <Stack spacing={2} direction="row">
        <Button size="large" variant="contained"
          sx={{ 
            backgroundImage: secondaryColor, 
            color: '#000', // Text color
            '&:hover': { backgroundImage: tertiaryColor } // Slightly darker gradient on hover
          }}
          onClick={handleSave}>
          Save Changes
        </Button>
      </Stack>
    </Box>
    
  );
};

export default UserDetails;
