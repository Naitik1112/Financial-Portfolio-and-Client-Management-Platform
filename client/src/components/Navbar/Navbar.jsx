import * as React from 'react';
import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Brightness4, Brightness7 } from '@mui/icons-material';
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

const Navbar = () => {
  const location = useLocation();
  const [jwtExists, setJwtExists] = useState(!!Cookies.get('jwt'));
  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('jwt');

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

  const openFinance = Boolean(anchorElFinance);
  const openReports = Boolean(anchorElReports);

  const handleClickFinance = (event) => setAnchorElFinance(event.currentTarget);
  const handleClickReports = (event) => setAnchorElReports(event.currentTarget);
  const handleCloseFinance = () => setAnchorElFinance(null);
  const handleCloseReports = () => setAnchorElReports(null);

  return (
    <nav  style={{ background: fourthColor}}>
      <input type="checkbox" id="check" />
      <label htmlFor="check" className="checkbtn">
        <img src={Hamburger} alt="Menu" />
      </label>
      <label className="logo">
        <img src={Brand} alt="Logo" id="Logo_img" />
      </label>

      {/* ✅ Theme Toggle Icon */}
      <Button
        onClick={toggleTheme}
        sx={{
          position: 'absolute',
          right: '16px',
          top: '50%',                  // Center vertically
          transform: 'translateY(-50%)', // Center offset
          color: '#fff',
          minWidth: 'auto',
          borderRadius: '50%',
          p: 1,
          backgroundColor: '#2c2c2c',
          zIndex: 10,                  // Ensure it's above nav items
          '&:hover': {
            backgroundColor: '#3c3c3c',
          },
        }}

      >
        {darkMode ? <Brightness7 /> : <Brightness4 />}
      </Button>

      <ul className="nav-links">
        <li>
          <NavLink to="/" className={`menu ${location.pathname === '/' ? 'active' : ''}`}>
            Home
          </NavLink>
        </li>
        <li>
          <NavLink to="/redemption" className={`menu ${location.pathname === '/redemption' ? 'active' : ''}`}>
            Redemption
          </NavLink>
        </li>
        <li>
          <Button
            id="finance-button"
            aria-controls={openFinance ? 'finance-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={openFinance ? 'true' : undefined}
            onClick={handleClickFinance}
            sx={{
              color: location.pathname.includes('/add') ? '#d2b577' : '#fff',
              backgroundColor: 'transparent',
              '&:hover': { color: '#d2b577' },
            }}
          >
            Investment
          </Button>
          <Menu
            id="finance-menu"
            anchorEl={anchorElFinance}
            open={openFinance}
            onClose={handleCloseFinance}
            MenuListProps={{ 'aria-labelledby': 'finance-button' }}
            sx={{ '& .MuiPaper-root': { bgcolor: 'grey.500' } }}
          >
            <MenuItem onClick={() => (window.location.href = "/addPolicy")}>Mutual Fund</MenuItem>
            <MenuItem onClick={() => (window.location.href = "/addInsurance")}>Life Insurance</MenuItem>
            <MenuItem onClick={() => (window.location.href = "/addGeneral")}>General Insurance</MenuItem>
            <MenuItem onClick={() => (window.location.href = "/addFixedDeposit")}>Fixed Deposit</MenuItem>
          </Menu>
        </li>
        <li>
          <Button
            id="reports-button"
            aria-controls={openReports ? 'reports-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={openReports ? 'true' : undefined}
            onClick={handleClickReports}
            sx={{
              color: location.pathname.includes('Report') ? '#d2b577' : '#fff',
              backgroundColor: 'transparent',
              '&:hover': { color: '#d2b577' },
            }}
          >
            Reports
          </Button>
          <Menu
            id="reports-menu"
            anchorEl={anchorElReports}
            open={openReports}
            onClose={handleCloseReports}
            MenuListProps={{ 'aria-labelledby': 'reports-button' }}
            sx={{ '& .MuiPaper-root': { bgcolor: 'grey.500' } }}
          >
            <MenuItem onClick={() => (window.location.href = "/individualReport")}>Individual Report</MenuItem>
            <MenuItem onClick={() => (window.location.href = "/groupReport")}>Group Report</MenuItem>
            <MenuItem onClick={() => (window.location.href = "/monthlyCalender")}>Renewal Reports</MenuItem>
          </Menu>
        </li>
        <li>
          <NavLink to="/myClient" className={`tip ${location.pathname === '/myClient' ? 'active' : ''}`}>
            My Clients
          </NavLink>
        </li>
        <li>
          <NavLink to="/investmentmore" className={`tip ${location.pathname === '/investmentmore' ? 'active' : ''}`}>
            Investment and More
          </NavLink>
        </li>
        <li>
          {jwtExists ? (
            <NavLink
              onClick={handleLogout}
              style={{
                color: 'white',
                textDecoration: 'none',
                transition: 'color 0.3s ease',
              }}
              onMouseEnter={(e) => (e.target.style.color = 'rgb(171, 146, 83)')}
              onMouseLeave={(e) => (e.target.style.color = 'white')}
            >
              LOGOUT
            </NavLink>
          ) : (
            <NavLink to="/signin" className={location.pathname === '/signin' ? 'active' : ''}>
              SIGN IN
            </NavLink>
          )}
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
