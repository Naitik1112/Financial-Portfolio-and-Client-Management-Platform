import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { Search, Delete, Visibility, Add } from '@mui/icons-material';
import { getStyles } from "../styles/themeStyles";
import { useThemeMode } from "../context/ThemeContext";
import { addGroup } from '../js/AddGroup';
import { addUserToGroup } from '../js/AddUserToGroup';
import { fetchAllGroup } from '../js/GetAllGroups';
import { fetchAllUsers } from '../js/GetAllUsers';
import { fetchGroupOfUser } from '../js/GetGroupOfUser';
import { fetchUsersOfGroup } from '../js/GetUsersOfGroup';

const GroupManagement = () => {
  const { darkMode } = useThemeMode();
  const { body, fontColor, paperBg, inputStyles,primaryColor,secondaryColor,tertiaryColor,fourthColor,background,background1,background2,background3, buttonStyles, containerStyles, containerStyles1, containerStyles2 } = getStyles(darkMode);
  
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupUsers, setGroupUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAddGroupDialog, setOpenAddGroupDialog] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    groupId: ''
  });
  const [newGroupName, setNewGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('jwt');


  useEffect(() => {
    loadGroups();
    loadUsers();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const data = await fetchAllGroup();
      setGroups(data);
    } catch (error) {
      showSnackbar('Failed to load groups', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await fetchAllUsers();
      
      setUsers(data);
    } catch (error) {
      showSnackbar('Failed to load users', 'error');
    }
  };

  const loadGroupUsers = async (groupId) => {
    setLoading(true);
    try {
      const data = await fetchUsersOfGroup(groupId);
      setGroupUsers(data);
    } catch (error) {
      showSnackbar('Failed to load group users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewGroup = (group) => {
    setSelectedGroup(group);
    loadGroupUsers(group._id);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ userId: '', groupId: '' });
  };

  const handleOpenAddGroupDialog = () => {
    setOpenAddGroupDialog(true);
  };

  const handleCloseAddGroupDialog = () => {
    setOpenAddGroupDialog(false);
    setNewGroupName('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMapClient = async () => {
    if (!formData.userId || !formData.groupId) {
      showSnackbar('Please select both user and group', 'error');
      return;
    }
    console.log(formData.userId)
    console.log(formData.groupId)
    const latestUsers = await fetchAllUsers();
    const user = latestUsers.find(u => u._id === formData.userId);
    console.log("User ",user)
    if (user.groupId != null) {
      const userGroup = await fetchGroupOfUser(user._id);
      console.log("userGroup", userGroup)

      const confirm = window.confirm(
        `This client is currently in ${userGroup.name} group. Do you want to change their group?`
      );
      if (!confirm) return;
    }

    setLoading(true);
    try {
      await addUserToGroup({ groupId: formData.groupId, userId: formData.userId });
      showSnackbar('User mapped to group successfully', 'success');
      loadGroups();
      loadUsers();
      if (selectedGroup?._id === formData.groupId) {
        loadGroupUsers(formData.groupId);
      }
      handleCloseDialog();
    } catch (error) {
      showSnackbar('Failed to map user to group', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) {
      showSnackbar('Group name cannot be empty', 'error');
      return;
    }

    setLoading(true);
    try {
      await addGroup({ name: newGroupName });
      showSnackbar('Group added successfully', 'success');
      loadGroups();
      handleCloseAddGroupDialog();
    } catch (error) {
      showSnackbar('Failed to add group', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    const confirm = window.confirm('Are you sure you want to delete this group?');
    if (!confirm) return;

    setLoading(true);
    try {
      // Replace with actual delete API call
      await fetch(`${backendURL}/api/v1/group/${groupId}`, 
        { method: 'DELETE' } , 
        {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );
      showSnackbar('Group deleted successfully', 'success');
      loadGroups();
      if (selectedGroup?._id === groupId) {
        setSelectedGroup(null);
        setGroupUsers([]);
        // setUsers(null)
        loadUsers()
        console.log("Users")
        console.log(users)
      }
    } catch (error) {
      showSnackbar('Failed to delete group', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId) => {
    const confirm = window.confirm('Are you sure you want to remove this user from the group?');
    if (!confirm) return;

    setLoading(true);
    try {
      // Replace with actual remove user API call
      await fetch(`${backendURL}/api/v1/group/remove-user/${userId}`, { method: 'DELETE' },{
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      showSnackbar('User removed from group successfully', 'success');
      loadUsers();
      if (selectedGroup) {
        loadGroupUsers(selectedGroup._id);
      }
    } catch (error) {
      showSnackbar('Failed to remove user from group', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ backgroundColor: body , ...containerStyles2,padding: 4,  mt: '70px', width: '80ch'}}>
      {/* Header with buttons */}
        <Typography sx={{ fontSize: '2rem', fontWeight: 'bold', color: 'rgb(178, 178, 178)', textAlign: 'center' , mb : 4}}>Group Management</Typography>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3,
        p: 0
      }}>
        <Box sx={{ display: 'flex', gap: 2}}>
            <Box sx={{ 
                ...containerStyles2, 
                // mb: 3,
                p: 0,
                borderWidth : '0px',
                height: '100%',
            }}>
                <TextField
                variant="outlined"
                placeholder="Search groups..."
                value={searchTerm}
                onChange={handleSearch}
                sx={{ ...inputStyles, height: '10%', width: '100%' , borderWidth : '0px',}}
                InputProps={{
                    startAdornment: (
                    <InputAdornment position="start">
                        <Search />
                    </InputAdornment>
                    ),
                }}
                />
            </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenDialog}
            sx={{...buttonStyles, ...containerStyles2 , color : 'grey' , '&:hover': { ...containerStyles1 }}}
          >
            Map Client to Group
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenAddGroupDialog}
            sx={{...buttonStyles, ...containerStyles2 , color : 'grey' , '&:hover': { ...containerStyles1 }}}
          >
            Add Group
          </Button>
        </Box>
      </Box>

      {/* Search bar */}
      {/* <Box sx={{ 
        ...containerStyles2, 
        mb: 3,
        p: 0
      }}>
        <TextField
          variant="outlined"
          placeholder="Search groups..."
          value={searchTerm}
          onChange={handleSearch}
          sx={{ ...inputStyles, height: '10%', width: '100%' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box> */}

      {/* Groups table */}
      <TableContainer 
            component={Paper} 
            sx={{
                ...containerStyles,
                maxHeight: '400px', // Set your desired max height
                overflow: 'auto' // Adds scrollbar when content exceeds maxHeight
            }}
            >
            <Table stickyHeader> {/* stickyHeader keeps headers visible while scrolling */}
                <TableHead>
                <TableRow>
                    <TableCell sx={{ 
                    backgroundColor: fourthColor, 
                    color: fontColor, 
                    fontWeight: 'bold',
                    position: 'sticky', // Ensures header stays fixed
                    top: 0 // Positions at top of container
                    }}>
                    Group Name
                    </TableCell>
                    <TableCell sx={{ 
                    backgroundColor: fourthColor,
                    color: fontColor, 
                    fontWeight: 'bold',
                    position: 'sticky',
                    top: 0
                    }} align="right">
                    Actions
                    </TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {loading && groups.length === 0 ? (
                    <TableRow>
                    <TableCell colSpan={2} align="center">
                        <CircularProgress />
                    </TableCell>
                    </TableRow>
                ) : (
                    filteredGroups.map((group) => (
                    <TableRow 
                        key={group._id} 
                        // sx={{
                        // height: '38px', // Fixed row height
                        // '&:hover': { 
                        //     backgroundColor: darkMode ? 'rgba(187, 44, 44, 0.08)' : 'rgba(213, 20, 20, 0.04)'
                        // }
                        // }}
                        sx={{
                            backgroundColor: background3
                        }}
                    >
                        <TableCell sx={{ color: fontColor }}>{group.name}</TableCell>
                        <TableCell align="right">
                        <IconButton
                            onClick={() => handleViewGroup(group)}
                            sx={{ color: secondaryColor }}
                            size="small" // Makes buttons more compact
                        >
                            <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton
                            onClick={() => handleDeleteGroup(group._id)}
                            sx={{ color: '#f44336' }}
                            size="small"
                        >
                            <Delete fontSize="small" />
                        </IconButton>
                        </TableCell>
                    </TableRow>
                    ))
                )}
                </TableBody>
            </Table>
</TableContainer>

      {/* Group Members Dialog */}
      <Dialog 
        open={!!selectedGroup} 
        onClose={() => setSelectedGroup(null)} 
        fullWidth 
        maxWidth="md"
        PaperProps={{
            sx: {
            borderRadius: '16px',  // Adjust this value as needed
            overflow: 'hidden',
            backgroundColor: background3 // Apply your background color here
            }
        }}
        >
        <DialogTitle sx={{ color: fontColor, backgroundColor: background3 }}>
          {selectedGroup?.name} Members
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: background3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: darkMode ? '#232629' : '#f2f2f2' }}>
                    <TableCell sx={{ color: fontColor, fontWeight: 'bold' }}>Name</TableCell>
                    <TableCell sx={{ color: fontColor, fontWeight: 'bold' }}>Email</TableCell>
                    <TableCell sx={{ color: fontColor, fontWeight: 'bold' }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groupUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell sx={{ color: fontColor }}>{user.name}</TableCell>
                      <TableCell sx={{ color: fontColor }}>{user.email}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() => handleRemoveUser(user._id)}
                          sx={{ color: '#f44336' }}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: background3 }}>
          <Button 
            onClick={() => setSelectedGroup(null)} 
            sx={{ color: fontColor }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Map Client to Group Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ color: fontColor, backgroundColor: background3 }}>
          Map Client to Group
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: background3 }}>
          <Box sx={{ mt: 2 }}>
            <TextField
              select
              fullWidth
              label="User"
              name="userId"
              value={formData.userId}
              onChange={handleFormChange}
              sx={inputStyles}
              margin="normal"
            >
              {users.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              fullWidth
              label="Group"
              name="groupId"
              value={formData.groupId}
              onChange={handleFormChange}
              sx={inputStyles}
              margin="normal"
            >
              {groups.map((group) => (
                <MenuItem key={group._id} value={group._id}>
                  {group.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: background3 }}>
          <Button onClick={handleCloseDialog} sx={{ color: fontColor }}>
            Cancel
          </Button>
          <Button
            onClick={handleMapClient}
            variant="contained"
            disabled={loading}
            sx={buttonStyles}
          >
            {loading ? <CircularProgress size={24} /> : 'Map Client'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Group Dialog */}
      <Dialog open={openAddGroupDialog} onClose={handleCloseAddGroupDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ color: fontColor, backgroundColor: background3 }}>
          Add New Group
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: background3 }}>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Group Name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              sx={inputStyles}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: background3 }}>
          <Button onClick={handleCloseAddGroupDialog} sx={{ color: fontColor }}>
            Cancel
          </Button>
          <Button
            onClick={handleAddGroup}
            variant="contained"
            disabled={loading}
            sx={buttonStyles}
          >
            {loading ? <CircularProgress size={24} /> : 'Add Group'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GroupManagement;