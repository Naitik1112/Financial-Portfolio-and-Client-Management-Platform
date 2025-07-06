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
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,LabelList ,Legend ,AreaChart ,Area 
} from "recharts";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { format } from 'date-fns';

import { getStyles } from "../../styles/themeStyles";
import { useThemeMode } from "../../context/ThemeContext";
import { parse } from 'date-fns';

// API functions
import { fetchAUM } from './../../js/GetAUM.js';
import { fetchMaturingFDs } from './../../js/GetFDMaturing.js';
import { fetchRecentClients } from './../../js/GetRecentClients.js';
import { fetchBusinessData } from './../../js/GetBusinessData.js';
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
    totalClients: "0",
    lumpsumTotal: "₹0",
  });
  const [userName, setUserName] = useState("User");
  const navigate = useNavigate();

  const [aumTimePeriod, setAumTimePeriod] = useState('week');
  const [businessTimePeriod, setBusinessTimePeriod] = useState('week');
  const [aumData, setAumData] = useState([]);
  const [businessData, setBusinessData] = useState([]);
  
  const [hoveredBar, setHoveredBar] = useState(null);

  const parseDMYDate = (dateString) => {
    if (!dateString) return null;
    
    // Handle if it's already a Date object
    if (dateString instanceof Date) return dateString;
    
    // Convert to string if it's not already
    const dateStr = typeof dateString === 'string' ? dateString : String(dateString);

    
    
    // Try DD/MM/YYYY format first
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // months are 0-indexed
      const year = parseInt(parts[2], 10);
      
      // Validate date components
      if (day > 0 && day <= 31 && month >= 0 && month <= 11 && year > 0) {
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    // Fallback to native Date parsing
    try {
      const fallbackDate = new Date(dateStr);
      return isNaN(fallbackDate.getTime()) ? null : fallbackDate;
    } catch (e) {
      return null;
    }
  };


  // Separate useEffect for AUM data
  useEffect(() => {
    const fetchAumData = async () => {
      try {
        const res = await fetchBusinessData(aumTimePeriod);
        console.log("AUM Data:", res);
        setAumData(res || []);
      } catch (error) {
        console.error("Error fetching AUM data:", error);
      }
    };
    fetchAumData();
  }, [aumTimePeriod]); // This will run whenever aumTimePeriod changes

  // Separate useEffect for Business data
  useEffect(() => {
    const fetchBusinessDataForPeriod = async () => {
      try {
        const res = await fetchBusinessData(businessTimePeriod);
        console.log("Business Data:", res);
        setBusinessData(res || []);
      } catch (error) {
        console.error("Error fetching business data:", error);
      }
    };
    fetchBusinessDataForPeriod();
  }, [businessTimePeriod]); // This will run whenever businessTimePeriod changes

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
            lumpsumTotal: formatCurrency(aumResponse.lumpsumTotal || 0),
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
          // console.log(aumResponse)
          // Generate product mix data from AUM response
          setProductMixData([
            { 
              name: "Mutual Funds", 
              value: aumResponse.AUM,
              amount: aumResponse.AUM
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
        console.log("fds : ",fdsResponse)
        const formattedFDs = fdsResponse?.map(fd => ({
          name: fd.bankDetails || 'Unknown Bank',
          amount: formatCurrency(fd.amount || 0),
          maturityDate: formatDate(fd.MaturityDate),
          id: fd._id
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

        // 6. Fetch and process recent claims
        const claimsResponse = await fetchRecentClaims();
        // console.log(claimsResponse)
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
          transactions: formattedTransactions.slice(0, 5),
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
    // console.log("payload",payload)
    // console.log("data",data)
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


  // useEffect(() => {
  //   console.log("AUM Data Sample:", aumData.slice(0, 3));
  //   console.log("Data Keys:", aumData.length > 0 ? Object.keys(aumData[0]) : []);
  // }, [aumData]);

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
          fontWeight: 300,
          color: fontColor,
          letterSpacing: 1,
          fontSize: '35px'
        }}
      >
        Dashboard | Welcome {userName}
      </Typography>
      
      {/* === MAIN CONTENT LAYOUT === */}
      <Grid container spacing={3} mb={6}>
        {/* === SECTION 1 === */}
        <Grid container item spacing={3}>
          {/* Left - 40% width - Four Cards (2x2 grid) */}
          <Grid item xs={12} md={4.4} sx={{ height: '100%' }}>
            <Grid container sx={{ 
              height: '100%',
              gap: 0, 
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              {/* First row container */}
              <Grid container item sx={{ gap: 5 , height: '45%' }}>
                {[0, 1].map((i) => {
                  const item = [
                    { 
                      label: "Total AUM", 
                      value: formatCurrency(productMixData.find(item => item.name === "Mutual Funds")?.amount || 0),
                      color: "#1976D2"
                    },
                    { 
                      label: "Life Insurance", 
                      value: formatCurrency(productMixData.find(item => item.name === "Life Insurance")?.amount || 0),
                      color: "#FF9800"
                    }
                  ][i];
                  return (
                    <Grid item xs sx={{ flex: 1 }}>
                      <Paper sx={{
                        ...containerStyles2,
                        borderRadius: "8px",
                        p: 2,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        height: '100%',
                        borderLeft: `4px solid ${item.color}`
                      }}>
                        <Typography variant="subtitle2" sx={{ color: "#64B5F6", fontSize: 20 }}>
                          {item.label}
                        </Typography>
                        <Typography variant="h5" sx={{ color: "#ffffff", fontSize: 25, fontWeight: 450 }}>
                          {item.value}
                        </Typography>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>

              {/* Second row container */}
              <Grid container item sx={{ gap: 5 , height: '45%' }}>
                {[0, 1].map((i) => {
                  const item = [
                    { 
                      label: "General Insurance", 
                      value: formatCurrency(productMixData.find(item => item.name === "General Insurance")?.amount || 0),
                      color: "#4CAF50"
                    },
                    { 
                      label: "Fixed Deposits", 
                      value: formatCurrency(productMixData.find(item => item.name === "Fixed Deposits")?.amount || 0),
                      color: "#9C27B0"
                    }
                  ][i];
                  return (
                    <Grid item xs sx={{ flex: 1 }}>
                      <Paper sx={{
                        ...containerStyles2,
                        borderRadius: "8px",
                        p: 2,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        height: '100%',
                        borderLeft: `4px solid ${item.color}`
                      }}>
                        <Typography variant="subtitle2" sx={{ color: "#64B5F6", fontSize: 20 }}>
                          {item.label}
                        </Typography>
                        <Typography variant="h5" sx={{ color: "#ffffff", fontSize: 25, fontWeight: 450 }}>
                          {item.value}
                        </Typography>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Grid>
          </Grid>
          {/* Right - 60% width - Business Trend Line with Gradient */}
          <Grid item xs={12} md={7.6}>
            <Paper sx={{ ...containerStyles, height: '100%' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1">AUM Trend</Typography>
                <Box>
                  <Button 
                    size="small" 
                    color={aumTimePeriod === 'week' ? 'primary' : 'inherit'}
                    onClick={() => setAumTimePeriod('week')}
                    sx={{ minWidth: 0, color: aumTimePeriod === 'week' ? '#1976D2' : '#bbb' }}
                  >
                    Week
                  </Button>
                  <Button 
                    size="small" 
                    color={aumTimePeriod === 'month' ? 'primary' : 'inherit'}
                    onClick={() => setAumTimePeriod('month')}
                    sx={{ minWidth: 0, color: aumTimePeriod === 'month' ? '#1976D2' : '#bbb' }}
                  >
                    Month
                  </Button>
                  <Button 
                    size="small" 
                    color={aumTimePeriod === 'year' ? 'primary' : 'inherit'}
                    onClick={() => setAumTimePeriod('year')}
                    sx={{ minWidth: 0, color: aumTimePeriod === 'year' ? '#1976D2' : '#bbb' }}
                  >
                    Year
                  </Button>
                </Box>
              </Box>
              <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={aumData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1976D2" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#1976D2" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorLife" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF9800" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#FF9800" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorGeneral" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4CAF50" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorFd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9C27B0" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#9C27B0" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#333" strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#bbb"
                    tickFormatter={(value) => {
                      if (!value) return '';
                      const date = parseDMYDate(value);
                      if (!date || isNaN(date.getTime())) return '';
                      
                      if (aumTimePeriod === 'year') return date.getFullYear();
                      if (aumTimePeriod === 'month') return date.toLocaleString('default', { month: 'short' });
                      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                    }}
                  />
                  <YAxis stroke="#bbb" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1E1E1E", border: '1px solid #333' }}
                    itemStyle={{ color: "#FFF" }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="AUM" 
                    name="Total AUM"
                    stroke="#1976D2" 
                    fillOpacity={1} 
                    fill="url(#colorTotal)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="lifeInsuranceTotal" 
                    name="Life Insurance"
                    stroke="#FF9800" 
                    fillOpacity={1} 
                    fill="url(#colorLife)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="generalInsuranceTotal" 
                    name="General Insurance"
                    stroke="#4CAF50" 
                    fillOpacity={1} 
                    fill="url(#colorGeneral)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="fdTotalAmount" 
                    name="Fixed Deposits"
                    stroke="#9C27B0" 
                    fillOpacity={1} 
                    fill="url(#colorFd)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* === SECTION 2 === */}
        <Grid container item spacing={3} mt={0}>
          {/* Left - 60% width - Business Analysis */}
          <Grid item xs={12} md={6.8}>
            <Paper sx={{ ...containerStyles, height: '400px' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1">Business Analysis (Net Flow)</Typography>
                <Box>
                  <Button 
                    size="small" 
                    color={businessTimePeriod === 'week' ? 'primary' : 'inherit'}
                    onClick={() => setBusinessTimePeriod('week')}
                    sx={{ minWidth: 0, color: businessTimePeriod === 'week' ? '#1976D2' : '#bbb' }}
                  >
                    Week
                  </Button>
                  <Button 
                    size="small" 
                    color={businessTimePeriod === 'month' ? 'primary' : 'inherit'}
                    onClick={() => setBusinessTimePeriod('month')}
                    sx={{ minWidth: 0, color: businessTimePeriod === 'month' ? '#1976D2' : '#bbb' }}
                  >
                    Month
                  </Button>
                  <Button 
                    size="small" 
                    color={businessTimePeriod === 'year' ? 'primary' : 'inherit'}
                    onClick={() => setBusinessTimePeriod('year')}
                    sx={{ minWidth: 0, color: businessTimePeriod === 'year' ? '#1976D2' : '#bbb' }}
                  >
                    Year
                  </Button>
                </Box>
              </Box>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart 
                  data={businessData.map(item => ({
                    ...item,
                    netFlow: (item.todaySip || 0) + (item.todayLumpsum || 0) - (item.todayRedemption || 0)
                  }))}
                  stackOffset="sign"
                >
                  <CartesianGrid stroke="#333" strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#bbb" 
                    tickFormatter={(value) => {
                      if (!value) return '';
                      const date = parseDMYDate(value);
                      if (!date) return '';
                      
                      if (businessTimePeriod === 'year') return date.getFullYear();
                      if (businessTimePeriod === 'month') return date.toLocaleString('default', { month: 'short' });
                      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                    }}
                  />
                  <YAxis stroke="#bbb" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1E1E1E", border: '1px solid #333' }}
                    itemStyle={{ color: "#FFF" }}
                    formatter={(value, name) => {
                      const formattedValue = formatCurrency(value);
                      return [formattedValue, name];
                    }}
                  />
                  <Legend />
                  {/* Inflows (positive) */}
                  <Bar dataKey="todaySip" stackId="stack" fill="#1976D2" name="SIP" barSize={20} />
                  <Bar dataKey="todayLumpsum" stackId="stack" fill="#64B5F6" name="Lumpsum" barSize={20}/>
                  {/* Outflows (negative) */}
                  <Bar dataKey="todayRedemption" stackId="stack" fill="#FF7043" name="Redemption" barSize={20}/>
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Right - 40% width - Product Mix with Responsive Layout */}
          <Grid item xs={12} md={5.2}>
            {/* Add label */}
            <Paper
              sx={{
                ...containerStyles,
                height: { xs: 'auto', md: '400px' },
              }}
            >
              <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                Product Mix
              </Typography>
              <Box 
                sx={{
                  height: { xs: 'auto', md: 'calc(100% - 40px)' }, // Subtract the height of the Typography
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  overflow: 'hidden',
                  gap: 1
                }}
              >
                {/* Pie Chart Box */}
                <Box
                  sx={{
                    width: { xs: '100%', md: '50%' },
                    height: { xs: '300px', md: '100%' }, // Fixed height on xs, full height on md
                    minHeight: 0, // Important for proper containment
                    flexShrink: 0,
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={productMixData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius="80%"
                        innerRadius="60%"
                        labelLine={false}
                      >
                        {productMixData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#fff", border: '1px solid #333' }}
                        formatter={(value, name) => [formatCurrency(value), name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>

                {/* Table Box */}
                <Box
                  sx={{
                    width: { xs: '100%', md: '50%' },
                    height: { xs: 'auto', md: '100%' },
                    minHeight: 0, // Important for proper containment
                    flex: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    p: 1
                  }}
                >
                  <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
                    <Table size="small" sx={{ height: '100%' }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: '#64B5F6', borderColor: '#333' }}>Product</TableCell>
                          <TableCell sx={{ color: '#64B5F6', borderColor: '#333' }} align="right">Amount</TableCell>
                          <TableCell sx={{ color: '#64B5F6', borderColor: '#333' }} align="right">%</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {productMixData.map((row) => {
                          const total = productMixData.reduce((sum, item) => sum + item.value, 0);
                          const percentage = (row.value / total * 100).toFixed(1);
                          return (
                            <TableRow key={row.name}>
                              <TableCell sx={{ color: '#fff', borderColor: '#333' }}>{row.name}</TableCell>
                              <TableCell sx={{ color: '#fff', borderColor: '#333' }} align="right">
                                {formatCurrency(row.amount)}
                              </TableCell>
                              <TableCell sx={{ color: '#fff', borderColor: '#333' }} align="right">
                                {percentage}%
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Box>
            </Paper>
          </Grid>
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
                  onClick={() => {
                    navigate(`/DebtsUpdate/${fd.id}`) 
                  }}
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