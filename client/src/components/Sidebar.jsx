import React , { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Home,
  Person,
  People,
  AddCircle,
  CalendarToday,
  Logout,
  BusinessCenter,
  Assignment,
  AccountBalance,
  AddBox,
  Dashboard,
  Group,
} from '@mui/icons-material';
import { NavLink, useNavigate } from 'react-router-dom';

import { useThemeMode } from '../context/ThemeContext';
import { getStyles } from "../styles/themeStyles";

import {  Assessment, InsertChart, Timeline } from '@mui/icons-material';

const menuItems = [
  { text: 'Dashboard', icon: <Home />, path: '/' },
  { text: 'Clients', icon: <People />, path: '/myClient' },
  { text: 'Reports', icon: <Assessment/>, path: '/reports' },
  // { text: 'Individual Report', icon: <Assessment />, path: '/individualReport' },     // 📊 Assessment = suitable for individual report
  // { text: 'Group Reports', icon: <InsertChart />, path: '/groupReport' },             // 📈 InsertChart = good for grouped data
  // { text: 'Revewal Report', icon: <Timeline />, path: '/monthlyCalender' },           // 🕒 Timeline = good for time-based report
  { text: 'Add Client', icon: <AddCircle />, path: '/addClient' },
  { text: 'Add Insurance', icon: <BusinessCenter />, path: '/addInsurance' },
  { text: 'Add General', icon: <AddBox />, path: '/addGeneral' },         // 🕒 Timeline = good for time-based report
  { text: 'Add Mutual Fund', icon: <AddCircle />, path: '/addPolicy' },
  { text: 'Investment & More', icon: <Dashboard />, path: '/investmentmore' },
  { text: 'Group Management', icon: <Group/>, path: '/groupManagement' },
];


const Sidebar = () => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const { darkMode, toggleTheme } = useThemeMode();
  const { containerStyles, containerStyles1 } = getStyles(darkMode);
    const {
      primaryColor,
      secondaryColor,
      tertiaryColor,
      fourthColor,
      fontColor,
      body,
    } = getStyles(darkMode);

  const handleLogout = () => {
    const confirm = window.confirm("Are you sure you want to logout?");
    if (confirm) {
      localStorage.removeItem('jwt');
      navigate('/signin');
    }
  };


  return (
    <Box
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      sx={{
        width: expanded ? '260px' : '60px',
        height: 'calc(100vh - 60px)', // make space for navbar
        bgcolor: darkMode
                  ? fourthColor
                  : body, // dark navy
        color: 'white',
        position: 'fixed',
        top: '60px',
        left: 0,
        gap: '10px',
        transition: 'width 0.3s ease-in-out',
        overflowX: 'hidden',
        zIndex: 1000,
        pt: 1,
      }}
    >
      <List>
        {menuItems.map((item) => (
          <NavLink
            key={item.text}
            to={item.path}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Tooltip title={!expanded ? item.text : ''} placement="right">
              <ListItem
                button
                sx={{
                  px: 2,
                  py: 1.5,
                  '&:hover': { bgcolor: '#1f2937' },
                }}
              >
                <ListItemIcon sx={{ color: 'white', minWidth: '50px' }}>
                  {React.cloneElement(item.icon, { fontSize: 'medium' })}  {/* Can be 'large' */}
                </ListItemIcon>
                {expanded && (
                  <ListItemText
                    primary={item.text}
                    sx={{ opacity: 1, transition: 'opacity 0.3s' }}
                  />
                )}
              </ListItem>
            </Tooltip>
          </NavLink>
        ))}
      </List>

      <Divider sx={{ bgcolor: '#374151', my: 1 }} />

      <List>
      <Tooltip title={!expanded ? 'Logout' : ''} placement="right">
        <ListItem
          button
          onClick={handleLogout}
          sx={{
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            '&:hover': { bgcolor: '#1f2937' },
          }}
        >
          <ListItemIcon sx={{ color: 'white' }}>
            <Logout fontSize="large" />
          </ListItemIcon>
          {expanded && (
            <ListItemText
              primary="Logout"
              sx={{ opacity: 1, transition: 'opacity 0.3s' }}
            />
          )}
        </ListItem>
      </Tooltip>
    </List>

    </Box>
  );
};

export default Sidebar;
