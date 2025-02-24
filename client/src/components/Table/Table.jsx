import { useState } from "react";
import "./Table.css";

const App = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  const customers = [
    {
      id: 1,
      srNo: 1,
      clientName: "Zinzu Chan Lee",
      groupName: "Group A",
      age: 34,
      sip: 10,
      lifeIn: 5,
      generalIn: 4,
      healthIn: 1,
      personalIn: 2,
    },
    {
      id: 2,
      srNo: 2,
      clientName: "Jeet Saru",
      groupName: "Group B",
      age: 29,
      sip: 6,
      lifeIn: 2,
      generalIn: 4,
      healthIn: 9,
      personalIn: 2,
    },
    {
      id: 3,
      srNo: 3,
      clientName: "Sonal Gharti",
      groupName: "Group C",
      age: 40,
      sip: 7000,
      lifeIn: 5,
      generalIn: 9,
      healthIn: 7,
      personalIn: 7,
    },
  ];

  const filteredCustomers = customers.filter((customer) =>
    Object.values(customer)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortColumn) {
      const valueA = a[sortColumn].toString().toLowerCase();
      const valueB = b[sortColumn].toString().toLowerCase();
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

  // const exportToCSV = () => {
  //   const headers = Object.keys(customers[0]).join(",");
  //   const rows = customers
  //     .map((customer) =>
  //       Object.values(customer)
  //         .map((value) => `"${value}"`)
  //         .join(",")
  //     )
  //     .join("\n");
  //   const csvData = `${headers}\n${rows}`;
  //   downloadFile(csvData, "customers.csv", "text/csv");
  // };

  // const downloadFile = (data, fileName, mimeType) => {
  //   const blob = new Blob([data], { type: mimeType });
  //   const link = document.createElement("a");
  //   link.href = URL.createObjectURL(blob);
  //   link.download = fileName;
  //   link.click();
  // };

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
          <img src="./../../assets/search.png" alt="" />
        </div>
        <div className="export__file">
          <button onClick={() => (window.location.href = "/addClient")}>Add Client</button>
          {/* <button onClick={exportToCSV}>Export to CSV</button> */}
        </div>
      </section>
      <section className="table__body">
        <table>
          <thead>
            <tr>
              {Object.keys(customers[0])
                .filter((key) => key !== "id") // Exclude "id" from being displayed
                .map((key) => (
                  <th key={key} onClick={() => handleSort(key)}>
                    {key} <span>{sortAsc ? "↑" : "↓"}</span>
                  </th>
                ))}
              <th>Actions</th> {/* Add an Actions column */}
            </tr>
          </thead>
          <tbody>
            {sortedCustomers.map((customer) => (
              <tr key={customer.id}>
                {Object.entries(customer)
                  .filter(([key]) => key !== "id") // Exclude "id" from being displayed
                  .map(([key, value]) => (
                    <td key={key}>{value}</td>
                  ))}
                <td>
                  <button
                    // onClick={() => (window.location.href = `/profile/${customer.id}`)}
                    onClick={() => (window.location.href = "/profile")}
                    className="view-more-btn"
                  >
                    View More
                  </button>
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
