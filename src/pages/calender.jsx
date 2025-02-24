import * as React from 'react';
import dayjs from 'dayjs';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { TextField, Box, Button, Typography, Autocomplete } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Paper } from '@mui/material';
import { MonthCalendar } from '@mui/x-date-pickers/MonthCalendar';
import { DemoContainer, DemoItem } from '@mui/x-date-pickers/internals/demo';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B3B3B3',
    },
  },
});

export default function CustomToolbarFormat() {
  const [value, setValue] = React.useState(0);
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      {/* <Box
        sx={{
          display:'flex',
          flexDirection:'column',
          width: '800px',
          height: '550px',
          marginTop: '50px',
          gap:'5%',
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Paper 
          elevation={2} 
          sx={{ 
            p: 2, 
            width: '100%',  
            height: '15%', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            alignItems:'center',
            alignContent:'center',
            bgcolor:'#040404',
          }}
        >
          <DemoContainer components={['DatePicker']}>
            <DatePicker label={'"month"'} views={['month']} />
          </DemoContainer>
        </Paper>
      </LocalizationProvider>
      <Box
        sx={{ 
          p: 2, 
          width: '60%',  // Increased width
          backgroundColor: '#1E1E1E',
          height:'80%',
          width:'100%'
        }}
      >
        <Tabs
          onChange={handleChange}
          value={value}
          aria-label="Tabs where selection follows focus"
          selectionFollowsFocus
          wrapped={true}
          sx={{
            bgcolor:'#313131'
          }}
        >
          <Tab wrapped={true} label="Mutual Funds ( SIP )" />
          <Tab label="Life Insurance" />
          <Tab label="General Insurance" />
      </Tabs>
      </Box>
      </Box> */}
      
    </ThemeProvider>
  );
}
