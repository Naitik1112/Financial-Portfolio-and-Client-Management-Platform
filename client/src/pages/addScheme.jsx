import { React, useState, useEffect, useMemo } from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress  from '@mui/material/CircularProgress';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Autocomplete from '@mui/material/Autocomplete';
import dayjs from 'dayjs';
import axios from 'axios';

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Tooltip from '@mui/material/Tooltip';


import { getStyles } from "../styles/themeStyles";
import { useThemeMode } from "../context/ThemeContext";



const investmentTypes = [{ label: 'SIP', value: 'sip' }, { label: 'Lumpsum', value: 'lumpsum' }];
const sipStatusOptions = [{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }];

const AddPolicy = () => {
  // Form state
  const [formData, setFormData] = useState({
    AMFI: '',
    schemeName: '',
    fundHouse: '',
    investmentType: '',
    holderId: '',
    nominee1Id: '',
    nominee2Id: '',
    nominee3Id: '',
    // Lumpsum fields
    lumpsumAmount: '',
    lumpsumDate: null,
    // SIP fields
    sipAmount: '',
    sipStartDate: null,
    sipEndDate: null,
    sipDay: 1,
    sipStatus: 'active'
  });

  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mfOptions, setMfOptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [formStage, setFormStage] = useState(1); // 1 = Select scheme/type, 2 = Fill details
  


  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('jwt');
  const [mfLoading, setMfLoading] = useState(true); // Add this


  const { darkMode } = useThemeMode();
  const { inputStyles, buttonStyles, containerStyles, containerStyles1 , fontColor} = getStyles(darkMode);

  const selectedHolder = users.find(user => user._id === formData.holderId);


  const orderedOptions = useMemo(() => {
    if (!formData.schemeName) return mfOptions;
    const selected = mfOptions.find(opt => opt.schemeName === formData.schemeName);
    if (!selected) return mfOptions;

    const others = mfOptions.filter(opt => opt.schemeName !== formData.schemeName);
    return [selected, ...others];
  }, [mfOptions, formData.schemeName]);


  // Fetch users for dropdowns
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${backendURL}/api/v1/users/`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
        });
        const data = await response.json();
        console.log(data)
        if (data?.data) {
          setUsers(data.data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchMutualFunds = async () => {
      setMfLoading(true); // start loading
      try {
        const response = await axios.get(`${backendURL}/api/v1/mutualFunds/autocomplete`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
        });
        const data = response.data;
        if (data && data.data) {
          setMfOptions(data.data);
        }
      } catch (error) {
        console.error('Error fetching mutual fund schemes:', error);
      } finally {
        setMfLoading(false); // done loading
      }
    };
    fetchMutualFunds();
  }, []);

  // Fetch scheme details when AMFI code changes
  const fetchSchemeDetails = async (code) => {
    if (!code) return;
    
    try {
      const response = await fetch(`https://api.mfapi.in/mf/${code}/latest`,
          {
            // Override headers to remove Authorization for this request
            headers: {
              Authorization: undefined
            }
          });
      const data = await response.json();

      if (data.status === 'SUCCESS' && data.meta) {
        setFormData(prev => ({
          ...prev,
          schemeName: data.meta.scheme_name || '',
          fundHouse: data.meta.fund_house || ''
        }));
        setError('');
      } else {
        setFormData(prev => ({ ...prev, schemeName: '', fundHouse: '' }));
        setError('Please enter a valid AMFI code');
      }
    } catch (error) {
      console.error('Error fetching scheme details:', error);
      setFormData(prev => ({ ...prev, schemeName: '', fundHouse: '' }));
      setError('Failed to fetch scheme details');
    }
  };

  // Handle form field changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Special handling for AMFI code changes
    if (field === 'AMFI') {
      fetchSchemeDetails(value);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    // Validate required fields
    const requiredFields = {
      AMFI: 'AMFI code',
      schemeName: 'Scheme name',
      fundHouse: 'Fund house',
      holderId: 'Holder ID',
      investmentType: 'Investment type'
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key]) => !formData[key])
      .map(([, name]) => name);

    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      setIsSubmitting(false);
      return;
    }

    // Type-specific validation
    if (formData.investmentType === 'lumpsum') {
      if (!formData.lumpsumAmount || !formData.lumpsumDate) {
        setError('For lumpsum investments, amount and date are required');
        setIsSubmitting(false);
        return;
      }
    } else if (formData.investmentType === 'sip') {
      if (!formData.sipAmount || !formData.sipStartDate || !formData.sipDay) {
        setError('For SIP investments, amount, start date, and SIP day are required');
        setIsSubmitting(false);
        return;
      }
      if (formData.sipStatus === 'inactive' && !formData.sipEndDate) {
        setError('For inactive SIP, end date is required');
        setIsSubmitting(false);
        return;
      }
    }

    // Prepare payload based on investment type
    let payload;
    if (formData.investmentType === 'lumpsum') {
      payload = {
        investmentType: 'lumpsum',
        schemeName: formData.schemeName,
        fundHouse: formData.fundHouse,
        AMFI: formData.AMFI,
        holderId: formData.holderId,
        nominee1Id: formData.nominee1Id,
        nominee2Id: formData.nominee2Id,
        nominee3Id: formData.nominee3Id,
        lumpsumAmount: Number(formData.lumpsumAmount),
        lumpsumDate: dayjs(formData.lumpsumDate).format('YYYY-MM-DD')
      };
    } else {
      payload = {
        investmentType: 'sip',
        schemeName: formData.schemeName,
        fundHouse: formData.fundHouse,
        AMFI: formData.AMFI,
        holderId: formData.holderId,
        nominee1Id: formData.nominee1Id,
        nominee2Id: formData.nominee2Id,
        nominee3Id: formData.nominee3Id,
        sipAmount: Number(formData.sipAmount),
        sipStartDate: dayjs(formData.sipStartDate).format('YYYY-MM-DD'),
        sipDay: Number(formData.sipDay),
        sipStatus: formData.sipStatus
      };
      
      if (formData.sipStatus === 'inactive' && formData.sipEndDate) {
        payload.sipEndDate = dayjs(formData.sipEndDate).format('YYYY-MM-DD');
      }
    }

    try {
      const response = await fetch(`${backendURL}/api/v1/mutualFunds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to add mutual fund');
      }

      // Reset form on success
      setFormData({
        AMFI: '',
        schemeName: '',
        fundHouse: '',
        investmentType: '',
        holderId: '',
        nominee1Id: '',
        nominee2Id: '',
        nominee3Id: '',
        lumpsumAmount: '',
        lumpsumDate: null,
        sipAmount: '',
        sipStartDate: null,
        sipEndDate: null,
        sipDay: 1,
        sipStatus: 'active',
      });

      
      setSearchQuery('')

      // Go back to step 1
      setFormStage(1);

      alert('Mutual fund added successfully!');

    } catch (error) {
      console.error('Error submitting form:', error);
      setError(error.message || 'Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  {/* Prepare ordered options with selected first */}
  


  return (mfLoading || isSubmitting) ? (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '300px',
        gap: 2,
        color: mfLoading ? (darkMode ? '#fff' : '#000') : (darkMode ? '#fff' : '#000')
      }}
    >
      <CircularProgress color="primary" size={40} />
      <Typography variant="body1" sx={{ mt: 1 }}>
        {mfLoading
          ? 'The data is getting loaded...'
          : 'The form is getting submitted...'}
      </Typography>
    </Box>
    ) : (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      marginTop: '100px',
      padding: { xs: '16px', sm: '24px' },
      width: '100%',
      minHeight: '500px', // consistent height if needed
      boxSizing: 'border-box',
      ...containerStyles,
    }}>
      <Typography sx={{
        fontSize: '1.8rem',
        fontWeight: 'bold',
        color: 'rgb(165, 165, 165)',
        textAlign: 'center',
        marginBottom: '10px',
      }}>
        Add Mutual Fund Scheme
      </Typography>

      {error && <Typography sx={{ color: 'red', textAlign: 'center' }}>{error}</Typography>}

      {formStage === 1 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            width: {
              xs: '95%',   // small screens
              sm: '600px', // tablets
              md: '700px', // desktop
            },
            margin: 'auto',
            padding: { xs: '10px', sm: '20px' },
          }}
        >
          {/* Search Input */}
          <TextField
            label="Search Mutual Fund Scheme"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            sx={inputStyles}
          />

          {/* Card Grid */}
         <Box sx={{ width: '100%' }}>
          <Typography
            sx={{
              fontSize: '1rem',
              color: 'rgb(165, 165, 165)',
              textAlign: 'left',
            }}
          >
            Select Mutual Fund Scheme
          </Typography>
        </Box>
          <Box
            sx={{
              maxHeight: '300px',
              overflowY: 'auto',
              width: '100%',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 2,
              paddingRight: '6px'
            }}
          >
            {orderedOptions
              .filter(option =>
                option.schemeName.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .slice(0, 30)
              .map((option, index) => {
                const isSelected = formData.schemeName === option.schemeName;
                return (
                  <Box
                    key={index}
                    onClick={() => {
                      const fundHouse = option.schemeName?.split('-')[0]?.trim() || 'N/A';
                      setFormData(prev => ({
                        ...prev,
                        AMFI: option.amfiCode,
                        schemeName: option.schemeName,
                        fundHouse
                      }));
                      // setSearchQuery(option.schemeName);
                    }}
                    sx={{
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #2196f3' : '1px solid #ccc',
                      borderRadius: '10px',
                      padding: '18px',
                      width: isSelected ? '100%' : { xs: '100%', sm: '45%' },
                      boxShadow: isSelected
                        ? '0 0 10px rgba(33,150,243,0.6)'
                        : '0 2px 5px rgba(0,0,0,0.1)',
                      backgroundColor: isSelected
                        ? (darkMode ? '#003c6e' : '#e3f2fd')
                        : (darkMode ? '#1e1e1e' : '#f5f5f5'),
                      color: darkMode ? '#fff' : '#000',
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    <Typography variant="subtitle1" fontSize="15px" fontWeight="bold" sx={{ color: darkMode ? '#fff' : '#000' }}>
                      {option.schemeName}
                    </Typography>
                    {/* <Typography variant="body2" fontSize="12px" sx={{ color: darkMode ? '#fff' : '#000' }}>
                      Fund House: {option.schemeName?.split('-')[0]?.trim() || 'N/A'}
                    </Typography> */}
                  </Box>
                );
              })}

          </Box>

          <TextField
            label="Selected Scheme"
            value={formData.schemeName || ''}
            fullWidth
            InputProps={{
              readOnly: true,
            }}
            sx={inputStyles}
          />

          {/* Investment Type Dropdown */}
          <Autocomplete
            options={investmentTypes}
            getOptionLabel={(option) => option.label}
            value={investmentTypes.find(opt => opt.value === formData.investmentType) || null}
            onChange={(_, newValue) => handleChange('investmentType', newValue?.value || '')}
            renderInput={(params) => <TextField {...params} label="Investment Type" />}
            sx={{ width: '100%', ...inputStyles }}
          />

          {/* Next Button */}
          <Tooltip
            title={!formData.schemeName || !formData.investmentType
              ? 'Please select a mutual fund scheme and investment type'
              : ''}
            arrow
            disableHoverListener={formData.schemeName && formData.investmentType} // Only show on hover if disabled
          >
            <span style={{ width: '100%' }}> {/* Needed for tooltip on disabled buttons */}
              <Button
                variant="contained"
                fullWidth
                sx={{
                  ...buttonStyles,
                  color: fontColor, // 👈 Use your theme-based fontColor always
                  backgroundColor: (!formData.schemeName || !formData.investmentType)
                    ? (darkMode ? '#333' : '#e0e0e0')
                    : undefined,
                  '&:hover': {
                    backgroundColor: (!formData.schemeName || !formData.investmentType)
                      ? (darkMode ? '#444' : '#d5d5d5')
                      : undefined,
                  },
                }}
                disabled={!formData.schemeName || !formData.investmentType}
                onClick={() => setFormStage(2)}
                startIcon={
                  (!formData.schemeName || !formData.investmentType)
                    ? <ErrorOutlineIcon />
                    : null
                }
              >
                Next
              </Button>

            </span>
          </Tooltip>

        </Box>
      )}

      {formStage === 2 && (
        <>
        <Box
          sx={{
            width: {
              xs: '95%',   // small screens
              sm: '600px', // tablets
              md: '700px', // desktop
            },
            maxWidth: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <Typography variant="subtitle1" sx={{ color: 'gray', marginBottom: '10px' }}>
            Scheme: {formData.schemeName} <br />
            Fund House: {formData.fundHouse} <br />
            Holder: {selectedHolder ? selectedHolder.name : 'N/A'}
          </Typography>

          <Autocomplete
            options={users}
            getOptionLabel={(user) => user.name}
            value={users.find(user => user._id === formData.holderId) || null}
            onChange={(_, newValue) => handleChange('holderId', newValue?._id || '')}
            renderInput={(params) => <TextField {...params} label="Holder" />}
            sx={inputStyles}
          />

          {formData.investmentType === 'sip' ? (
            <>
              <TextField
                label="SIP Amount (₹)"
                type="number"
                value={formData.sipAmount}
                onChange={(e) => handleChange('sipAmount', e.target.value)}
                sx={inputStyles}
              />

              <TextField
                label="SIP Day of Month"
                type="number"
                value={formData.sipDay}
                onChange={(e) => {
                  const day = Math.min(31, Math.max(1, parseInt(e.target.value) || 1));
                  handleChange('sipDay', day);
                }}
                inputProps={{ min: 1, max: 31 }}
                sx={inputStyles}
              />

              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Start Date"
                  value={formData.sipStartDate}
                  onChange={(newValue) => handleChange('sipStartDate', newValue)}
                  sx={inputStyles}
                />
              </LocalizationProvider>

              <Autocomplete
                options={sipStatusOptions}
                getOptionLabel={(option) => option.label}
                value={sipStatusOptions.find(opt => opt.value === formData.sipStatus) || null}
                onChange={(_, newValue) => handleChange('sipStatus', newValue?.value || 'active')}
                renderInput={(params) => <TextField {...params} label="SIP Status" />}
                sx={inputStyles}
              />

              {formData.sipStatus === 'inactive' && (
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="End Date"
                    value={formData.sipEndDate}
                    onChange={(newValue) => handleChange('sipEndDate', newValue)}
                    sx={inputStyles}
                  />
                </LocalizationProvider>
              )}
            </>
          ) : formData.investmentType === 'lumpsum' ? (
            <>
              <TextField
                label="Amount (₹)"
                type="number"
                value={formData.lumpsumAmount}
                onChange={(e) => handleChange('lumpsumAmount', e.target.value)}
                sx={inputStyles}
              />
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Investment Date"
                  value={formData.lumpsumDate}
                  onChange={(newValue) => handleChange('lumpsumDate', newValue)}
                  sx={inputStyles}
                />
              </LocalizationProvider>
            </>
          ) : null}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setFormStage(1)}
              sx={{ ...buttonStyles, backgroundColor: 'gray', color: 'white' }}
            >
              Back
            </Button>
            <Button
              size="large"
              variant="contained"
              onClick={handleSubmit}
              disabled={isSubmitting}
              sx={buttonStyles}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </Box>
        </Box>
        </>
      )}
    </Box>
  );

};

export default AddPolicy;