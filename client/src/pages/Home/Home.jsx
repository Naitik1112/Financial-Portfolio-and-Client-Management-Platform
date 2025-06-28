import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  CircularProgress,
  Button,
} from "@mui/material";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { format } from 'date-fns';

import { getStyles } from "../../styles/themeStyles";
import { useThemeMode } from "../../context/ThemeContext";

// API functions
import { fetchAUM } from './../../js/GetAUM.js';
import { fetchMaturingFDs } from './../../js/GetFDMaturing.js';
import { fetchRecentClients } from './../../js/GetRecentClients.js';
import { fetchRecentMutualFunds } from './../../js/GetRecentMutualFund.js';
import { fetchRecentRedemptions } from './../../js/GetRecentRedemmed.js';
import { fetchRecentClaims } from './../../js/GetRecentClaims.js';
import { fetchClients } from './../../js/GetNumberOfClients.js';
import { fetchLoggedInUser } from './../../js/GetLoggedInUser.js';

import { useNavigate } from 'react-router-dom';
import { secondsInDay } from "date-fns/constants";


// Helper functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    return format(new Date(dateString), 'dd-MM-yyyy');
  } catch (e) {
    return dateString;
  }
};

const Home = () => {
  const tableCellStyle = { color: "#f0f0f0" };
  const { darkMode } = useThemeMode();
  const { containerStyles, containerStyles2 } = getStyles(darkMode);
  const { secondaryColor, fontColor, body , fourthColor, tertiaryColor, primaryColor , background1 ,background2 ,background } = getStyles(darkMode);
  const tableHeaderStyle = { fontWeight: "bold", color: "#64B5F6" , backgroundColor: body};
  
  const COLORS = [primaryColor, secondaryColor,primaryColor ,"#80CBC4","#64B5F6"];

  // State for all data
  const [loading, setLoading] = useState(true);
  const [aumTrendData, setAumTrendData] = useState([]);
  const [sipFlowData, setSipFlowData] = useState([]);
  const [productMixData, setProductMixData] = useState([]);
  const [tableData, setTableData] = useState({
    fds: [],
    sips: [],
    transactions: [],
    onboarded: [],
    claims: []
  });
  const [stats, setStats] = useState({
    totalAUM: "₹0",
    sipBookSize: "₹0",
    totalClients: "0"
  });
  const [userName, setUserName] = useState("User");
  const navigate = useNavigate();

  // Fetch all data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Fetch logged in user
        const userResponse = await fetchLoggedInUser();
        if (userResponse?.data?.name) {
          setUserName(userResponse.data.name);
        }

        // Fetch total clients count
        const clientsCount = await fetchClients();
        
        // 1. Fetch and process AUM data
        const aumResponse = await fetchAUM();
        if (aumResponse) {
          setStats({
            totalAUM: formatCurrency(aumResponse.AUM || 0),
            sipBookSize: formatCurrency(aumResponse.sipTotalBook || 0),
            totalClients: clientsCount?.toString() || "0"
          });

          // Generate AUM trend data (last 5 months)
          const currentMonth = new Date().getMonth();
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const trendData = [];
          for (let i = 4; i >= 0; i--) {
            const monthIndex = (currentMonth - i + 12) % 12;
            trendData.push({
              month: months[monthIndex],
              aum: Math.round((aumResponse.AUM || 0) * (0.9 + Math.random() * 0.2) // Simulate growth
            )});
          }
          setAumTrendData(trendData);
          console.log(aumResponse)
          // Generate product mix data from AUM response
          setProductMixData([
            { 
              name: "Mutual Funds", 
              value: aumResponse.lumpsumTotal + aumResponse.sipTotalBook,
              amount: aumResponse.lumpsumTotal + aumResponse.sipTotalBook
            },
            { 
              name: "Fixed Deposits", 
              value: aumResponse.fdTotalAmount,
              amount: aumResponse.fdTotalAmount
            },
            { 
              name: "Life Insurance", 
              value: aumResponse.lifeInsuranceTotal,
              amount: aumResponse.lifeInsuranceTotal
            },
            { 
              name: "General Insurance", 
              value: aumResponse.generalInsuranceTotal,
              amount: aumResponse.generalInsuranceTotal
            }
          ]);
        }

        // 2. Fetch and process maturing FDs
        const fdsResponse = await fetchMaturingFDs();
        const formattedFDs = fdsResponse?.map(fd => ({
          name: fd.bankDetails || 'Unknown Bank',
          amount: formatCurrency(fd.amount || 0),
          maturityDate: formatDate(fd.MaturityDate)
        })) || [];
        
        // 3. Fetch and process recent clients
        const clientsResponse = await fetchRecentClients();
        const formattedClients = clientsResponse?.map(client => ({
          name: client.name || 'Unknown Client',
          date: formatDate(client.createdAt),
          age: client.age || '-'
        })) || [];

        // 4. Fetch and process recent mutual funds (transactions)
        const mfResponse = await fetchRecentMutualFunds();
        const formattedTransactions = mfResponse?.slice(0, 5).map(mf => ({
          date: formatDate(mf.createdAt),
          type: mf.investmentType || 'Unknown',
          scheme: mf.name || 'Unknown Scheme',
          client: mf.holderName || 'Unknown Client',
          amount: formatCurrency(mf.amount || 0),
          id : mf.id
        })) || [];

        // 5. Fetch and process recent redemptions (SIPs)
        const redemptionsResponse = await fetchRecentRedemptions();
        const formattedSIPs = redemptionsResponse?.slice(0, 5).map(red => ({
          scheme: red.name || 'Unknown Scheme',
          amount: formatCurrency(red.amount || 0),
          nextDue: formatDate(red.lastRedemptionDate) || '-'
        })) || [];

        // 6. Fetch and process recent claims
        const claimsResponse = await fetchRecentClaims();
        console.log(claimsResponse)
        const formattedClaims = claimsResponse?.slice(0, 5).map(claim1 => ({
          client: claim1.clientName || 'Unknown Client',
          type: claim1.policyName || 'Unknown',
          status: claim1.status || 'Pending',
          requestDate: formatDate(claim1.requestDate),
          approvalDate: formatDate(claim1.approvalDate),
          approvalClaim: (claim1.approvalClaim),
          requestClaim: (claim1.claim),
          insuranceId : (claim1.generalInsuranceId)

        })) || [];

        // 7. Generate SIP flow data (mock based on API data)
        const sipInflow = aumResponse?.sipTotalBook || 0;
        setSipFlowData([
          { name: "Week 1", inflow: sipInflow * 0.25, outflow: sipInflow * 0.1 },
          { name: "Week 2", inflow: sipInflow * 0.5, outflow: sipInflow * 0.15 },
          { name: "Week 3", inflow: sipInflow * 0.75, outflow: sipInflow * 0.2 },
          { name: "Week 4", inflow: sipInflow, outflow: sipInflow * 0.25 },
        ]);

        // Update table data with API responses
        setTableData({
          fds: formattedFDs.slice(0, 5),
          sips: formattedSIPs.slice(0, 5),
          transactions: formattedTransactions.slice(0, 5),
          onboarded: formattedClients.slice(0, 5),
          claims: formattedClaims.slice(0, 5)
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (loading) {
    return (
      <Box sx={{
        backgroundColor: body,
        minHeight: "100vh",
        pt: "90px",
        pl: { xs: "80px", md: "80px" },
        pr: { xs: 2, md: 4 },
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ color: fontColor }}>
          Loading Dashboard Data...
        </Typography>
      </Box>
    );
  }

  const CustomTooltip = ({ active, payload, label, data }) => {
    console.log("payload",payload)
    console.log("data",data)
    if (active && payload && payload.length) {
      const total = data.reduce((sum, item) => sum + item.value, 0);
      const currentItem = payload[0].payload;
      const percentage = (currentItem.value / total) * 100;

      return (
        <div style={{
          backgroundColor: tertiaryColor,
          padding: '10px',
          borderRadius: '5px',
          border: '1px solid rgb(35, 40, 33)'
        }}>
          <p style={{ margin: 0, color: '#fff', fontWeight: 'bold' }}>{currentItem.name}</p>
          <p style={{ margin: '5px 0 0 0', color: payload[0].color }}>
            Amount: {formatCurrency(currentItem.value)}
          </p>
          <p style={{ margin: '5px 0 0 0', color: payload[0].color }}>
            Percentage: {percentage.toFixed(2)}%
          </p>
        </div>
      );
    } 
    return null;
  };

  return (
    <Box sx={{
      backgroundColor: body,
      minHeight: "100vh",
      pt: "90px",
      pl: { xs: "80px", md: "80px" },
      pr: { xs: 2, md: 4 },
    }}>
      <Typography
        variant="h4"
        align="left"
        sx={{
          mb: 4,
          fontWeight: 'bold',
          color: fontColor,
          letterSpacing: 1,
          fontSize: '25px'
        }}
      >
        Dashboard | Welcome {userName}
      </Typography>
      
      {/* === TOP STATS === */}
      <Grid container spacing={5} mb={6}>
        {[
          {
            label: "Total AUM",
            value: stats.totalAUM,
            note: "Increased from last month",
          },
          {
            label: "SIP Book Size",
            value: stats.sipBookSize,
            note: "Increased from last month",
          },
          {
            label: "Total Clients",
            value: stats.totalClients,
            note: "New clients onboarded",
          },
        ].map((item, i) => (
          <Grid item xs={12} sm={4} key={i}>
            <Paper
              sx={{
                ...containerStyles2,
                borderRadius: "8px",
                p: 3,
                display: "flex",
                flexDirection: "column",
                gap: 1,
                height: "100%",
                borderColor: '#1976D2',
                borderWidth: '0px'
              }}
            >
              <Typography variant="subtitle2" sx={{ color: "#64B5F6" }}>
                {item.label}
              </Typography>
              <Typography variant="h4" sx={{ color: "#ffffff" }}>
                {item.value}
              </Typography>
              <Box display="flex" alignItems="center" mt={1} gap={1}>
                <ArrowUpwardIcon fontSize="small" sx={{ color: "#64B5F6" }} />
                <Typography variant="caption" sx={{ color: "#64B5F6" }}>
                  {item.note}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* === CHARTS === */}
      <Grid container spacing={5} mb={6}>
        <Grid item xs={12} md={4}>
          <Paper sx={containerStyles}>
            <Typography variant="subtitle1" mb={2}>AUM Trend</Typography>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={aumTrendData}>
                <CartesianGrid stroke="#333" />
                <XAxis dataKey="month" stroke="#bbb" />
                <YAxis stroke="#bbb" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#222" }} 
                  labelStyle={{ color: "#64B5F6" }} 
                  itemStyle={{ color: "#FFF" }}
                  formatter={(value) => [formatCurrency(value), 'AUM']}
                />
                <Line type="monotone" dataKey="aum" stroke="#1976D2" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={containerStyles}>
            <Typography variant="subtitle1" mb={2}>SIP Inflows vs Outflows</Typography>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sipFlowData}>
                <CartesianGrid stroke="#333" />
                <XAxis dataKey="name" stroke="#bbb" />
                <YAxis stroke="#bbb" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#2a2a2a" }} 
                  itemStyle={{ color: '#f5f5f5' }}
                  formatter={(value) => [formatCurrency(value), value === 'inflow' ? 'Inflow' : 'Outflow']}
                />
                <Bar dataKey="inflow" fill="#1976D2" name="Inflow" />
                <Bar dataKey="outflow" fill="#64B5F6" name="Outflow" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={containerStyles}>
            <Typography variant="subtitle1" mb={2}>Product Mix</Typography>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie 
                  data={productMixData} 
                  dataKey="value" 
                  nameKey="name" 
                  outerRadius={70} 
                  innerRadius={40}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {productMixData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip data={productMixData} />} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* === TABLES === */}
      <Grid container spacing={6}>
        {[{
          title: "Today's Maturing FDs", 
          columns: ["Name", "Amount", "Maturity Date", "Action"], 
          rows: tableData.fds.length > 0 
            ? tableData.fds.map(fd => [fd.name, fd.amount, fd.maturityDate, 
                <Button 
                  variant="outlined" 
                  size="small" 
                  sx={{ color: '#64B5F6', borderColor: '#64B5F6' }}
                  onClick={() => console.log('View FD:', fd.name)}
                >
                  View
                </Button>])
            : [['No maturing FDs today', '-', '-', '-']]
        }, 
        // {
        //   title: "Recent Redemption", 
        //   columns: ["Scheme", "Amount", "Redemption Date"], 
        //   rows: tableData.sips.length > 0
        //     ? tableData.sips.map(sip => [sip.scheme, sip.amount, sip.nextDue,
        //         // <Button 
        //         //   variant="outlined" 
        //         //   size="small" 
        //         //   sx={{ color: '#64B5F6', borderColor: '#64B5F6' }}
        //         //   onClick={() => console.log('View SIP:', sip.scheme)}
        //         // >
        //         //   View
        //         // </Button>
        //         ])
        //     : [['No recent SIPs', '-', '-', '-']]
        // }, 
        {
          title: "Recently added Mutual Funds", 
          columns: ["Date", "Client", "Type", "Scheme", "Amount", "Action"], 
          rows: tableData.transactions.length > 0
            ? tableData.transactions.map(t => [t.date, t.client, t.type, t.scheme, t.amount,
                <Button 
                  variant="outlined" 
                  size="small" 
                  sx={{ color: '#64B5F6', borderColor: '#64B5F6' }}
                  onClick={() => {
                    navigate(`/MutualfundsUpdate/${t.id}`) 
                  }}
                >
                  View
                </Button>])
            : [['No recent transactions', '-', '-', '-', '-', '-']]
        }, 
        // {
        //   title: "Recently Onboarded Clients", 
        //   columns: ["Name", "Date", "Age", "Action"], 
        //   rows: tableData.onboarded.length > 0
        //     ? tableData.onboarded.map(c => [c.name, c.date, c.age,
        //         <Button 
        //           variant="outlined" 
        //           size="small" 
        //           sx={{ color: '#64B5F6', borderColor: '#64B5F6' }}
        //           onClick={() => console.log('View Client:', c.name)}
        //         >
        //           View
        //         </Button>])
        //     : [['No recently onboarded clients', '-', '-', '-']]
        // }, 
        {
          title: "Recently Submitted Claims", 
          columns: ["Client", "Type" , 'Request Date','Request Amount' , " Approval Date",'Approval Amount', "Action"], 
          rows: tableData.claims.length > 0
            ? tableData.claims.map(c => [c.client, c.type, c.requestDate, c.requestClaim, c.approvalDate,c.approvalClaim,
                <Button 
                  variant="outlined" 
                  size="small" 
                  sx={{ color: '#64B5F6', borderColor: '#64B5F6' }}
                  onClick={() => {
                    navigate(`/GeneralUpdate/${c.insuranceId}`); // or replace `insuranceId` with appropriate key in `c`
                  }}
                >
                  View
                </Button>])
            : [['No recent claims', '-', '-', '-', '-']]
        }].map((section, i) => (
          <Grid item xs={12} md={i === 2 ? 12 : 6} key={section.title}>
            <Paper sx={{ ...containerStyles, height: '100%' }}>
              <Typography variant="subtitle1" mb={2}>{section.title}</Typography>
              <Divider sx={{ borderColor: "#444", mb: 1 }} />
              <TableContainer sx={{ maxHeight: 300, overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead sx = {{backgroundColor: "#111"}}>
                    <TableRow>
                      {section.columns.map((col, j) => (
                        <TableCell key={j} sx={tableHeaderStyle}>{col}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {section.rows.map((row, k) => (
                      <TableRow key={k}>
                        {row.map((cell, l) => (
                          <TableCell key={l} sx={tableCellStyle}>{cell}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Home;