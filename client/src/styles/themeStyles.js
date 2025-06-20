// src/styles/themeStyles.js

export const inputStyles = {
  '& .MuiInputBase-input': { color: '#A0AAB4' },
  '& .MuiInputLabel-root': { color: '#A0AAB4' },
  '& .MuiOutlinedInput-root': {
    '& fieldset': { borderColor: '#A0AAB4' },
    '&:hover fieldset': { borderColor: '#BA9D4D' },
    '&.Mui-focused fieldset': { borderColor: '#BA9D4D' }
  },
  '& label.Mui-focused': {
    color: '#A0AAB4'
  },
  '& .MuiPaper-root': {
    bgcolor: 'grey.500' // Use MUI grey shades or a custom hex color
  }
};

export const buttonStyles = {
  backgroundImage:
    'linear-gradient(90deg, rgb(64, 50, 22), rgb(93, 83, 57),rgb(98, 88, 67))',
  color: 'rgb(0, 0, 0)', // Text color
  '&:hover': {
    backgroundImage:
      'linear-gradient(90deg, rgb(84, 67, 31), rgb(99, 88, 58),rgb(143, 132, 108))'
  } // Slightly darker gradient on hover
};

export const containerStyles = {
  borderRadius: '20px',
  border: '1px solid rgb(71, 71, 71)',
  background: 'linear-gradient(180deg,rgb(32, 32, 32),rgb(31, 31, 31), #303030)'
};
