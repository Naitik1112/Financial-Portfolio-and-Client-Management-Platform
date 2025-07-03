import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Autocomplete,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  Paper,
  CircularProgress,
  Modal,
  Stack
} from '@mui/material';
import { getStyles } from "../styles/themeStyles";
import { useThemeMode } from "../context/ThemeContext";
import { fetchAllGroup } from "../js/GetAllGroups";
import { fetchUsersOfGroup } from "../js/GetUsersOfGroup";

const reportType = [
  { label: 'Life Insurance of Group' }, 
  { label: 'General Insurance of Group' },
  { label: 'Debts of Group' },
  { label: 'Mutual Funds of Group' }
];

const type = [
  { label: 'PDF', value: 'pdf' },
  { label: 'XLSX', value: 'excel' },
];

const GroupReport = () => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [downloadFormat, setDownloadFormat] = useState(null);
  const [groups, setGroups] = useState([]);
  const [groupUsers, setGroupUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('jwt');

  const { darkMode } = useThemeMode();
  const { inputStyles, buttonStyles, containerStyles1, containerStyles3, background, background2, background3, background4, background5, background1, fontColor, paperBg, primaryColor, secondaryColor, tertiaryColor } = getStyles(darkMode);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await fetchAllGroup();
        setGroups(data.map(group => ({ label: group.name, value: group._id })));
      } catch (error) {
        console.error('Error fetching groups:', error);
      }
    };
    fetchGroups();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      if (selectedGroup?.value) {
        setLoading(true);
        try {
          const users = await fetchUsersOfGroup(selectedGroup.value);
          setGroupUsers(users);
          setSelectedUsers(users.map(user => user._id));
        } catch (error) {
          console.error('Error fetching group users:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchUsers();
  }, [selectedGroup]);

  const handleUserSelection = (userId, isChecked) => {
    setSelectedUsers(prev => 
      isChecked 
        ? [...prev, userId] 
        : prev.filter(id => id !== userId))
  };

  const handleSelectAll = (isChecked) => {
    setSelectedUsers(isChecked ? groupUsers.map(user => user._id) : []);
  };

  const resetForm = () => {
    setSelectedGroup(null);
    setSelectedReport(null);
    setDownloadFormat(null);
    setSelectedUsers([]);
    setGroupUsers([]);
    setEmail('');
    setTitle('');
    setDescription('');
    setSendModalOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    if (!selectedGroup || !selectedReport || !downloadFormat || selectedUsers.length === 0) {
      alert('Please fill all fields and select at least one user!');
      return;
    }
  
    let apiUrl;
    if (selectedReport.label === 'Life Insurance of Group') {
      apiUrl = `${backendURL}/api/v1/reports/policyByGroup`;
    } else if (selectedReport.label === 'Mutual Funds of Group') {
      apiUrl = `${backendURL}/api/v1/reports/schemeByGroup`;
    } else if (selectedReport.label === 'General Insurance of Group') {
      apiUrl = `${backendURL}/api/v1/reports/generalPolicyByGroup`;
    } else if (selectedReport.label === 'Debts of Group') {
      apiUrl = `${backendURL}/api/v1/reports/debtsByGroup`;
    } else {
      alert('Invalid report type selected!');
      return;
    }

    const payload = {
      groupName: selectedGroup.label,
      userIds: selectedUsers,
      format: downloadFormat.value,
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const blob = await response.blob();
      const fileExtension = downloadFormat.value === 'pdf' ? 'pdf' : 'xlsx';
      const fileName = `${selectedGroup.label}_Group_Report.${fileExtension}`;
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
    if (!selectedGroup || !selectedReport || !downloadFormat || selectedUsers.length === 0) {
      alert('Please fill all fields and select at least one user!');
      return;
    }
    // Set default title and description
    setTitle(`${selectedReport.label} of ${selectedGroup.label}`);
    setDescription(`Dear Client,\n\nPlease find attached your ${selectedReport.label} for ${selectedGroup.label} group.`);
    setSendModalOpen(true);
  };

  const handleSendSubmit = async () => {
    if (!email || !title || !description) {
      alert('Please fill all fields!');
      return;
    }

    let apiUrl;
    if (selectedReport.label === 'Life Insurance of Group') {
      apiUrl = `${backendURL}/api/v1/reports/policyByGroup`;
    } else if (selectedReport.label === 'Mutual Funds of Group') {
      apiUrl = `${backendURL}/api/v1/reports/schemeByGroup`;
    } else if (selectedReport.label === 'General Insurance of Group') {
      apiUrl = `${backendURL}/api/v1/reports/generalPolicyByGroup`;
    } else if (selectedReport.label === 'Debts of Group') {
      apiUrl = `${backendURL}/api/v1/reports/debtsByGroup`;
    } else {
      alert('Invalid report type selected!');
      return;
    }

    const payload = {
      groupName: selectedGroup.label,
      userIds: selectedUsers,
      format: downloadFormat.value,
      email,
      title,
      description
    };

    try {
      setLoading(true);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}`
        },
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
          height: {xs: '400px', sm: '400px',md: '480px', },
          maxHeight: {xs: '400px',sm: '400px',md: '480px',},
          overflow: 'auto'
        }}
      >
        <Typography
          sx={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            textAlign: 'center',
            mb: 2,
          }}
        >
          Group Reports
        </Typography>

        <Autocomplete
          sx={inputStyles}
          options={reportType}
          value={selectedReport}
          onChange={(event, value) => setSelectedReport(value)}
          renderInput={(params) => <TextField {...params} label="Report Type" />}
        />

        <Autocomplete
          sx={inputStyles}
          options={groups}
          value={selectedGroup}
          onChange={(event, value) => setSelectedGroup(value)}
          renderInput={(params) => <TextField {...params} label="Group Name" />}
        />

        <Autocomplete
          sx={inputStyles}
          options={type}
          value={downloadFormat}
          onChange={(event, value) => setDownloadFormat(value)}
          renderInput={(params) => <TextField {...params} label="Download Format" />}
        />

        {selectedGroup && (
          <Paper sx={{ p: 2, height: '100%', backgroundColor: background3, color:fontColor }}>
            {loading ? (
              <Box display="flex" justifyContent="center">
                <CircularProgress />
              </Box>
            ) : (
              <>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedUsers.length === groupUsers.length}
                      indeterminate={
                        selectedUsers.length > 0 && 
                        selectedUsers.length < groupUsers.length
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  }
                  label="Select All"
                />
                <List>
                  {groupUsers.map((user) => (
                    <ListItem key={user._id} dense>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedUsers.includes(user._id)}
                            onChange={(e) => handleUserSelection(user._id, e.target.checked)}
                          />
                        }
                        label={`${user.name} (${user.email})`}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Paper>
        )}

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
          <Typography variant="h6" mb={2} sx={{color: fontColor}}>Send Report to Client</Typography>
          <Autocomplete
            freeSolo
            options={groupUsers.map(user => user.email)}
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

export default GroupReport;