import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Signin.css";
import * as React from "react";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";
import { Stack } from "@mui/material";
import TextField from "@mui/material/TextField";
import axios from "axios";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

import { getStyles } from "../../styles/themeStyles";
import { useThemeMode } from "../../context/ThemeContext";

const LoginPage = () => {
  const [email, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);
  const { darkMode } = useThemeMode();
  const [isLoading, setIsLoading] = useState(false);
  const { body, fontColor, paperBg, inputStyles, buttonStyles, containerStyles, containerStyles1, containerStyles2 } = getStyles(darkMode);

  const navigate = useNavigate();
  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleSubmit = (e) => {
    e.preventDefault();
    loginUser(email, password);
  };

  const loginDemoUser = () => {
    const demoEmail = 'demo@gmail.com';
    const demoPassword = 'demo@123';
    loginUser(demoEmail, demoPassword);
  };

  const loginUser = (email, password) => {
    setIsLoading(true);
    setAlertMessage("Your data is getting submitted...");
    setAlertOpen(true);

    axios
      .post(`${backendURL}/api/v1/admin/login`, { email, password }, { withCredentials: true })
      .then((response) => {
        const token = response.data.token;
        localStorage.setItem('jwt', token);
        setAlertMessage("Login successful!");
        setIsLoading(false);
        setTimeout(() => {
          setAlertOpen(false);
          navigate("/");
        }, 2000);
      })
      .catch((error) => {
        console.error(error);
        setAlertMessage("Invalid email or password. Please try again.");
        setIsLoading(false);
        setTimeout(() => {
          setAlertOpen(false);
        }, 3000);
      });
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setAlertMessage("Signing in with Google...");
    setAlertOpen(true);

    try {
      const response = await axios.post(`${backendURL}/api/v1/admin/google-auth`, {
        credential: credentialResponse.credential
      }, { withCredentials: true });

      const token = response.data.token;
      localStorage.setItem('jwt', token);
      setAlertMessage("Google login successful!");
      setIsLoading(false);
      setTimeout(() => {
        setAlertOpen(false);
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error(error);
      setAlertMessage("Google login failed. Please try again.");
      setIsLoading(false);
      setTimeout(() => {
        setAlertOpen(false);
      }, 3000);
    }
  };

  const handleGoogleFailure = () => {
    setAlertMessage("Google login failed. Please try again.");
    setAlertOpen(true);
    setTimeout(() => {
      setAlertOpen(false);
    }, 3000);
  };

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div className="container" style={{ ...containerStyles1, maxWidth: "600px", width: "60ch" }}>
        {/* Alert Box */}
        <Box sx={{ width: "100%" }}>
          <Collapse in={alertOpen}>
            <Alert
              severity={isLoading ? "info" : alertMessage === "Login successful!" || alertMessage === "Google login successful!" ? "success" : "error"}
              action={
                !isLoading && (
                  <IconButton
                    aria-label="close"
                    color="inherit"
                    size="small"
                    onClick={() => setAlertOpen(false)}
                  >
                    <CloseIcon fontSize="inherit" />
                  </IconButton>
                )
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
          <Box sx={{ marginBottom: '20px', marginTop: '40px' }}>
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

          <Box sx={{ marginBottom: '40px', marginTop: '20px' }}>
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

          <div className="remember-forgot">
            <a href="#">Forgot password?</a>
          </div>

          <Button type="submit" variant="contained" fullWidth sx={buttonStyles}>
            Login
          </Button>

          {/* Demo User Login Button */}
          <Button 
            onClick={loginDemoUser}
            variant="outlined" 
            fullWidth 
            sx={{...buttonStyles, marginTop: '10px'}}
          >
            Login as Demo User
          </Button>

          {/* Google Sign-In Button */}
          <div style={{ marginTop: '8px', borderRadius: '10px', overflow: 'hidden', width: '100%' }}>
            
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleFailure}
              text="continue_with"
              shape="rectangular"
              size="large"
              width="100%"
            />
          </div>

          <div className="register-link">
            <p>
              Do not have an account? <a href="/signup">Register here!</a>
            </p>
          </div>
        </form>
      </div>
    </GoogleOAuthProvider>
  );
};

export default LoginPage;