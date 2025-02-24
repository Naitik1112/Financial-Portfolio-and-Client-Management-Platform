import * as React from 'react';
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
  return (
    <Box
  component="form"
  sx={{
    '& > :not(style)': {
      m: 1,
      width: '45ch',
      borderColor: '#fff',
      marginLeft:"250px"
    },
  }}
  noValidate
  autoComplete="off"
>
  <Typography>Name</Typography>
  <TextField
    id="outlined-basic"
    label="Name"
    variant="outlined"
    sx={{
      '& .MuiInputBase-input': { color: '#fff' },
      '& .MuiInputLabel-root': { color: '#fff' },
      '& .MuiOutlinedInput-root': {
        '& fieldset': { borderColor: '#fff' },
        '&:hover fieldset': { borderColor: '#fff' },
        '&.Mui-focused fieldset': { borderColor: '#E4B912' },
      },
    }}
  />
  <Typography>Email</Typography>
  <TextField
    id="outlined-basic"
    label="Email Id"
    variant="outlined"
    sx={{
      '& .MuiInputBase-input': { color: '#fff' },
      '& .MuiInputLabel-root': { color: '#fff' },
      '& .MuiOutlinedInput-root': {
        '& fieldset': { borderColor: '#fff' },
        '&:hover fieldset': { borderColor: '#fff' },
        '&.Mui-focused fieldset': { borderColor: '#E4B912' },
      },
    }}
  />
  <Typography>DOB</Typography>
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    <DatePicker
      sx={{
        '& .MuiInputBase-input': { color: '#fff' },
        '& .MuiInputLabel-root': { color: '#fff' },
        '& .MuiOutlinedInput-root': {
          '& fieldset': { borderColor: '#fff' },
          '&:hover fieldset': { borderColor: '#fff' },
          '&.Mui-focused fieldset': { borderColor: '#E4B912' },
        },
      }}
    />
  </LocalizationProvider>
  <Typography>Group</Typography>
  <TextField
    id="outlined-basic"
    label="Group"
    variant="outlined"
    sx={{
      '& .MuiInputBase-input': { color: '#fff' },
      '& .MuiInputLabel-root': { color: '#fff' },
      '& .MuiOutlinedInput-root': {
        '& fieldset': { borderColor: '#fff' },
        '&:hover fieldset': { borderColor: '#fff' },
        '&.Mui-focused fieldset': { borderColor: '#E4B912' },
      },
    }}
  />
  <Stack spacing={2} direction="row">
    <Button size="medium" variant="contained" color="success">
      Save Changes
    </Button>
  </Stack>
</Box>

  );
}

const data = [
  { name: 'Fund 1', amfi: '1001', unit: '100', currNAV: '10.50' , _id : ''},
  { name: 'Fund 2', amfi: '1002', unit: '200', currNAV: '20.75' , _id : ''},
  { name: 'Fund 3', amfi: '1003', unit: '150', currNAV: '15.00' , _id : ''},
  { name: 'Fund 4', amfi: '1004', unit: '120', currNAV: '12.50' , _id : ''},
  { name: 'Fund 5', amfi: '1005', unit: '300', currNAV: '30.25' , _id : ''},
  { name: 'Fund 2', amfi: '1002', unit: '200', currNAV: '20.75' , _id : ''},
  { name: 'Fund 3', amfi: '1003', unit: '150', currNAV: '15.00' , _id : ''},
  { name: 'Fund 4', amfi: '1004', unit: '120', currNAV: '12.50' , _id : ''},
  { name: 'Fund 5', amfi: '1005', unit: '300', currNAV: '30.25' , _id : ''},
  { name: 'Fund 2', amfi: '1002', unit: '200', currNAV: '20.75' , _id : ''},
  { name: 'Fund 3', amfi: '1003', unit: '150', currNAV: '15.00' , _id : ''},
  { name: 'Fund 4', amfi: '1004', unit: '120', currNAV: '12.50' , _id : ''},
  { name: 'Fund 5', amfi: '1005', unit: '300', currNAV: '30.25' , _id : ''},
  { name: 'Fund 2', amfi: '1002', unit: '200', currNAV: '20.75' , _id : ''},
  { name: 'Fund 3', amfi: '1003', unit: '150', currNAV: '15.00' , _id : ''},
  { name: 'Fund 4', amfi: '1004', unit: '120', currNAV: '12.50' , _id : ''},
  { name: 'Fund 5', amfi: '1005', unit: '300', currNAV: '30.25' , _id : ''},
];

const columns = [
  { id: 'name', label: 'Name', minWidth: 200 },
  { id: 'amfi', label: 'AMFI Code', minWidth: 130 },
  { id: 'unit', label: 'Units', minWidth: 130 },
  { id: 'currNAV', label: 'Current NAV', minWidth: 130 },
];

function MutualFundsTab() {
  return (
    // <Typography variant="h6">
    //   This is the Mutual Funds tab. Add your Mutual Funds content here.
    // </Typography>
    <CustomTable data={data} columns={columns} variable1="Mutualfunds"/>
  );
}

const LIdata = [
  { name: 'Insurance 1', premium: '1001', premium_date: '100', mode: 'Yearly' , _id: ''},
  { name: 'Insurance 2', premium: '1002', premium_date: '200', mode: 'Monthly', _id: '' },
  { name: 'Insurance 3', premium: '1003', premium_date: '150', mode: 'Yearly' , _id: ''},
  { name: 'Insurance 4', premium: '1004', premium_date: '120', mode: 'Yearly' , _id: ''},
  { name: 'Insurance 5', premium: '1005', premium_date: '300', mode: 'Yearly' , _id: ''},
  { name: 'Insurance 2', premium: '1002', premium_date: '200', mode: 'Yearly' , _id: ''},
  { name: 'Insurance 3', premium: '1003', premium_date: '150', mode: 'Monthly' , _id: ''},
  { name: 'Insurance 4', premium: '1004', premium_date: '120', mode: 'Monthly' , _id: ''},
  { name: 'Insurance 5', premium: '1005', premium_date: '300', mode: 'Yearly' , _id: ''},
  { name: 'Insurance 2', premium: '1002', premium_date: '200', mode: 'Yearly' , _id: ''},
  { name: 'Insurance 3', premium: '1003', premium_date: '150', mode: 'Monthly' , _id: ''},
  { name: 'Insurance 4', premium: '1004', premium_date: '120', mode: 'Yearly' , _id: ''},
  { name: 'Insurance 5', premium: '1005', premium_date: '300', mode: 'Yearly' , _id: ''},
  { name: 'Insurance 2', premium: '1002', premium_date: '200', mode: 'Yearly' , _id: ''},
  { name: 'Insurance 3', premium: '1003', premium_date: '150', mode: 'Monthly' , _id: ''},
  { name: 'Insurance 4', premium: '1004', premium_date: '120', mode: 'Yearly' , _id: ''},
  { name: 'Insurance 5', premium: '1005', premium_date: '300', mode: 'Yearly' , _id: ''},
];

const LIcolumns = [
  { id: 'name', label: 'Name', minWidth: 200 },
  { id: 'premium', label: 'Premium', minWidth: 130 },
  { id: 'premium_date', label: 'Premium Date', minWidth: 130 },
  { id: 'mode', label: 'Mode', minWidth: 130 },
];

function LifeInsuranceTab() {
  return (
    <CustomTable data={LIdata} columns={LIcolumns} variable1="Insurance"/>
  );
}

function GeneralInsuranceTab() {
  return (
    <Typography variant="h6">
      This is the General Insurance tab. Add your General Insurance content here.
    </Typography>
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
        bgcolor: '#2B2B2B',
        display: 'flex',
        height: isSmallScreen ? 350 : 550,
        width: isSmallScreen ? 350 : "1200px",
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
          width: isSmallScreen ? '100%' : '270px',
          borderRight: isSmallScreen ? 'none' : 5,
          borderBottom: isSmallScreen ? 5 : 'none',
          borderColor: 'divider',
          backgroundColor: '#2B2B2B',
          borderTopLeftRadius: "15px",
          borderBottomLeftRadius: "15px",
          '.MuiTab-root': {
            color: '#CECCC9',
            backgroundColor: '#2B2B2B',
            marginTop: '10px',
            alignItems: 'flex-start',
          },
          '.Mui-selected': {
            color: '#E4B912',
            backgroundColor: '#333',
          },
          '.MuiTabs-indicator': {
            backgroundColor: '#E4B912',
          },
        }}
      >
        <Tab label="Profile" {...a11yProps(0)} />
        <Tab label="Mutual Funds" {...a11yProps(1)} />
        <Tab label="Life Insurance" {...a11yProps(2)} />
        <Tab label="General Insurance" {...a11yProps(3)} />
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
    </Box>
  );
}
