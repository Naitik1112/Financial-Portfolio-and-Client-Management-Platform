import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  useMediaQuery,
  useTheme,
  Paper
} from '@mui/material';

import { getStyles } from '../styles/themeStyles';
import { useThemeMode } from '../context/ThemeContext';
import GroupReport from './../components/GroupReport'
import IndividualReport from './../components/IndividualReport'
import RenewalReport from './../components/RenewalReport'

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `tab-${index}`,
    'aria-controls': `tabpanel-${index}`,
  };
}

const ResponsiveTabsPage = () => {
  const { darkMode } = useThemeMode(); // ✅ now inside component
  const {
    containerStyles,
    containerStyles1,
    containerStyles2,
    buttonStyles,
    inputStyles,
    fontColor,
    background,
    background1,
    background2,
    background3,
    secondaryColor,
    fourthColor,
    primaryColor,
    tertiaryColor,
  } = getStyles(darkMode);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const tabContents = [
    <IndividualReport/>,
    <GroupReport/>,
    <RenewalReport/>
  ];

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      height: '600px',
      maxHeight: 'max(80%,600px)',
      backgroundColor: background1,
      color: fontColor,
      p: isMobile ? 1 : 3,
      mt: "90px",
      borderRadius: '20px'
    }}>
      {/* Tabs Section */}
      <Paper sx={{
        // ...(isMobile ? {} : containerStyles1),
        mr: isMobile ? 0 : 2,
        mb: isMobile ? 2 : 0,
        width: isMobile ? '100%' : '250px',
        flexShrink: 0,
        overflow: 'hidden',
        backgroundColor: fourthColor,
        borderRadius: '14px',
        p: 1,
        // border: `4px solid ${background1}`,
      }}>
        <Tabs
          orientation={isMobile ? 'horizontal' : 'vertical'}
          variant="scrollable"
          value={value}
          onChange={handleChange}
          aria-label="Responsive tabs"
          sx={{
            '& .MuiTabs-indicator': {
              left: isMobile ? 0 : 'auto'
            },
            '.MuiTab-root': {
              color: '#aaa',
              alignItems: 'flex-start',
              textAlign: 'left',
              px: 3,
              py: 2,
            },
            '.Mui-selected': {
              color: primaryColor,
              backgroundColor: background3,
            },
            '.MuiTabs-indicator': {
              backgroundColor: primaryColor,
            },
          }}
        >
          {['Individual Report', 'Group Report', 'Renewal Report'].map((label, index) => (
            <Tab
              key={index}
              label={label}
              {...a11yProps(index)}
              sx={{
                color: fontColor,
                borderRadius: '5px'
              }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Content Section */}
      <Paper sx={{
        // ...containerStyles,
        flexGrow: 1,
        overflow: 'auto',  
        width: '600px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: background1,
        borderRadius: '14px',
      }}>
        {tabContents.map((content, index) => (
          <TabPanel key={index} value={value} index={index}>
            {content}
          </TabPanel>
        ))}
      </Paper>
    </Box>
  );
};

export default ResponsiveTabsPage;
