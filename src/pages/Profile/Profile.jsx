import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
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

const inputStyles = {
  '& .MuiInputBase-input': { color: '#A0AAB4' },
  '& .MuiInputLabel-root': { color: '#A0AAB4' },
  '& .MuiOutlinedInput-root': {
    '& fieldset': { borderColor: '#A0AAB4' },
    '&:hover fieldset': { borderColor: '#BA9D4D' },
    '&.Mui-focused fieldset': { borderColor: '#BA9D4D' },
  },
  '& label.Mui-focused': {
    color: '#A0AAB4',
  },
};

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
  { id: 'status', label: 'SIP Status', minWidth: 100 }, // Show only for SIP
  { id: 'totalUnits', label: 'Total Units', minWidth: 100 },
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
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box
      sx={{
        flexGrow: 3,
        bgcolor: 'rgb(35, 35, 35)',
        display: 'flex',
        height: isSmallScreen ? 350 : 550,
        width: 'max(1250px)',
        marginTop: "125px",
        borderRadius: "15px"
      }}
    >
      <Tabs
        orientation={isSmallScreen ? 'horizontal' : 'vertical'}
        variant="scrollable"
        value={value}
        onChange={handleChange}
        aria-label={isSmallScreen ? 'horizontal tabs example' : 'Vertical tabs example'}
        textColor='#E4B912'
        sx={{
          width: 'max(220px,20%)',
          borderRight: isSmallScreen ? 'none' : 5,
          borderBottom: isSmallScreen ? 5 : 'none',
          borderColor: 'divider',
          backgroundColor: 'rgb(35, 35, 35)',
          borderTopLeftRadius: "15px",
          borderBottomLeftRadius: "15px",
          '.MuiTab-root': {
            color: '#CECCC9',
            backgroundColor: 'rgb(35, 35, 35)',
            marginTop: '10px',
            alignItems: 'flex-start',
          },
          '.Mui-selected': {
            color: '#c3a564',
            backgroundColor: '#333',
          },
          '.MuiTabs-indicator': {
            backgroundColor: '#c3a564',
          },
        }}
      >
        <Tab label="Profile" {...a11yProps(0)} />
        <Tab label="Mutual Funds" {...a11yProps(1)} />
        <Tab label="Life Insurance" {...a11yProps(2)} />
        <Tab label="General Insurance" {...a11yProps(3)} />
        <Tab label="Debts" {...a11yProps(4)} />
      </Tabs>
      <TabPanel value={value} index={0}>
        <ProfileTab />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <MutualFundsTab />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <LifeInsuranceTab />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <GeneralInsuranceTab />
      </TabPanel>
      <TabPanel value={value} index={4}>
        <DebtTab />
      </TabPanel>
    </Box>
  );
}
