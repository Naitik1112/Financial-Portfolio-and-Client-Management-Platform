import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import "./Signin.css"; // Ensure you have the appropriate CSS file
import * as React from "react";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";
import { Stack } from "@mui/material";
import TextField from "@mui/material/TextField"; // Import MUI TextField
import axios from "axios";

import { getStyles } from "../../styles/themeStyles";
import { useThemeMode } from "../../context/ThemeContext";

const LoginPage = () => {
  const [email, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);
  const { darkMode } = useThemeMode();
  const { body, fontColor, paperBg, inputStyles, buttonStyles, containerStyles, containerStyles1, containerStyles2 } = getStyles(darkMode);

  const navigate = useNavigate(); // Initialize useNavigate

  const backendURL = import.meta.env.VITE_BACKEND_URL;
  
  console.log(backendURL);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Call the backend API to login
    axios
      .post(`${backendURL}/api/v1/users/login`, { email, password }, { withCredentials: true })
      .then((response) => {
        // Store JWT in localStorage
        const token = response.data.token;
        localStorage.setItem('jwt', token);

        // Show success message
        setAlertMessage("Login successful!");
        setAlertOpen(true);

        setTimeout(() => {
          setAlertOpen(false); // Hide the alert
          navigate("/"); // Redirect to the homepage
        }, 2000);
      })
      .catch((error) => {
        // Handle error response
        console.error(error);
        setAlertMessage("Invalid email or password. Please try again.");
        setAlertOpen(true);

        setTimeout(() => {
          setAlertOpen(false); // Hide the alert
        }, 3000);
      });
  };

  return (
    <div className="container" style={containerStyles1}>
      {/* Alert Box */}
      <Box sx={{ width: "100%" }}>
        <Collapse in={alertOpen}>
          <Alert
            severity={alertMessage === "Login successful!" ? "success" : "error"}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => setAlertOpen(false)}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{ mb: 2 }}
          >
            {alertMessage}
          </Alert>
        </Collapse>
      </Box>

      {/* Login Form */}
      <form onSubmit={handleSubmit}>
        <h1>Login</h1>
        <Box
          sx={{
            marginBottom: '20px',
            marginTop:'40px'
          }}
        >
          <TextField
              label="Email"
              variant="outlined"
              fullWidth
              required
              value={email}
              onChange={(e) => setUsername(e.target.value)}
              sx={inputStyles}
            />
        </Box>

        <Box
          sx={{
            marginBottom: '40px',
            marginTop:'20px'
          }}
        >
          <TextField
              label="Password"
              variant="outlined"
              type="password"
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={inputStyles}
            />
        </Box>

        <div className="">
          
        </div>

        <div className="remember-forgot">
          <a href="#">Forgot password?</a>
        </div>

        <Button type="submit" variant="contained" fullWidth sx={buttonStyles}>
          Login
        </Button>

        <div className="register-link">
          <p>
            Do not have an account? <a href="#">Register here!</a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
