export const getStyles = (darkMode = true) => {
  const primaryText = darkMode ? '#f5f5f5' : '#222';
  const background = darkMode ? '#1b1b1b' : '#f2f2f2';
  const background1 = darkMode ? '#1A1E24' : '#f2f2f2';
  const background2 = darkMode ? '#080E17' : '#f2f2f2';
  const background3 = darkMode ? '#232629' : '#f2f2f2';
  const background4 = darkMode ? '#19212B' : '#f2f2f2';
  const background5 = darkMode ? '#24292D' : '#f2f2f2';
  const paperBg = darkMode ? '#2c2c2c' : '#fff';
  const border = darkMode ? '#303030' : '#ccc';
  const primaryColor = '#1976D2';
  const secondaryColor = '#64B5F6';
  const tertiaryColor = '#01579B';
  const fourthColor = '#15151A';
  const fontColor = darkMode ? '#fff' : '#111';
  const body = darkMode ? '#111' : '#fff';

  return {
    // Expose these directly so they can be destructured when using getStyles
    primaryColor,
    secondaryColor,
    tertiaryColor,
    fourthColor,
    fontColor,
    body,
    background,
    background1,
    background2,
    background3,
    background4,
    background5,

    inputStyles: {
      '& .MuiInputBase-input': {
        color: darkMode ? '#d3d3d3' : '#333'
      },
      '& .MuiInputLabel-root': {
        color: darkMode ? '#a0aab4' : '#555'
      },
      '& .MuiOutlinedInput-root': {
        '& fieldset': {
          borderColor: darkMode ? '#3a3a3a' : '#aaa'
        },
        '&:hover fieldset': {
          borderColor: '#1976D2'
        },
        '&.Mui-focused fieldset': {
          borderColor: '#1976D2'
        }
      },
      '& label.Mui-focused': {
        color: '#1976D2'
      },
      '& .MuiPaper-root': {
        bgcolor: paperBg
      }
    },

    buttonStyles: {
      backgroundColor: '#1976D2',
      color: '#ffffff',
      fontWeight: 600,
      borderRadius: '8px',
      padding: '6px 16px',
      textTransform: 'none',
      // marginTop: '10px',
      '&:hover': {
        backgroundColor: '#1565C0'
      }
    },

    containerStyles: {
      backgroundColor: background,
      color: primaryText,
      padding: '24px',
      borderRadius: '14px',
      boxShadow: '0 0 4px rgba(2, 94, 254, 0.85)',
      border: `1px solid ${border}`,
      transition: 'all 0.3s ease-in-out'
    },

    containerStyles1: {
      backgroundColor: background1,
      color: primaryText,
      // padding: '24px',
      borderRadius: '14px',
      boxShadow: '0 0 6px rgba(98, 150, 240, 0.73)',
      border: `1px solid ${border}`,
      transition: 'all 0.3s ease-in-out'
    },

    containerStyles2: {
      backgroundColor: background2,
      color: primaryText,
      // padding: '24px',
      borderRadius: '14px',
      boxShadow: '0 0 4px rgba(2, 94, 254, 0.85)',
      border: `1px solid ${border}`,
      transition: 'all 0.3s ease-in-out'
    },

    containerStyles3: {
      backgroundColor: background5,
      color: primaryText,
      // padding: '24px',
      borderRadius: '14px',
      boxShadow: '0 0 4px rgba(160, 192, 246, 0.76)',
      border: `1px solid ${border}`,
      transition: 'all 0.3s ease-in-out'
    }
  };
};
