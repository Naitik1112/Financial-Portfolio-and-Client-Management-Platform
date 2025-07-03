import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Autocomplete,
  Modal,
  Stack
} from '@mui/material';
import { fetchMutualFundsWithNAV } from './../js/GetMFByUser';
import { getStyles } from "../styles/themeStyles";
import { useThemeMode } from "../context/ThemeContext";

const reportType = [
  { label: 'Life Insurance of Client' },
  { label: 'General Insurance of Client' },
  { label: 'Debts of Client' },
  { label: 'Mutual Funds of Client' },
  { label: 'Scheme wise - Valution Report' },
  { label: 'CashFlow of Client' },
  { label: 'Claims of Client' },
];

const type = [
  { label: 'PDF', value: 'pdf' },
  { label: 'XLSX', value: 'excel' },
];



const IndividualReport = () => {
  const [holderName, setHolderName] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [downloadFormat, setDownloadFormat] = useState(null);
  const [top100Films, setTop100Films] = useState([]);
  const [schemeOptions, setSchemeOptions] = useState([]);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('jwt');

  const { darkMode } = useThemeMode();
  const { inputStyles, buttonStyles, containerStyles3, background5, fontColor } = getStyles(darkMode);

  const resetForm = () => {
    setSelectedReport(null);
    setDownloadFormat(null);
    setHolderName(null);
    setSchemeOptions([]);
    setSelectedScheme(null);
    setSendModalOpen(false);
    setEmail('');
    setTitle('');
    setDescription('');
  };

  useEffect(() => {
    const fetchSchemes = async () => {
      if (holderName && selectedReport?.label === "Scheme wise - Valution Report") {
        try {
          const data = await fetchMutualFundsWithNAV(holderName.id);
          const schemeMap = new Map();

          data.forEach((item) => {
            const key = `${item.name}`;
            if (!schemeMap.has(key)) {
              schemeMap.set(key, { label: item.name, id: item._id });
            }
          });

          const schemes = Array.from(schemeMap.values());
          setSchemeOptions(schemes);
        } catch (error) {
          console.error("Failed to fetch schemes:", error);
        }
      } else {
        setSchemeOptions([]);
      }
    };

    fetchSchemes();
  }, [holderName, selectedReport]);

  useEffect(() => {
    const fetchUserNames = async () => {
      try {
        const response = await fetch(`${backendURL}/api/v1/users/`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
        });
        const data = await response.json();
        
        if (data?.data) {
          const userNames = data.data.map((user) => ({ 
            label: user.name,
            id: user._id,
            email: user.email 
          }));
          setTop100Films(userNames);
        } else {
          throw new Error('Unexpected response structure');
        }
      } catch (error) {
        console.error('Error fetching user names:', error);
      }
    };
  
    fetchUserNames();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    if (!holderName || !selectedReport || !downloadFormat) {
      alert('Please fill all fields!');
      return;
    }
  
    let apiUrl;
    if (selectedReport.label === 'Life Insurance of Client') {
      apiUrl = `${backendURL}/api/v1/reports/policyByClient`;
    } else if (selectedReport.label === 'Mutual Funds of Client') {
      apiUrl = `${backendURL}/api/v1/reports/schemeByClient`;
    } else if (selectedReport.label === 'General Insurance of Client') {
      apiUrl = `${backendURL}/api/v1/reports/generalPolicyByClient`;
    } else if (selectedReport.label === 'Debts of Client') {
      apiUrl = `${backendURL}/api/v1/reports/debtsByClient`;
    } else if (selectedReport.label === 'CashFlow of Client') {
      apiUrl = `${backendURL}/api/v1/reports/cashFlowReport`;
    } else if (selectedReport.label === 'Scheme wise - Valution Report') {
      apiUrl = `${backendURL}/api/v1/reports/schemeValuation`; 
    } else if (selectedReport.label === 'Claims of Client') {
      apiUrl = `${backendURL}/api/v1/reports/claimsByClient`;
    } else {
      alert('Invalid report type selected!');
      return;
    }
  
    const payload = {
      name_label: holderName.label,
      name: holderName.id,
      format: downloadFormat.value,
    };

    if (selectedReport.label === "Scheme wise - Valution Report") {
      if (!selectedScheme) {
        alert("Please select a scheme for the valuation report.");
        return;
      }
      payload.schemeId = selectedScheme.id;
    }
  
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const blob = await response.blob();
      const fileExtension = downloadFormat.value === 'pdf' ? 'pdf' : 'xlsx';
      const fileName = `${holderName.label}_${selectedReport.label}.${fileExtension}`;
      const fileUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(fileUrl);
      alert('Report downloaded successfully!');
      resetForm();
    } catch (error) {
      console.error('Error:', error.message);
      alert(`Failed to download report: ${error.message}`);
      resetForm();
    }
  };

  const handleSendToClient = () => {
    if (!holderName || !selectedReport || !downloadFormat) {
      alert('Please fill all fields!');
      return;
    }
    setEmail(holderName.email || '');
    setTitle(`${selectedReport.label} report of ${holderName.label}`);
    setDescription(`Dear ${holderName.label}\nPlease find attached your ${selectedReport.label}`);
    setSendModalOpen(true);
  };

  const handleSendSubmit = async () => {
    if (!email || !title || !description) {
      alert('Please fill all fields!');
      return;
    }

    let apiUrl;
    if (selectedReport.label === 'Life Insurance of Client') {
      apiUrl = `${backendURL}/api/v1/reports/policyByClient`;
    } else if (selectedReport.label === 'Mutual Funds of Client') {
      apiUrl = `${backendURL}/api/v1/reports/schemeByClient`;
    } else if (selectedReport.label === 'General Insurance of Client') {
      apiUrl = `${backendURL}/api/v1/reports/generalPolicyByClient`;
    } else if (selectedReport.label === 'Debts of Client') {
      apiUrl = `${backendURL}/api/v1/reports/debtsByClient`;
    } else if (selectedReport.label === 'CashFlow of Client') {
      apiUrl = `${backendURL}/api/v1/reports/cashFlowReport`;
    } else if (selectedReport.label === 'Scheme wise - Valution Report') {
      apiUrl = `${backendURL}/api/v1/reports/schemeValuation`; 
    } else if (selectedReport.label === 'Claims of Client') {
      apiUrl = `${backendURL}/api/v1/reports/claimsByClient`;
    } else {
      alert('Invalid report type selected!');
      return;
    }

    const payload = {
      name_label: holderName.label,
      name: holderName.id,
      format: downloadFormat.value,
      email,
      title,
      description
    };

    if (selectedReport.label === "Scheme wise - Valution Report") {
      payload.schemeId = selectedScheme.id;
    }

    try {
      setLoading(true);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      alert('Report sent successfully!');
      resetForm();
    } catch (error) {
      console.error('Error:', error.message);
      alert(`Failed to send report: ${error.message}`);
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          width: '53ch',
          bgcolor: '#1E1E1E',
          padding: '50px',
          borderRadius: '30px',
          ...containerStyles3,
          height: {xs: '400px', sm: '400px', md: '480px'},
          maxHeight: {xs: '400px', sm: '400px', md: '480px'},
          overflow: 'auto'
        }}
      >
        <Typography
          sx={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#fff',
            textAlign: 'center',
            marginBottom: '15px',
          }}
        >
          Individual Reports
        </Typography>

        <Autocomplete
          sx={inputStyles}
          disablePortal
          options={reportType}
          value={selectedReport}
          onChange={(event, value) => setSelectedReport(value)}
          renderInput={(params) => <TextField {...params} label="Report Type" />}
          componentsProps={{
            paper: {
              sx: {
                bgcolor: "grey",
                color: "black",
              },
            },
          }}
        />

        <Autocomplete
          sx={inputStyles}
          disablePortal
          options={top100Films}
          value={holderName}
          onChange={(event, value) => setHolderName(value)}
          renderInput={(params) => <TextField {...params} label="Holder Name" />}
          componentsProps={{
            paper: {
              sx: {
                bgcolor: "grey",
                color: "black",
              },
            },
          }}
        />

        {selectedReport?.label === "Scheme wise - Valution Report" && (
          <Autocomplete
            sx={inputStyles}
            disablePortal
            options={schemeOptions}
            value={selectedScheme}
            onChange={(event, value) => setSelectedScheme(value)}
            renderInput={(params) => <TextField {...params} label="Scheme Name" />}
            componentsProps={{
              paper: {
                sx: {
                  bgcolor: "grey",
                  color: "black",
                },
              },
            }}
          />
        )}

        <Autocomplete
          sx={inputStyles}
          disablePortal
          options={type}
          value={downloadFormat}
          onChange={(event, value) => setDownloadFormat(value)}
          renderInput={(params) => <TextField {...params} label="Download Format" />}
          componentsProps={{
            paper: {
              sx: {
                bgcolor: "grey",
                color: "black",
              },
            },
          }}
        />

        <Stack direction="row" spacing={2}>
          <Button 
            size="medium" 
            variant="contained" 
            sx={buttonStyles}
            type="submit"
            fullWidth
          >
            Generate Report
          </Button>
          <Button 
            size="medium" 
            variant="contained" 
            sx={buttonStyles}
            onClick={handleSendToClient}
            fullWidth
          >
            Send Report to Client
          </Button>
        </Stack>
      </Box>

      {/* Send Report Modal */}
      <Modal
        open={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        aria-labelledby="send-report-modal"
        aria-describedby="send-report-form"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(80%,500px)',
          bgcolor: background5,
          boxShadow: 24,
          p: 4,
          borderRadius: 2
        }}>
          <Typography variant="h6" mb={2} sx={{color: fontColor}}>
            Send Report to Client
          </Typography>
          <Autocomplete
            freeSolo
            options={holderName ? [holderName.email] : []}
            value={email}
            onChange={(event, newValue) => {
              setEmail(newValue);
            }}
            onInputChange={(event, newInputValue) => {
              setEmail(newInputValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Email"
                margin="normal"
                sx={{
                  '& .MuiInputBase-input': { color: fontColor },
                  '& .MuiInputLabel-root': { color: fontColor },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: fontColor },
                    '&:hover fieldset': { borderColor: fontColor },
                  }
                }}
              />
            )}
          />
          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            margin="normal"
            sx={{
              '& .MuiInputBase-input': { color: fontColor },
              '& .MuiInputLabel-root': { color: fontColor },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: fontColor },
                '&:hover fieldset': { borderColor: fontColor },
              }
            }}
          />
          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            multiline
            rows={4}
            sx={{
              '& .MuiInputBase-input': { color: fontColor },
              '& .MuiInputLabel-root': { color: fontColor },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: fontColor },
                '&:hover fieldset': { borderColor: fontColor },
              }
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button 
              onClick={() => setSendModalOpen(false)} 
              sx={{ mr: 2, color: fontColor }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSendSubmit}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send'}
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default IndividualReport;