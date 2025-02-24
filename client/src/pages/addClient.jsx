import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Typography from '@mui/material/Typography';

const addClient = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column', // Arrange children in column direction
        gap: 2, // Add spacing between TextFields
        width: '45ch',
      }}
    >
      <Typography
        sx={{
          fontSize: '2rem', // Make it bigger
          fontWeight: 'bold', // Make it bolder
          color: '#fff', // Add a custom color (optional)
          textAlign: 'center',
          marginBottom: '10px'
        }}
      >
        Add Client
      </Typography>
      <TextField
        id="outlined-basic-1"
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
      <TextField
        id="outlined-basic-2"
        label="Email"
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
          label="Date of Birth"
        />
      </LocalizationProvider>
      <TextField
        id="outlined-basic-4"
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
      <Button size="medium" variant="contained" color="success">
        Submit
      </Button>
    </Box>
  );
};

export default addClient;
