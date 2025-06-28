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
  CircularProgress
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

const AddClient = () => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [downloadFormat, setDownloadFormat] = useState(null);
  const [groups, setGroups] = useState([]);
  const [groupUsers, setGroupUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('jwt');

  const { darkMode } = useThemeMode();
  const { inputStyles, buttonStyles, containerStyles1, background,background2,background3, background1,fontColor,paperBg } = getStyles(darkMode);

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
          // Initially select all users
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

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    if (!selectedGroup || !selectedReport || !downloadFormat || selectedUsers.length === 0) {
      alert('Please fill all fields and select at least one user!');
      return;
    }
  
    // Determine the API endpoint URL based on the selected report type
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
      console.log(response)
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
    } catch (error) {
      console.error('Error:', error.message);
      alert(`Failed to download report: ${error.message}`);
    }
    setSelectedGroup(null);
    setSelectedReport(null);
    setDownloadFormat(null);
    setSelectedUsers([]);
  };

  return (
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
        ...containerStyles1,
        maxHeight: '500px', // Set your desired max height
        overflow: 'auto'
      }}
    >
      <Typography
        sx={{
          fontSize: '2rem',
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
        onChange={(event, value) => setSelectedReport(value)}
        renderInput={(params) => <TextField {...params} label="Report Type" />}
      />

      <Autocomplete
        sx={inputStyles}
        options={groups}
        onChange={(event, value) => setSelectedGroup(value)}
        renderInput={(params) => <TextField {...params} label="Group Name" />}
      />

      <Autocomplete
        sx={inputStyles}
        options={type}
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

      <Button 
        size="medium" 
        variant="contained" 
        sx={buttonStyles}
        type="submit"
      >
        Generate Report
      </Button>
    </Box>
  );
};

export default AddClient;