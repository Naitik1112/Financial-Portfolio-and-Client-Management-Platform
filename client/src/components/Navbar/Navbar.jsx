// import { useState } from 'react'
import * as React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { NavLink } from 'react-router-dom'
import Hamburger from './../../assets/Hamburger.png'
import Brand from './../../assets/logo.png'
import "./Navbar.css"; // Assuming you have a CSS file for styling

const Navbar = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
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
          <NavLink to="/" className="menu">
            Home
          </NavLink>
        </li>
        <li>
        <Button
          id="basic-button"
          aria-controls={open ? 'basic-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick}
          sx={{
            color: '#fff', // Set the text color to white
            backgroundColor: 'transparent', // Optional: Transparent background
            '&:hover': {
              backgroundColor: '#444', // Optional: Add hover background
            },
          }}
        >
          Add Policy / Insurance
        </Button>
          <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              'aria-labelledby': 'basic-button',
            }}
          >
            <MenuItem onClick={() => (window.location.href = "/addPolicy")}>Add Policy</MenuItem>
            <MenuItem onClick={() => (window.location.href = "/addInsurance")}>Add Insurance</MenuItem>
          </Menu>
        </li>
        <li>
          <NavLink to="/myClient" className="tip">
            My Client
          </NavLink>
        </li>
        <li id="sign_Up">
          <NavLink to="/signup">Sign Up</NavLink>
        </li>
        <li id="sign_In">
          <NavLink to="/signin">Sign In</NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
