import * as React from 'react';
import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Cookies from 'js-cookie'; // Import js-cookie to handle JWT
import Hamburger from './../../assets/Hamburger.png';
import Brand from './../../assets/logo1.png';
import "./Navbar.css"; // Assuming you have a CSS file for styling

const Navbar = () => {
  const location = useLocation();
  const [jwtExists, setJwtExists] = useState(!!Cookies.get('jwt'));

  useEffect(() => {
    // Update JWT state when route changes
    setJwtExists(!!Cookies.get('jwt'));
  }, [location.pathname]);

  const handleLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    
    if (!confirmLogout) {
      return; // Exit the function if the user cancels
    }
  
    try {
      const response = await fetch("api/v1/users/logout", {
        method: "GET",
        credentials: "include", // Ensures cookies are sent with the request
      });
  
      if (response.ok) {
        Cookies.remove("jwt"); // Remove JWT from cookies
        setJwtExists(false);
        window.location.href = "/signin"; // Redirect to sign-in page
      } else {
        console.error("Logout failed");
      }
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
    <nav>
      <input type="checkbox" id="check" />
      <label htmlFor="check" className="checkbtn">
        <i className="fas fa-bars"></i>
        <img src={Hamburger} alt="Menu" />
      </label>
      <label className="logo">
        <img src={Brand} alt="Logo" id="Logo_img" />
      </label>
      <ul>
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
              color: location.pathname.includes('/add') ? '#d2b577' : '#fff', // Highlight when active
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
              color: location.pathname.includes('Report') ? '#d2b577' : '#fff', // Highlight when active
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
          {jwtExists ? (
            // <button onClick={handleLogout} className="logout-btn">LOGOUT</button>
            <NavLink 
            onClick={handleLogout} 
            style={{ 
              color: 'white', 
              textDecoration: 'none',
              transition: 'color 0.3s ease'
            }} 
            onMouseEnter={(e) => (e.target.style.color = 'rgb(171, 146, 83)')}
            onMouseLeave={(e) => (e.target.style.color = 'white')} >LOGOUT</NavLink>
          ) : (
            <NavLink to="/signin" className={location.pathname === '/signin' ? 'active' : ''}>SIGN IN</NavLink>
          )}
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
