import  { useState } from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Autocomplete from '@mui/material/Autocomplete';

const top100Films = [
    { label: 'The Shawshank Redemption', year: 1994 },
    { label: 'The Godfather', year: 1972 },
    { label: 'The Godfather: Part II', year: 1974 },
    { label: 'The Dark Knight', year: 2008 },
    { label: '12 Angry Men', year: 1957 },
    { label: "Schindler's List", year: 1993 },
    { label: 'Pulp Fiction', year: 1994 },
    { label: 'The Lord of the Rings: The Return of the King', year: 2003 },
    { label: 'The Good, the Bad and the Ugly', year: 1966 },
    { label: 'Fight Club', year: 1999 },
    { label: 'Forrest Gump', year: 1994 },
    { label: 'Inception', year: 2010 },
    { label: 'The Lord of the Rings: The Fellowship of the Ring', year: 2001 },
    { label: 'Star Wars: Episode V - The Empire Strikes Back', year: 1980 },
    { label: 'The Lord of the Rings: The Two Towers', year: 2002 },
    { label: 'The Matrix', year: 1999 },
    { label: 'Goodfellas', year: 1990 },
    { label: 'One Flew Over the Cuckoo\'s Nest', year: 1975 },
    { label: 'Seven Samurai', year: 1954 },
    { label: 'Se7en', year: 1995 },
    { label: 'City of God', year: 2002 },
    { label: 'Life Is Beautiful', year: 1997 },
    { label: 'The Silence of the Lambs', year: 1991 },
    { label: 'It\'s a Wonderful Life', year: 1946 },
    { label: 'Star Wars: Episode IV - A New Hope', year: 1977 },
    { label: 'Saving Private Ryan', year: 1998 },
    { label: 'Spirited Away', year: 2001 },
    { label: 'The Green Mile', year: 1999 },
    { label: 'Interstellar', year: 2014 },
    { label: 'Parasite', year: 2019 },
    { label: 'Léon: The Professional', year: 1994 },
    { label: 'The Lion King', year: 1994 },
    { label: 'Gladiator', year: 2000 },
    { label: 'Terminator 2: Judgment Day', year: 1991 },
    { label: 'Back to the Future', year: 1985 },
    { label: 'Whiplash', year: 2014 },
    { label: 'The Prestige', year: 2006 },
    { label: 'The Departed', year: 2006 },
    { label: 'The Pianist', year: 2002 },
    { label: 'Apocalypse Now', year: 1979 },
    { label: 'Memento', year: 2000 },
    { label: 'The Intouchables', year: 2011 },
    { label: 'Raiders of the Lost Ark', year: 1981 },
    { label: 'Django Unchained', year: 2012 },
    { label: 'WALL·E', year: 2008 },
    { label: 'The Lives of Others', year: 2006 },
    { label: 'Sunset Blvd.', year: 1950 },
    { label: 'Paths of Glory', year: 1957 },
    { label: 'The Shining', year: 1980 },
    { label: 'The Great Dictator', year: 1940 },
    { label: 'Cinema Paradiso', year: 1988 },
    { label: 'The Hunt', year: 2012 },
    { label: 'The Wolf of Wall Street', year: 2013 },
    { label: 'Avatar', year: 2009 },
  ];

  const type = [{label:'Monthly'},{label:'Yearly'}]
  
const AddPolicy = () => {
    const [amount, setAmount] = useState('');
  

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between', // Align boxes parallel
        gap: 4, // Add space between the two boxes
        width: '100%', // Ensure the container spans full width
      }}
    >
      {/* Existing Box */}
      <Typography
          sx={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#fff',
            textAlign: 'center',
            marginTop: '150px',
            marginBottom: '10px',
          }}
        >
        Add Life Insurance
    </Typography>
    <Box sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between', // Align boxes parallel
        gap: 4, // Add space between the two boxes
        width: '100%', // Ensure the container spans full width
      }}
    >
        <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          width: '45ch',
        }}
      >
        
        <TextField
          id="outlined-basic-1"
          label="Policy Number"
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
          id="outlined-basic-4"
          label="Policy Name"
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
          id="outlined-basic-5"
          label="Fund House"
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
            label="Starting Date"
          />
        </LocalizationProvider>
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
            label="Maturity Date"
          />
        </LocalizationProvider>
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
            label="Ending Date"
          />
        </LocalizationProvider>
      </Box>
  
      {/* New Parallel Box */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          width: '45ch',
        }}
      >
        
        <TextField
          id="outlined-basic-2"
          label="Premium"
          value={amount}
          variant="outlined"
          onChange={(event) => {
            const value = event.target.value;
            if (/^\d*$/.test(value)) {
              setAmount(value);
            }
          }}
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
        <Autocomplete
            sx={{
                '& .MuiInputBase-input': { color: '#fff' },
                '& .MuiInputLabel-root': { color: '#fff' },
                '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#fff' },
                    '&:hover fieldset': { borderColor: '#fff' },
                    '&.Mui-focused fieldset': { borderColor: '#E4B912' },
                },
                }}
            disablePortal
            options={type}
            renderInput={(params) => <TextField {...params} label="Mode" />}
        />
        <Autocomplete
            sx={{
                '& .MuiInputBase-input': { color: '#fff' },
                '& .MuiInputLabel-root': { color: '#fff' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#fff' },
                  '&:hover fieldset': { borderColor: '#fff' },
                  '&.Mui-focused fieldset': { borderColor: '#E4B912' },
                },
              }}
            disablePortal
            options={top100Films}
            renderInput={(params) => <TextField {...params} label="Holder Name" />}
        />
        <Autocomplete
            sx={{
                '& .MuiInputBase-input': { color: '#fff' },
                '& .MuiInputLabel-root': { color: '#fff' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#fff' },
                  '&:hover fieldset': { borderColor: '#fff' },
                  '&.Mui-focused fieldset': { borderColor: '#E4B912' },
                },
              }}
            disablePortal
            options={top100Films}
            renderInput={(params) => <TextField {...params} label="Nominee 1" />}
        />
        <Autocomplete
            sx={{
                '& .MuiInputBase-input': { color: '#fff' },
                '& .MuiInputLabel-root': { color: '#fff' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#fff' },
                  '&:hover fieldset': { borderColor: '#fff' },
                  '&.Mui-focused fieldset': { borderColor: '#E4B912' },
                },
              }}
            disablePortal
            options={top100Films}
            renderInput={(params) => <TextField {...params} label="Nominee 2" />}
        />
        <Autocomplete
            sx={{
                '& .MuiInputBase-input': { color: '#fff' },
                '& .MuiInputLabel-root': { color: '#fff' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#fff' },
                  '&:hover fieldset': { borderColor: '#fff' },
                  '&.Mui-focused fieldset': { borderColor: '#E4B912' },
                },
              }}
            disablePortal
            options={top100Films}
            renderInput={(params) => <TextField {...params} label="Nominee 3" />}
        />
      </Box>
    </Box>
    <Box sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between', // Align boxes parallel
        gap: 4, // Add space between the two boxes
        width: '100%', // Ensure the container spans full width
        }}
    >
        <Box sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between', // Align boxes parallel
        gap: 4, // Add space between the two boxes
        width: '100%', // Ensure the container spans full width
        }}
        >
            <Box
                sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                width: '22ch',
                }}
            >
                <TextField
                id="outlined-basic-2"
                label="Year"
                value={amount}
                variant="outlined"
                onChange={(event) => {
                    const value = event.target.value;
                    if (/^\d*$/.test(value)) {
                    setAmount(value);
                    }
                }}
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
                label="Year"
                value={amount}
                variant="outlined"
                onChange={(event) => {
                    const value = event.target.value;
                    if (/^\d*$/.test(value)) {
                    setAmount(value);
                    }
                }}
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
                label="Year"
                value={amount}
                variant="outlined"
                onChange={(event) => {
                    const value = event.target.value;
                    if (/^\d*$/.test(value)) {
                    setAmount(value);
                    }
                }}
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
                label="Year"
                value={amount}
                variant="outlined"
                onChange={(event) => {
                    const value = event.target.value;
                    if (/^\d*$/.test(value)) {
                    setAmount(value);
                    }
                }}
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
                label="Year"
                value={amount}
                variant="outlined"
                onChange={(event) => {
                    const value = event.target.value;
                    if (/^\d*$/.test(value)) {
                    setAmount(value);
                    }
                }}
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
                label="Year"
                value={amount}
                variant="outlined"
                onChange={(event) => {
                    const value = event.target.value;
                    if (/^\d*$/.test(value)) {
                    setAmount(value);
                    }
                }}
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
            </Box>
            <Box
                sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                width: '18ch',
                }}
            >
            <TextField
            id="outlined-basic-2"
            label="Premiun"
            value={amount}
            variant="outlined"
            onChange={(event) => {
                const value = event.target.value;
                if (/^\d*$/.test(value)) {
                setAmount(value);
                }
            }}
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
              
            </Box>
        </Box>
            <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between', // Align boxes parallel
            gap: 4, // Add space between the two boxes
            width: '100%', // Ensure the container spans full width
            }}
        >
            
        </Box>

        
    </Box>
    <Button size="large" variant="contained" color="success">
        Submit
    </Button>
    </Box>
  );
  
};

export default AddPolicy;
