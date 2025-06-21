import { useState, useEffect } from "react";
import "./Table.css";
import Brand from "./../../assets/search.png";
import DeleteIcon from "./../../assets/delete.png";

const App = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [customers, setCustomers] = useState([]);
  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('jwt');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const token = localStorage.getItem('jwt');
        
        const response = await fetch(`${backendURL}/api/v1/users/`, {
          method: "GET",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();
        setCustomers(data.data.data);
      } catch (error) {
        console.error("Error fetching data:", error);
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
      const valueA = a[sortColumn] ? a[sortColumn].toString().toLowerCase() : "";
      const valueB = b[sortColumn] ? b[sortColumn].toString().toLowerCase() : "";
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
    <main className="table" id="customers_table">
      <section className="table__header">
        <div className="input-group">
          <input
            type="search"
            placeholder="Search Data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <img src={Brand} alt="Search" />
        </div>
        <button
          onClick={() => (window.location.href = "/addClient")}
          className="view-more-btn"
          style={{ backgroundColor: "rgb(61, 61, 61)", color: "rgb(198, 198, 198)",borderWidth:'0px' }}
        >
          Add Client
        </button>
      </section>
      <section className="table__body">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort("name")}>
                Name <span>{sortAsc && sortColumn === "name" ? "↑" : "↓"}</span>
              </th>
              <th onClick={() => handleSort("DOB")}>
                DOB <span>{sortAsc && sortColumn === "DOB" ? "↑" : "↓"}</span>
              </th>
              <th onClick={() => handleSort("group")}>
                Group <span>{sortAsc && sortColumn === "group" ? "↑" : "↓"}</span>
              </th>
              <th onClick={() => handleSort("age")}>
                Age <span>{sortAsc && sortColumn === "age" ? "↑" : "↓"}</span>
              </th>
              <th>Actions</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {sortedCustomers.map((customer) => (
              <tr key={customer._id}>
                <td>{customer.name || "n.d."}</td>
                <td>{customer.DOB ? new Date(customer.DOB).toLocaleDateString() : "n.d."}</td>
                <td>{customer.group || "n.d."}</td>
                <td>{parseInt(customer.age, 10) || "n.d."}</td>
                <td>
                  <button
                    onClick={() => (window.location.href = `/profile/${customer._id}`)}
                    className="view-more-btn"
                    style={{
                      padding:'7px',
                      fontSize: '14px',
                      borderWidth: '0px',
                      borderRadius:'5px'
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
    </main>
  );
};

export default App;
