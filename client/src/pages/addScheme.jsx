import { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Autocomplete from '@mui/material/Autocomplete';
import { inputStyles, buttonStyles, containerStyles } from './../styles/themeStyles';
import dayjs from 'dayjs';
import axios from 'axios';

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


  // Fetch users for dropdowns
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/v1/users/');
        const data = await response.json();
        if (data?.data?.data) {
          setUsers(data.data.data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchMutualFunds = async () => {
      try {
        const response = await axios.get('/api/v1/mutualFunds/autocomplete');
        console.log(response);
        const data = response.data; // ✅ CORRECT way to access JSON
        if (data && data.data) {
          setMfOptions(data.data); 
        }
      } catch (error) {
        console.error('Error fetching mutual fund schemes:', error);
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
      const response = await fetch('/api/v1/mutualFunds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        sipStatus: 'active'
      });

      alert('Mutual fund added successfully!');
    } catch (error) {
      console.error('Error submitting form:', error);
      setError(error.message || 'Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: 4,
      width: '100%',
      padding: '60px',
      paddingTop: '0px',
      paddingBottom: '15px',
      marginTop: '120px',
      ...containerStyles,
    }}>
      <Typography sx={{
        fontSize: '1.8rem',
        fontWeight: 'bold',
        color: 'rgb(165, 165, 165)',
        textAlign: 'center',
        marginTop: '20px',
        marginBottom: '10px',
      }}>
        Add Mutual Fund Scheme
      </Typography>

      {error && (
        <Typography sx={{ color: 'red', textAlign: 'center' }}>{error}</Typography>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 4, width: '100%' }}>
        {/* Left Column - Common Fields */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '45ch' }}>
          <Autocomplete
            options={mfOptions}
            getOptionLabel={(option) => option.schemeName}
            value={mfOptions.find(option => option.schemeName === formData.schemeName) || null}
            onChange={(_, selected) => {
              if (selected) {
                const fundHouse = selected.schemeName?.split('-')[0]?.trim() || 'N/A';
                setFormData(prev => ({
                  ...prev,
                  AMFI: selected.amfiCode,
                  schemeName: selected.schemeName,
                  fundHouse
                }));
              } else {
                // Clear if user clears the field
                setFormData(prev => ({
                  ...prev,
                  AMFI: '',
                  schemeName: '',
                  fundHouse: ''
                }));
              }
            }}
            renderInput={(params) => <TextField {...params} label="Mutual Fund Scheme" />}
            sx={inputStyles}
            componentsProps={{
              paper: {
                sx: {
                  bgcolor: 'grey',
                  color: 'black',
                },
              },
            }}
          />


          
          <Autocomplete
            options={investmentTypes}
            getOptionLabel={(option) => option.label}
            value={investmentTypes.find(opt => opt.value === formData.investmentType) || null}
            onChange={(_, newValue) => handleChange('investmentType', newValue?.value || '')}
            renderInput={(params) => <TextField {...params} label="Investment Type" />}
            sx={inputStyles}
            componentsProps={{
              paper: {
                sx: {
                  bgcolor: 'grey',
                  color: 'black',
                },
              },
            }}
          />
          
          <Autocomplete
            options={users}
            getOptionLabel={(user) => user.name}
            value={users.find(user => user._id === formData.holderId) || null}
            onChange={(_, newValue) => handleChange('holderId', newValue?._id || '')}
            renderInput={(params) => <TextField {...params} label="Holder" />}
            sx={inputStyles}
            componentsProps={{
              paper: {
                sx: {
                  bgcolor: 'grey',
                  color: 'black',
                },
              },
            }}
          />
        </Box>

        {/* Right Column - Type-Specific Fields */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '45ch' }}>
          {formData.investmentType === 'lumpsum' ? (
            <>
              <TextField
                label="Amount (₹)"
                variant="outlined"
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
          ) : formData.investmentType === 'sip' ? (
            <>
              <TextField
                label="SIP Amount (₹)"
                variant="outlined"
                type="number"
                value={formData.sipAmount}
                onChange={(e) => handleChange('sipAmount', e.target.value)}
                sx={inputStyles}
              />
              
              <TextField
                label="SIP Day of Month"
                variant="outlined"
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
                componentsProps={{
                  paper: {
                    sx: {
                      bgcolor: 'grey',
                      color: 'black',
                    },
                  },
                }}
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
          ) : null}
          
          {[1].map((num) => (
            <Autocomplete
              key={num}
              options={users}
              getOptionLabel={(user) => user.name}
              value={users.find(user => user._id === formData[`nominee${num}Id`]) || null}
              onChange={(_, newValue) => handleChange(`nominee${num}Id`, newValue?._id || '')}
              renderInput={(params) => <TextField {...params} label={`Nominee ${num}`} />}
              sx={inputStyles}
              componentsProps={{
                paper: {
                  sx: {
                    bgcolor: 'grey',
                    color: 'black',
                  },
                },
              }}
            />
          ))}
        </Box>
      </Box>

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
  );
};

export default AddPolicy;