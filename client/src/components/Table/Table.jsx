import { useState, useEffect } from "react";
import "./Table.css";
import Brand from "./../../assets/search.png";
import DeleteIcon from "./../../assets/delete.png";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

import { useThemeMode } from '../../context/ThemeContext';
import { getStyles } from "../../styles/themeStyles";

const App = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('jwt');

  const { darkMode } = useThemeMode();
  const {
    primaryColor,
    secondaryColor,
    tertiaryColor,
    fourthColor,
    fontColor,
    background,
    background1,
    background2,
    background3,
  } = getStyles(darkMode);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${backendURL}/api/v1/users/`, {
          method: "GET",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();
        setCustomers(data.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const handleDelete = async (customer) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete ${customer.name}?`);
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${backendURL}/api/v1/users/${customer._id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
           'Content-Type': 'application/json',
           Authorization: `Bearer ${token}`
         },
      });
      if (response.ok) {
        setCustomers(customers.filter((c) => c._id !== customer._id));
        alert(`${customer.name} has been deleted`);
      } else {
        console.error("Failed to delete customer");
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  };

  const filteredCustomers = customers.filter((customer) =>
    Object.values(customer)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortColumn) {
      const valueA = a[sortColumn]?.toString().toLowerCase() || "";
      const valueB = b[sortColumn]?.toString().toLowerCase() || "";
      return sortAsc ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
    }
    return 0;
  });

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortColumn(column);
      setSortAsc(true);
    }
  };

  return (
    <main style={{
        backgroundColor: fourthColor,
        color: fontColor,
        borderRadius: '10px',
        padding: '20px',
        boxShadow: `0 0 8px ${primaryColor}`,
        fontFamily: 'sans-serif'
      }}
      className="table" 
      id="customers_table">
      
      <section className="table__header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          padding: "12px 20px",
          borderRadius: "8px"
        }}
      >
        <div className="input-group"
          style={{
            display: "flex",
            alignItems: "center",
            border: `1px solid ${tertiaryColor}`,
            backgroundColor: background1,
            borderRadius: "15px",
            padding: "6px 16px",
            gap: "10px"
          }}
        >
          <input
            type="search"
            placeholder="Search Data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              color: fontColor,
              outline: "none"
            }}
          />
          <img src={Brand} alt="Search" />
        </div>
        <button
          onClick={() => (window.location.href = "/addClient")}
          className="view-more-btn"
          style={{
            backgroundColor: tertiaryColor,
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          Add Client
        </button>
      </section>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
          <CircularProgress sx={{ color: primaryColor }} />
        </Box>
      ) : (
        <section className="table__body">
          <table>
            <thead style={{ backgroundColor: background2 }}>
              <tr>
                {["name", "DOB", "group", "age"].map((col) => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    style={{
                      cursor: "pointer",
                      borderBottom: `1px solid ${primaryColor}`
                    }}
                  >
                    {col.toUpperCase()} <span>{sortAsc && sortColumn === col ? "↑" : "↓"}</span>
                  </th>
                ))}
                <th style={{ borderBottom: `1px solid ${primaryColor}` }}>Actions</th>
                <th style={{ borderBottom: `1px solid ${primaryColor}` }}>Delete</th>
              </tr>
            </thead>
            <tbody>
              {sortedCustomers.map((customer) => (
                <tr key={customer._id}
                  style={{
                    borderBottom: `2px solid ${tertiaryColor}`,
                    backgroundColor: background3
                  }}>
                  <td>{customer.name || "N/A"}</td>
                  <td>{customer.DOB ? new Date(customer.DOB).toLocaleDateString() : "N/A"}</td>
                  <td>{customer?.groupId?.name || "n.d."}</td>
                  <td>{parseInt(customer.age, 10) || "N/A"}</td>
                  <td>
                    <button
                      onClick={() => (window.location.href = `/profile/${customer._id}`)}
                      className="view-more-btn"
                      style={{
                        backgroundColor: background2,
                        color: "#fff",
                        padding: "6px 12px",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "14px",
                        cursor: "pointer"
                      }}
                    >
                      View More
                    </button>
                  </td>
                  <td>
                    <img
                      src={DeleteIcon}
                      alt="Delete"
                      className="delete-icon"
                      onClick={() => handleDelete(customer)}
                      style={{ cursor: "pointer", width: "20px", height: "20px" }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
};

export default App;
