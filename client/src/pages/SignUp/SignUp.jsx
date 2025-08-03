import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./../SignIn/Signin.css";
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

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    companyName: "",
    adminName: "",
    email: "",
    password: "",
    passwordConfirm: ""
  });
  const [alertMessage, setAlertMessage] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);
  const { darkMode } = useThemeMode();
  const [isLoading, setIsLoading] = useState(false);

  const { body, fontColor, paperBg, inputStyles, buttonStyles, containerStyles, containerStyles1, containerStyles2 } = getStyles(darkMode);

  const navigate = useNavigate();
  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.passwordConfirm) {
      setAlertMessage("Passwords do not match!");
      setAlertOpen(true);
      return;
    }
    signupUser(formData);
  };

  const loginDemoUser = () => {
    const demoData = {
      email: "ajay@gmail.com",
      password: "123456789",
    };
    loginUser(demoData);
  };

  const loginUser = (userData) => {
    setIsLoading(true);
    setAlertMessage("Your data is getting submitted...");
    setAlertOpen(true);

    axios
      .post(`${backendURL}/api/v1/admin/login`, userData, { withCredentials: true })
      .then((response) => {
        const token = response.data.token;
        localStorage.setItem('jwt', token);
        setIsLoading(false);
        setAlertMessage("Demo User Login successful!");
        setTimeout(() => {
          setAlertOpen(false);
          navigate("/");
        }, 2000);
      })
      .catch((error) => {
        console.error(error);
        setIsLoading(false);
        if (error.response && error.response.status === 409) {
          setAlertMessage("Account already exists. Redirecting to login...");
          setTimeout(() => {
            setAlertOpen(false);
            navigate("/signin");
          }, 3000);
        } else {
          setAlertMessage("SignUp failed. Please try again.");
          setTimeout(() => {
            setAlertOpen(false);
          }, 3000);
        }
      });
  };

  const signupUser = (userData) => {
    setIsLoading(true);
    setAlertMessage("Your data is getting submitted...");
    setAlertOpen(true);

    axios
      .post(`${backendURL}/api/v1/admin/signup`, userData, { withCredentials: true })
      .then((response) => {
        const token = response.data.token;
        localStorage.setItem('jwt', token);
        setIsLoading(false);
        setAlertMessage("SignUp successful!");
        setTimeout(() => {
          setAlertOpen(false);
          navigate("/");
        }, 2000);
      })
      .catch((error) => {
        console.error(error);
        setIsLoading(false);
        if (error.response && error.response.status === 409) {
          setAlertMessage("Account already exists. Redirecting to login...");
          setTimeout(() => {
            setAlertOpen(false);
            navigate("/signin");
          }, 3000);
        } else {
          setAlertMessage("SignUp failed. Please try again.");
          setTimeout(() => {
            setAlertOpen(false);
          }, 3000);
        }
      });
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setAlertMessage("Signing up with Google...");
    setAlertOpen(true);

    try {
      const response = await axios.post(`${backendURL}/api/v1/admin/google-auth`, {
        credential: credentialResponse.credential,
        isSignup: true // Flag to indicate this is a signup flow
      }, { withCredentials: true });

      const token = response.data.token;
      localStorage.setItem('jwt', token);
      setAlertMessage("Google signup successful!");
      setIsLoading(false);
      setTimeout(() => {
        setAlertOpen(false);
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error(error);
      setAlertMessage(error.response?.data?.message || "Google signup failed. Please try again.");
      setIsLoading(false);
      setTimeout(() => {
        setAlertOpen(false);
      }, 3000);
    }
  };

  const handleGoogleFailure = () => {
    setAlertMessage("Google signup failed. Please try again.");
    setAlertOpen(true);
    setTimeout(() => {
      setAlertOpen(false);
    }, 3000);
  };

  const handleLoginRedirect = () => {
    navigate("/signin");
  };

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div className="container" style={{ ...containerStyles1, maxWidth: "600px", width: "60ch" , marginTop : '80px' }}>
        {/* Alert Box */}
        <Box sx={{ width: "100%" }}>
          <Collapse in={alertOpen}>
            <Alert
              severity={isLoading ? "info" : alertMessage.includes("successful") ? "success" : "error"}
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

        {/* SignUp Form */}
        <form onSubmit={handleSubmit}>
          <h1>SignUp</h1>
          
          <Box sx={{ marginBottom: '20px', marginTop: '40px' }}>
            <TextField
              label="Company Name"
              name="companyName"
              variant="outlined"
              fullWidth
              required
              value={formData.companyName}
              onChange={handleChange}
              sx={inputStyles}
            />
          </Box>

          <Box sx={{ marginBottom: '20px' }}>
            <TextField
              label="Admin Name"
              name="adminName"
              variant="outlined"
              fullWidth
              required
              value={formData.adminName}
              onChange={handleChange}
              sx={inputStyles}
            />
          </Box>

          <Box sx={{ marginBottom: '20px' }}>
            <TextField
              label="Email"
              name="email"
              variant="outlined"
              fullWidth
              required
              value={formData.email}
              onChange={handleChange}
              sx={inputStyles}
            />
          </Box>

          <Box sx={{ marginBottom: '20px' }}>
            <TextField
              label="Password"
              name="password"
              variant="outlined"
              type="password"
              fullWidth
              required
              value={formData.password}
              onChange={handleChange}
              sx={inputStyles}
            />
          </Box>

          <Box sx={{ marginBottom: '40px' }}>
            <TextField
              label="Confirm Password"
              name="passwordConfirm"
              variant="outlined"
              type="password"
              fullWidth
              required
              value={formData.passwordConfirm}
              onChange={handleChange}
              sx={inputStyles}
            />
          </Box>

          <Button type="submit" variant="contained" fullWidth sx={buttonStyles}>
            SignUp
          </Button>

          {/* Demo User SignUp Button */}
          <Button 
            onClick={loginDemoUser}
            variant="outlined" 
            fullWidth 
            sx={{...buttonStyles, marginTop: '10px'}}
          >
            Login as Demo User
          </Button>

          {/* Google Sign-Up Button */}
            <div style={{ marginTop: '16px', borderRadius: '10px', overflow: 'hidden', width: '100%' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleFailure}
                text="signup_with"
                shape="rectangular"
                size="large"
                width="100%"
              />
            </div>

          <div className="register-link">
            <p>
              Already have an account? 
              <a href="#" onClick={handleLoginRedirect} style={{ marginLeft: '5px', cursor: 'pointer' }}>
                Login here!
              </a>
            </p>
          </div>
        </form>
      </div>
    </GoogleOAuthProvider>
  );
};

export default SignUpPage;