import { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Autocomplete from '@mui/material/Autocomplete';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { useMemo } from 'react';
import { getStyles } from "../styles/themeStyles";
import { useThemeMode } from "../context/ThemeContext";

const investmentTypes = [
  { label: 'SIP', value: 'sip' },
  { label: 'Lumpsum', value: 'lumpsum' }
];

const sipStatusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' }
];

const EditMutualFund = () => {
  const [formData, setFormData] = useState({
    AMFI: '',
    schemeName: '',
    fundHouse: '',
    investmentType: 'sip',
    holderId: '',
    // SIP fields
    sipAmount: '',
    sipDay: 1,
    sipStartDate: null,
    sipStatus: 'active',
    sipEndDate: null,
    sipTransactions: [],
    allRedemptions: [],
    // Lumpsum fields
    lumpsumAmount: '',
    lumpsumDate: null,
    lumpsumUnits: 0,
    // Common fields
    nominee1Id: ''
  });

  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalData, setOriginalData] = useState({});
  const { id } = useParams();

  const [allSchemes, setAllSchemes] = useState([]);

  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('jwt');

  const { darkMode } = useThemeMode();
  const { inputStyles, buttonStyles,containerStyles, containerStyles1 } = getStyles(darkMode);

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const response = await fetch(`${backendURL}/api/v1/mutualFunds/autocomplete`, {
          headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
          },
        });
        const data = await response.json();
        setAllSchemes(data?.data || []);
      } catch (error) {
        console.error('Failed to fetch mutual fund schemes:', error);
      }
    };
    fetchSchemes();
  }, []);


  // Fetch mutual fund data and users
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const usersResponse = await axios.get(`${backendURL}/api/v1/users/`, {
          headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
          },
        } );
        if (usersResponse.data?.data) {
          setUsers(usersResponse.data.data.map((user) => ({
            label: user.name,
            id: user._id
          })));
        }

        // Fetch mutual fund data if editing
        if (id) {
          const mfResponse = await axios.get(`${backendURL}/api/v1/mutualFunds/${id}`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
          });
          const mfData = mfResponse.data.data.data;

          // Step 1: Flatten redemptions
          const redemptions = mfData.investmentType === 'sip'
            ? mfData.sipTransactions?.flatMap(tx => tx.redemptions || []) || []
            : mfData.redemptions || [];

          const redemptionMap = {};

          for (const r of redemptions) {
            const key = new Date(r.date).toISOString().split('T')[0]; // get only date part

            if (!redemptionMap[key]) {
              redemptionMap[key] = { ...r, date: key }; // overwrite date to only YYYY-MM-DD
            } else {
              redemptionMap[key].units += r.units || 0;
              redemptionMap[key].amount += r.amount || 0;
            }
          }

          const allRedemptions = Object.values(redemptionMap);
          console.log("mfData",mfData)
          
          const initialData = {
            AMFI: mfData.AMFI || '',
            schemeName: mfData.schemeName || '',
            fundHouse: mfData.fundHouse || '',
            investmentType: mfData.investmentType || 'sip',
            holderId: mfData.holderId?._id || '',
            nominee1Id: mfData.nominee1Id?._id || '',
            // SIP fields
            sipAmount: mfData.sipAmount || '',
            sipDay: mfData.sipDay || 1,
            sipStartDate: mfData.sipStartDate ? dayjs(mfData.sipStartDate) : null,
            sipStatus: mfData.sipStatus || 'active',
            sipEndDate: mfData.sipEndDate ? dayjs(mfData.sipEndDate) : null,
            sipTransactions: mfData.sipTransactions || [],
            // Lumpsum fields
            lumpsumAmount: mfData.lumpsumAmount || '',
            lumpsumDate: mfData.lumpsumDate ? dayjs(mfData.lumpsumDate) : null,
            lumpsumUnits: mfData.lumpsumUnits || 0,
            allRedemptions: allRedemptions
          };

          setFormData(initialData);
          setOriginalData(initialData);
        }
      } catch (err) {
        setError('Failed to fetch data. Please try again later.');
        console.error(err);
      }
    };

    fetchData();
  }, [id]);

  

  // Track field changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'AMFI') {
      fetchSchemeDetails(value);
    }
  };

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
        setError('Please enter a valid AMFI code');
      }
    } catch (error) {
      console.error('Error fetching scheme details:', error);
      setError('Failed to fetch scheme details');
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    const payload = { sipStatus: 'inactive' };

    try {
      const response = await axios.patch(
        `${backendURL}/api/v1/mutualFunds/${id}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.status === 200) {
        alert('SIP status updated to Inactive!');
        window.location.reload();
      } else {
        throw new Error(response.data.message || 'Failed to update SIP status');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setError(error.response?.data?.message || 'Failed to update. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedUser = users.find(user => user.id === formData.holderId);
  const clientName = useMemo(() => {
    return users.find(user => user.id === formData.holderId)?.label || formData.holderId;
  }, [users, formData.holderId]);

  const schemeLabel = useMemo(() => {
    return formData.schemeName?.split(' - ')[0] || 'N/A';
  }, [formData.schemeName]);

  const schemeFullName = useMemo(() => {
    return formData.schemeName || 'N/A';
  }, [formData.schemeName]);


  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: 4,
      width: '100%',
      padding: '40px',
      marginTop: '120px',
      ...containerStyles
    }}>
      <Typography sx={{
        fontSize: '2rem',
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: '0px',
      }}>
        {schemeLabel} of {clientName}
      </Typography>

      {error && (
        <Typography sx={{ color: 'red', textAlign: 'center' }}>{error}</Typography>
      )}

      <Box sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 4,
        width: '100%',
      }}>
        {/* Left Column - Common Fields */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '45ch' }}>
          <Autocomplete
            value={schemeFullName || null}
            onChange={(_, selected) => {
              if (selected) {
                const fundHouse = selected.schemeName.includes('-')
                  ? selected.schemeName.split('-')[0].trim()
                  : 'N/A';

                setFormData(prev => ({
                  ...prev,
                  AMFI: selected.amfiCode,
                  schemeName: selected.schemeName,
                  fundHouse
                }));
              } else {
                setFormData(prev => ({
                  ...prev,
                  AMFI: '',
                  schemeName: '',
                  fundHouse: ''
                }));
              }
            }}
            renderInput={(params) => <TextField {...params} label="Scheme Name" variant="outlined" />}
            sx={inputStyles}
            componentsProps={{
              paper: {
                sx: {
                  bgcolor: 'grey',
                  color: 'black',
                },
              },
            }}
            readOnly
          />
                    
          <Autocomplete
            options={investmentTypes}
            getOptionLabel={(option) => option.label}
            value={investmentTypes.find(opt => opt.value === formData.investmentType) || null}
            renderInput={(params) => <TextField {...params} label="Investment Type" />}
            sx={inputStyles}
            componentsProps={{
              paper: {
                sx: {
                  bgcolor: "grey",
                  color: "black",
                },
              },
            }}
            readOnly
          />
          
          <Autocomplete
            options={users}
            getOptionLabel={(user) => user.label || ''}
            value={users.find(user => user.id === formData.holderId) || null}
            onChange={(_, newValue) => handleChange('holderId', newValue?.id || '')}
            renderInput={(params) => <TextField {...params} label="Holder" />}
            sx={inputStyles}
            componentsProps={{
              paper: {
                sx: {
                  bgcolor: "grey",
                  color: "black",
                },
              },
            }}
            readOnly
          />

          {formData.investmentType === 'sip' ? (
            <TextField
              label="SIP Amount (₹)"
              variant="outlined"
              type="number"
              value={formData.sipAmount}
              onChange={(e) => handleChange('sipAmount', e.target.value)}
              InputProps={{ readOnly: true }}
              sx={inputStyles}
            />
          ) : (
            <TextField
              label="Lumpsum Amount (₹)"
              variant="outlined"
              type="number"
              value={formData.lumpsumAmount}
              onChange={(e) => handleChange('lumpsumAmount', e.target.value)}
              InputProps={{ readOnly: true }}
              sx={inputStyles}
            />
          )}
        </Box>

        {/* Right Column - Type-Specific Fields */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '45ch' }}>
          {formData.investmentType === 'sip' ? (
            <>
              <TextField
                label="SIP Day of Month"
                variant="outlined"
                type="number"
                value={formData.sipDay}
                onChange={(e) => {
                  const day = Math.min(31, Math.max(1, parseInt(e.target.value) || 1));
                  handleChange('sipDay', day);
                }}
                InputProps={{ min: 1, max: 31,readOnly: true }}
                sx={inputStyles}
              />

              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Start Date"
                  value={formData.sipStartDate}
                  onChange={(newValue) => handleChange('sipStartDate', newValue)}
                  InputProps={{ readOnly: true }}
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
                      bgcolor: "grey",
                      color: "black",
                    },
                  },
                }}
                readOnly
              />
              
              {formData.sipStatus === 'inactive' && (
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="End Date"
                    value={formData.sipEndDate}
                    onChange={(newValue) => handleChange('sipEndDate', newValue)}
                    InputProps={{ readOnly: true }}
                    sx={inputStyles}
                  />
                </LocalizationProvider>
              )}
            </>
          ) : (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Investment Date"
                value={formData.lumpsumDate}
                onChange={(newValue) => handleChange('lumpsumDate', newValue)}
                InputProps={{ readOnly: true }}
                sx={inputStyles}
              />
            </LocalizationProvider>
          )}

          <Autocomplete
            options={users}
            getOptionLabel={(user) => user.label}
            value={users.find(user => user.id === formData.nominee1Id) || null}
            onChange={(_, newValue) => handleChange('nominee1Id', newValue?.id || '')}
            renderInput={(params) => <TextField {...params} label="Nominee 1" />}
            sx={inputStyles}
            componentsProps={{
              paper: {
                sx: {
                  bgcolor: "grey",
                  color: "black",
                },
              },
            }}
            readOnly
          />
        </Box>
      </Box>

      {formData.sipStatus === 'active' && (
        <Button 
          size="large" 
          variant="contained" 
          onClick={handleSubmit}
          disabled={isSubmitting}
          sx={buttonStyles}
        >
          {isSubmitting ? 'Updating...' : 'Mark as Inactive'}
        </Button>
      )}


      {/* Transactions Section - Only for SIP */}
      {formData.investmentType === 'sip' && formData.sipTransactions.length > 0 && (
        <Box sx={{ width: '100%', mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#fff', fontWeight: 600 }}>
            SIP Transactions
          </Typography>

          <TableContainer component={Paper} sx={{ backgroundColor: '#1e1e1e', borderRadius: 2, maxHeight: '300px', overflowY: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#2c2c2c' }}>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Amount (₹)</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Units</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>NAV</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.sipTransactions.map((txn, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor: index % 2 === 0 ? '#252526' : '#1e1e1e',
                      borderBottom: '1px solid #333',
                      '&:hover': { backgroundColor: '#323232' }
                    }}
                  >
                    <TableCell sx={{ color: '#e0e0e0' }}>{new Date(txn.date).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ color: '#e0e0e0' }}>₹{txn.amount}</TableCell>
                    <TableCell sx={{ color: '#e0e0e0' }}>{txn.units?.toFixed(4) || 'N/A'}</TableCell>
                    <TableCell sx={{ color: '#e0e0e0' }}>{txn.nav?.toFixed(4) || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {formData.allRedemptions.length > 0 && (
        <Box sx={{ width: '100%', mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#fff', fontWeight: 600 }}>
            Redemptions
          </Typography>

          <TableContainer component={Paper} sx={{ backgroundColor: '#1e1e1e', borderRadius: 2, maxHeight: '300px', overflowY: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#2c2c2c' }}>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Amount (₹)</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Units</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>NAV</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.allRedemptions.map((txn, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor: index % 2 === 0 ? '#252526' : '#1e1e1e',
                      borderBottom: '1px solid #333',
                      '&:hover': { backgroundColor: '#323232' }
                    }}
                  >
                    <TableCell sx={{ color: '#e0e0e0' }}>{new Date(txn.date).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ color: '#e0e0e0' }}>
                      ₹{txn.units != null && txn.nav != null
                        ? (txn.units * txn.nav).toFixed(2)
                        : '0.0000'}
                    </TableCell>
                    <TableCell sx={{ color: '#e0e0e0' }}>{txn.units?.toFixed(2) || 'N/A'}</TableCell>
                    <TableCell sx={{ color: '#e0e0e0' }}>{txn.nav?.toFixed(2) || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
};

export default EditMutualFund;