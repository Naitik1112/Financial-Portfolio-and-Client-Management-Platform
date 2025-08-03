import * as React from 'react';
import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Brightness4, Brightness7, AccountCircle } from '@mui/icons-material';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Cookies from 'js-cookie';
import Hamburger from './../../assets/Hamburger.png';
import Brand from './../../assets/logo2.png';
import axios from 'axios';
import './Navbar.css';
import { useThemeMode } from '../../context/ThemeContext';
import { getStyles } from "../../styles/themeStyles";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Avatar,
  Box,
  IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';

const Navbar = () => {
  const location = useLocation();
  const [jwtExists, setJwtExists] = useState(!!Cookies.get('jwt'));
  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('jwt');
  console.log("backeend url : ",backendURL)
  // User profile state
  const [userProfile, setUserProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  // ✅ Extract BOTH darkMode and toggleTheme here
  const { darkMode, toggleTheme } = useThemeMode();
  const { containerStyles, containerStyles1 } = getStyles(darkMode);
  const {
    primaryColor,
    secondaryColor,
    tertiaryColor,
    fourthColor,
    body,
  } = getStyles(darkMode);

  useEffect(() => {
    setJwtExists(!!localStorage.getItem('jwt'));
  }, [location.pathname]);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${backendURL}/api/v1/admin/getme`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      console.log("user data : \n",response)
      setUserProfile(response.data.data);
      setEditedProfile(response.data.data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const handleProfileClick = () => {
    if (jwtExists) {
      fetchUserProfile();
      setProfileDialogOpen(true);
    }
  };

  const handleProfileClose = () => {
    setProfileDialogOpen(false);
    setEditMode(false);
  };

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleSaveClick = async () => {
    try {
      const response = await axios.patch(
        `${backendURL}/api/v1/admin/editme`,
        editedProfile,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );
      setUserProfile(response.data.data.data);
      setEditMode(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (!confirmLogout) return;

    try {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('jwt');
      setJwtExists(false);
      window.location.href = "/signin";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const [anchorElFinance, setAnchorElFinance] = useState(null);
  const [anchorElReports, setAnchorElReports] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);

  const openFinance = Boolean(anchorElFinance);
  const openReports = Boolean(anchorElReports);
  const openUser = Boolean(anchorElUser);

  const handleClickFinance = (event) => setAnchorElFinance(event.currentTarget);
  const handleClickReports = (event) => setAnchorElReports(event.currentTarget);
  const handleClickUser = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseFinance = () => setAnchorElFinance(null);
  const handleCloseReports = () => setAnchorElReports(null);
  const handleCloseUser = () => setAnchorElUser(null);

  return (
    <nav style={{ background: fourthColor }}>
      <input type="checkbox" id="check" />
      <label htmlFor="check" className="checkbtn">
        <img src={Hamburger} alt="Menu" />
      </label>
      <label className="logo">
        <img src={Brand} alt="Logo" id="Logo_img" />
      </label>

      {/* Theme Toggle Icon */}
      {/* <Button
        onClick={toggleTheme}
        sx={{
          position: 'absolute',
          right: jwtExists ? '80px' : '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#fff',
          minWidth: 'auto',
          borderRadius: '50%',
          p: 1,
          backgroundColor: '#2c2c2c',
          zIndex: 10,
          '&:hover': {
            backgroundColor: '#3c3c3c',
          },
        }}
      >
        {darkMode ? <Brightness7 /> : <Brightness4 />}
      </Button> */}

      {/* User Icon */}
      {jwtExists ? (
        <IconButton
          onClick={handleProfileClick}
          sx={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#fff',
            zIndex: 10,
          }}
        >
          <AccountCircle sx={{ fontSize: 32 }} />
        </IconButton>
      ) : (
        <Box sx={{
          position: 'absolute',
          right: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          gap: '8px',
          zIndex: 10,
        }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => window.location.href = "/signin"}
            sx={{
              color: '#fff',
              borderColor: '#fff',
              '&:hover': {
                borderColor: '#2d4af1ff',
                color: '#2d4af1ff'
              }
            }}
          >
            Login
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => window.location.href = "/signup"}
            sx={{
              backgroundColor: '#2d4af1ff',
              color: '#fff',
              '&:hover': {
                backgroundColor: '#2d4af1ff'
              }
            }}
          >
            Sign Up
          </Button>
        </Box>
      )}

      <ul className="nav-links">
        {/* ... (rest of your existing navbar links) ... */}
      </ul>
      {/* User Profile Dialog */}
      <Dialog 
        open={profileDialogOpen} 
        onClose={handleProfileClose}
        PaperProps={{
          sx: {
            background: '#2a2a2a',
            color: '#ffffff',
            minWidth: '400px',
            borderRadius: '12px'
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ color: '#ffffff' }}>Admin Profile</Typography>
            {!editMode ? (
              <IconButton onClick={handleEditClick} sx={{ color: '#4dabf5' }}>
                <EditIcon />
              </IconButton>
            ) : (
              <IconButton onClick={handleSaveClick} sx={{ color: '#4dabf5' }}>
                <SaveIcon />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {userProfile && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Avatar 
                  sx={{ 
                    width: 80, 
                    height: 80,
                    bgcolor: '#1976d2',
                    fontSize: '2rem'
                  }}
                >
                  {userProfile.adminName?.charAt(0) || 'A'}
                </Avatar>
              </Box>
              
              {editMode ? (
                <>
                  <TextField
                    margin="dense"
                    label="Company Name"
                    name="companyName"
                    fullWidth
                    value={editedProfile.companyName || ''}
                    onChange={handleInputChange}
                    sx={{ 
                      mb: 2,
                      '& .MuiInputBase-root': {
                        color: '#ffffff',
                      },
                      '& .MuiInputLabel-root': {
                        color: '#aaaaaa',
                      },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#555555',
                        },
                        '&:hover fieldset': {
                          borderColor: '#4dabf5',
                        },
                      }
                    }}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                  <TextField
                    margin="dense"
                    label="Admin Name"
                    name="adminName"
                    fullWidth
                    value={editedProfile.adminName || ''}
                    onChange={handleInputChange}
                    sx={{ 
                      mb: 2,
                      '& .MuiInputBase-root': {
                        color: '#ffffff',
                      },
                      '& .MuiInputLabel-root': {
                        color: '#aaaaaa',
                      },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#555555',
                        },
                        '&:hover fieldset': {
                          borderColor: '#4dabf5',
                        },
                      }
                    }}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                  <TextField
                    margin="dense"
                    label="Email"
                    name="email"
                    fullWidth
                    value={editedProfile.email || ''}
                    onChange={handleInputChange}
                    sx={{ 
                      mb: 2,
                      '& .MuiInputBase-root': {
                        color: '#ffffff',
                      },
                      '& .MuiInputLabel-root': {
                        color: '#aaaaaa',
                      },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#555555',
                        },
                        '&:hover fieldset': {
                          borderColor: '#4dabf5',
                        },
                      }
                    }}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </>
              ) : (
                <>
                  <Typography variant="h6" align="center" gutterBottom sx={{ color: '#4dabf5' }}>
                    {userProfile.adminName}
                  </Typography>
                  <Box sx={{ 
                    backgroundColor: '#333333', 
                    p: 2, 
                    borderRadius: '8px',
                    mb: 2
                  }}>
                    <Typography variant="body1" gutterBottom>
                      <Box component="span" sx={{ color: '#aaaaaa', mr: 1 }}>Company:</Box>
                      <Box component="span" sx={{ color: '#ffffff' }}>{userProfile.companyName}</Box>
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <Box component="span" sx={{ color: '#aaaaaa', mr: 1 }}>Email:</Box>
                      <Box component="span" sx={{ color: '#ffffff' }}>{userProfile.email}</Box>
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <Box component="span" sx={{ color: '#aaaaaa', mr: 1 }}>Member Since:</Box>
                      <Box component="span" sx={{ color: '#ffffff' }}>
                        {new Date(userProfile.createdAt).toLocaleDateString()}
                      </Box>
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #444444' }}>
          <Button 
            onClick={handleLogout} 
            sx={{
              color: '#ff6b6b',
              '&:hover': {
                backgroundColor: 'rgba(255, 107, 107, 0.1)'
              }
            }}
          >
            Logout
          </Button>
          
          {editMode && (
            <Button 
              onClick={handleSaveClick}
              sx={{
                backgroundColor: '#4caf50',
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: '#388e3c'
                }
              }}
            >
              Save
            </Button>
          )}
          
          <Button 
            onClick={handleProfileClose}
            sx={{
              backgroundColor: '#1976d2',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#1565c0'
              }
            }}
          >
            {editMode ? 'Cancel' : 'Close'}
          </Button>
        </DialogActions>
      </Dialog>
    </nav>
  );
};

export default Navbar;