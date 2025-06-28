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
    secondaryColor
  } = getStyles(darkMode);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const tabContents = [
    "Content for Tab 1",
    "Content for Tab 2",
    "Content for Tab 3",
    "Content for Tab 4"
  ];

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      minHeight: '600px',
      backgroundColor: background,
      color: fontColor,
      p: isMobile ? 1 : 3,
      mt: "90px"
    }}>
      {/* Tabs Section */}
      <Paper sx={{
        ...(isMobile ? {} : containerStyles1),
        mr: isMobile ? 0 : 2,
        mb: isMobile ? 2 : 0,
        width: isMobile ? '100%' : '250px',
        flexShrink: 0,
        overflow: 'hidden'
      }}>
        <Tabs
          orientation={isMobile ? 'horizontal' : 'vertical'}
          variant="scrollable"
          value={value}
          onChange={handleChange}
          aria-label="Responsive tabs"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: secondaryColor,
              left: isMobile ? 0 : 'auto'
            }
          }}
        >
          {['Tab 1', 'Tab 2', 'Tab 3', 'Tab 4'].map((label, index) => (
            <Tab
              key={index}
              label={label}
              {...a11yProps(index)}
              sx={{
                color: fontColor,
                '&.Mui-selected': { color: secondaryColor }
              }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Content Section */}
      <Paper sx={{
        ...containerStyles,
        flexGrow: 1,
        overflow: 'auto'
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
