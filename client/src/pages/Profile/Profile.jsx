import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import { 
  useTheme ,
  Paper} from '@mui/material';
import TextField from '@mui/material/TextField';
// import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
// import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { DateField } from '@mui/x-date-pickers/DateField';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import CustomTable from './../../components/CustomTable';
import UserDetails from '../../components/UserDetails';
import { useParams } from 'react-router-dom';
import { fetchMutualFundsWithNAV } from './../../js/GetMFByUser.js'
import { fetchDebtsWithNAV } from './../../js/GetDebtByUser.js'
import { fetchLifeInsWithNAV } from './../../js/GetLifeInsByUser.js'
import { fetchGeneralInsWithNAV } from './../../js/GetGeneralInsByUser.js'

import { getStyles } from "../../styles/themeStyles";
import { useThemeMode } from "../../context/ThemeContext";

// Separate TabPanel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      {...other}
      style={{
        height: '100%',
        overflowY: 'auto',
      }}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `vertical-tab-${index}`,
    'aria-controls': `vertical-tabpanel-${index}`,
  };
}

// Separate components for each tab
function ProfileTab() {
  // Extract the `id` from the URL
  const { id } = useParams();

  return (
    // Pass the `id` as a prop to UserDetails
    <UserDetails id={id} />
  );
}

const debt_columns = [
  { id: 'bankDetails', label: 'Bank', minWidth: 120 },
  { id: 'AccountNumber', label: 'Account Number', minWidth: 120 },
  { id: 'MaturityDate', label: 'Maturity Date', minWidth: 100 },
  { id: 'amount', label: 'Invested Amount', minWidth: 100 },
];

function DebtTab() {
  
  const { id } = useParams();
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const userId = id; // Replace with dynamic userId if needed
    // Fetch and set data
    const fetchData = async () => {
      try {
        const data = await fetchDebtsWithNAV(userId);
        setDebts(data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load debts data.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  return (
    // <Typography variant="h6">
    //   This is the Mutual Funds tab. Add your Mutual Funds content here.
    // </Typography>
    <CustomTable data={debts} columns={debt_columns} variable1="DebtsUpdate" onDelete="debt" />
  );
}

const columns = [
  { id: 'name', label: 'Scheme Name', minWidth: 150 },
  { id: 'investmentType', label: 'Investment Type', minWidth: 120 },
  { id: 'totalInvested', label: 'Amount Invested', minWidth: 130 },
  { id: 'currentValue', label: 'Current Value', minWidth: 130 },
];

function MutualFundsTab() {
  
  const { id } = useParams();
  const [mutualFunds, setMutualFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const userId = id; // Replace with dynamic userId if needed
    // Fetch and set data
    const fetchData = async () => {
      try {
        const data = await fetchMutualFundsWithNAV(userId);
        console.log(data)
        setMutualFunds(data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load mutual funds data.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  return (
    // <Typography variant="h6">
    //   This is the Mutual Funds tab. Add your Mutual Funds content here.
    // </Typography>
    <CustomTable data={mutualFunds} columns={columns} variable1="MutualfundsUpdate" onDelete="mutualFunds"/>
  );
}



const LIcolumns = [
  { id: 'policyName', label: 'Policy Name', minWidth: 200 },
  { id: 'premium', label: 'Premium', minWidth: 130 },
  { id: 'startPremiumDate', label: 'Premium Date', minWidth: 130 },
  { id: 'mode', label: 'Mode', minWidth: 130 },
];

function LifeInsuranceTab() {
  const { id } = useParams();
  const [lifeIns, setLifeIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const userId = id; // Replace with dynamic userId if needed
    // Fetch and set data
    const fetchData = async () => {
      try {
        const data = await fetchLifeInsWithNAV(userId);
        setLifeIns(data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load mutual funds data.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  return (
    <CustomTable data={lifeIns} columns={LIcolumns} variable1="InsuranceUpdate" onDelete="lifeInsurance"/>
  );
}

const GIcolumns = [
  { id: 'policyName', label: 'Policy Name', minWidth: 200 },
  { id: 'startPremiumDate', label: 'Premium Date', minWidth: 130 },
  { id: 'type', label: 'Type', minWidth: 130 },
];

function GeneralInsuranceTab() {
  const { id } = useParams();
  const [generalIns, setGeneralIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const userId = id; 
    const fetchData = async () => {
      try {
        const data = await fetchGeneralInsWithNAV(userId);
        setGeneralIns(data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load mutual funds data.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  return (
    <CustomTable data={generalIns} columns={GIcolumns} variable1="GeneralUpdate" onDelete="generalInsurance"/>
  );
}

// Main Tabs Component

export default function VerticalTabs() {
  const [value, setValue] = React.useState(0);
  const theme = useTheme(); 
  const { darkMode } = useThemeMode();
  const { containerStyles, containerStyles1 } = getStyles(darkMode);
    
  const { fontColor , primaryColor, secondaryColor, tertiaryColor, body ,background1, background2, background ,background3, fourthColor} = getStyles(darkMode);

  // 👉 Check if screen width is less than 1000px
  const isSmallScreen = useMediaQuery('(max-width:1100px)');

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: isSmallScreen ? 'column' : 'row',
      height: '600px',
      maxHeight: 'max(80%,600px)',
      backgroundColor: background1,
      color: fontColor,
      p: isSmallScreen ? 1 : 3,
      mt: "70px",
      mx: 'auto',
      width: { 
        xs: '300px',   // 0-599px
        sm: '500px',   // 600-899px
        md: '820px',   // 900-1199px
        lg: '1100px',   // 1200-1535px
        xl: 'max(85%, 1200px)' // 1536px+
      },
      maxWidth: '1600px',
      borderRadius: '20px'
    }}>
      {/* Tabs Section */}
      <Paper sx={{
        mr: isSmallScreen ? 0 : 2,
        mb: isSmallScreen ? 2 : 0,
        width: isSmallScreen ? '100%' : '250px',
        flexShrink: 0,
        overflow: 'hidden',
        backgroundColor: fourthColor,
        borderRadius: '14px',
        p: 1,
      }}>
        <Tabs
          orientation={isSmallScreen ? 'horizontal' : 'vertical'}
          variant="scrollable"
          value={value}
          onChange={handleChange}
          sx={{
            '& .MuiTabs-indicator': {
              left: isSmallScreen ? 0 : 'auto'
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
          <Tab label="Profile" {...a11yProps(0)} sx={{ borderRadius: '5px' }} />
          <Tab label="Mutual Funds" {...a11yProps(1)} sx={{ borderRadius: '5px' }} />
          <Tab label="Life Insurance" {...a11yProps(2)} sx={{ borderRadius: '5px' }} />
          <Tab label="General Insurance" {...a11yProps(3)} sx={{ borderRadius: '5px' }} />
          <Tab label="Debts" {...a11yProps(4)} sx={{ borderRadius: '5px' }} />
        </Tabs>
      </Paper>

      {/* Content Section */}
      <Paper sx={{
        flexGrow: 1,
        overflow: 'auto',
        backgroundColor: background1,
        borderRadius: '14px',
        p: 1,
      }}>
        <TabPanel value={value} index={0}><ProfileTab /></TabPanel>
        <TabPanel value={value} index={1}><MutualFundsTab /></TabPanel>
        <TabPanel value={value} index={2}><LifeInsuranceTab /></TabPanel>
        <TabPanel value={value} index={3}><GeneralInsuranceTab /></TabPanel>
        <TabPanel value={value} index={4}><DebtTab /></TabPanel>
      </Paper>
    </Box>
  )
}    