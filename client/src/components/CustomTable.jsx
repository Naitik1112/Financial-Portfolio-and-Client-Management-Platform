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
import DeleteIcon from './../assets/delete.png';
import { useTheme } from '@mui/material/styles';
import { getStyles } from "../styles/themeStyles";
import { useThemeMode } from "../context/ThemeContext";
import Box from '@mui/material/Box';

function CustomTable({ data, columns, variable1, onDeleteSuccess, onDelete }) {
  const theme = useTheme();
  const { darkMode } = useThemeMode();
  const { containerStyles, containerStyles1 } = getStyles(darkMode);
  const { primaryColor, secondaryColor, tertiaryColor, body, background1, background2, background, fourthColor, fontColor, background3 } = getStyles(darkMode);

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      background: {
        paper: background,
        default: background1,
      },
      text: {
        primary: fontColor,
        secondary: secondaryColor,
      },
    },
    components: {
      MuiTableCell: {
        styleOverrides: {
          root: {
            padding: '12px 16px',
          },
        },
      },
    },
  });

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

  const backendURL = import.meta.env.VITE_BACKEND_URL;

  const handleDelete = async (_id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this record?");
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('jwt');
      const response = await fetch(`${backendURL}/api/v1/${onDelete}/${_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error("Failed to delete the record");
      alert("Record deleted successfully!");
      if (onDeleteSuccess) onDeleteSuccess(_id);
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("Error deleting record. Please try again.");
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Paper
        sx={{
          width: '100%',
          minWidth: { xs: '200px',sm : '300px', md: '750px', lg : '800px' , xl: 'max(80%,800px)' },
          maxWidth: { xs: '300px',sm : '500px', md: '850px', lg : '900px' , xl: 'max(80%,900px)' },
          overflow: 'hidden',
          backgroundColor: background1,
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        }}
        elevation={3}
      >
        <TableContainer sx={{ 
          maxHeight: 500,
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: background1,
          },
          '&::-webkit-scrollbar-thumb': {
            background: tertiaryColor,
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: secondaryColor,
          }
        }}>
          <Table
            stickyHeader
            aria-label="sticky table"
            sx={{
              '& .MuiTableCell-stickyHeader': {
                backgroundColor: background1,
                color: fontColor,
                fontWeight: '600',
                fontSize: '0.875rem',
                borderBottom: `2px solid ${tertiaryColor}`,
              },
              '& .MuiTableCell-root': {
                borderBottom: `1px solid ${background1}`,
                fontSize: '0.875rem',
              },
              '& .MuiTableRow-root:hover': {
                backgroundColor: background1,
                transition: 'background-color 0.2s ease',
              },
              '& .MuiTableRow-root:nth-of-type(even)': {
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
              },
              '& .MuiTableRow-root:nth-of-type(even):hover': {
                backgroundColor: background1,
              },
            }}
          >
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align || 'left'}
                    style={{ 
                      minWidth: column.minWidth,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {column.label}
                  </TableCell>
                ))}
                <TableCell align="center" style={{ minWidth: 120 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => (
                  <TableRow 
                    hover 
                    role="checkbox" 
                    tabIndex={-1} 
                    key={index}
                    sx={{
                      '&:last-child td': {
                        borderBottom: 'none'
                      }
                    }}
                  >
                    {columns.map((column) => {
                      const value = row[column.id];
                      return (
                        <TableCell 
                          key={column.id} 
                          align={column.align || 'left'}
                          sx={{
                            color: column.color || 'inherit',
                            fontWeight: column.fontWeight || 'normal'
                          }}
                        >
                          {column.format && typeof value === 'number'
                            ? column.format(value)
                            : value}
                        </TableCell>
                      );
                    })}
                   <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewMore(row._id)}
                          sx={{
                            color: fontColor,
                            borderColor: fontColor,
                            '&:hover': {
                              backgroundColor: `${secondaryColor}20`,
                              borderColor: secondaryColor,
                            },
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            px: 1.5,
                            py: 0.5,
                          }}
                        >
                          View
                        </Button>
                        <IconButton
                          onClick={() => handleDelete(row._id)}
                          aria-label="delete"
                          size="small"
                          sx={{
                            color: '#ff5252',
                            '&:hover': {
                              backgroundColor: '#ff525220',
                            },
                          }}
                        >
                          <img
                            src={DeleteIcon}
                            alt="Delete"
                            style={{ 
                              width: '18px',
                              height: '18px', // Fixed equal dimensions work better than '100%'
                              objectFit: 'contain' // Ensures proper image scaling
                            }}
                          />
                        </IconButton>
                      </Box>
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
            backgroundColor: background3,
            color: fontColor,
            borderTop: `1px solid ${fontColor}`,
            '& .MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
              color: fontColor,
              fontSize: '0.875rem',
            },
            '& .MuiTablePagination-select': {
              color: fontColor,
            },
            '& .MuiSvgIcon-root': {
              color: fontColor,
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
  variable1: PropTypes.string.isRequired,
  onDelete: PropTypes.string.isRequired,
  onDeleteSuccess: PropTypes.func,
};

export default CustomTable;