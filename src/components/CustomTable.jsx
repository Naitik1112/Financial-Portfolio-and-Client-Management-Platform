import * as React from 'react';
import PropTypes from 'prop-types';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from './../assets/delete.png'; // Import the delete icon

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      paper: '#121212',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0bec5',
    },
  },
});

function CustomTable({ data, columns, variable1, onDeleteSuccess , onDelete}) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const navigate = useNavigate();

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleViewMore = (_id) => {
    navigate(`/${variable1}/${_id}`);
  };

  const handleDelete = async (_id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this record?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/v1/${onDelete}/${_id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete the record");
      }

      alert("Record deleted successfully!");

      // Call the callback function to update the table UI
      if (onDeleteSuccess) {
        onDeleteSuccess(_id);
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("Error deleting record. Please try again.");
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Paper
        sx={{
          width: 'max(940px)',
          overflow: 'hidden',
          backgroundColor: (theme) => theme.palette.background.paper,
          color: (theme) => theme.palette.text.primary,
        }}
        elevation={3}
      >
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table
            stickyHeader
            aria-label="sticky table"
            sx={{
              '& .MuiTableCell-stickyHeader': {
                backgroundColor: '#1F1F1F',
                color: '#ffffff',
                fontWeight: 'bold',
              },
              '& .MuiTableCell-root': {
                borderBottom: '1px solid #424242',
              },
              '& .MuiTableRow-root:hover': {
                backgroundColor: '#333333',
              },
            }}
          >
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    style={{ minWidth: column.minWidth }}
                  >
                    {column.label}
                  </TableCell>
                ))}
                <TableCell align="center">View</TableCell>
                <TableCell align="center">Delete</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => (
                  <TableRow hover role="checkbox" tabIndex={-1} key={index}>
                    {columns.map((column) => {
                      const value = row[column.id];
                      return (
                        <TableCell key={column.id} align={column.align}>
                          {column.format && typeof value === 'number'
                            ? column.format(value)
                            : value}
                        </TableCell>
                      );
                    })}
                    <TableCell align="center">
                      <Button
                        sx={{
                          borderColor: 'white',
                          color: 'white',
                        }}
                        size='small'
                        variant="outlined"
                        color="primary"
                        onClick={() => handleViewMore(row._id)}
                      >
                        View
                      </Button>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={() => handleDelete(row._id)}
                        aria-label="delete"
                        size="small"
                      >
                        <img
                          src={DeleteIcon}
                          alt="Delete"
                          style={{ width: 24, height: 24 }}
                        />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 100]}
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            backgroundColor: '#1c1c1c',
            color: '#ffffff',
            '& .MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
              color: '#b0bec5',
            },
            '& .MuiTablePagination-select': {
              color: '#ffffff',
            },
          }}
        />
      </Paper>
    </ThemeProvider>
  );
}

CustomTable.propTypes = {
  data: PropTypes.array.isRequired,
  columns: PropTypes.array.isRequired,
  variable1: PropTypes.string.isRequired, // `variable1` is required
  onDelete: PropTypes.string.isRequired,
  onDeleteSuccess: PropTypes.func, // Callback function to update UI after deletion
};

export default CustomTable;
