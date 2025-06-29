// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import { useEffect } from 'react';
import axios from 'axios';
import {Routes, Route} from 'react-router-dom'
import Home from './pages/Home/Home'
import Navbar from './components/Navbar/Navbar'
// import Navbar from './components/Navbar/Navbar'
import MyClient from './pages/MyClient/MyClient'
import SignIn from './pages/SignIn/Signin'
import SignUp from './pages/SignUp/SignUp'
import Profile from './pages/Profile/Profile'
import AddClient from './pages/addClient'
import AddInsurance from './pages/addInsurance'
import AddPolicy from './pages/addScheme'
import EditMutual from './pages/editMutual'
import EditInsurance from './pages/editInsurance'
import UpdateScheme from './pages/updateScheme'
// import IndividualReports from './pages/individualReports'
// import GroupReports from './pages/groupReports'
import GroupManagement from './pages/groupManagement'
// import CalenderReports from './pages/monthlyReports'
import AddFixedDeposit from './pages/addDebt'
import EditFixedDeposit from './pages/editDebt'
import EditPolicy from './pages/editInsurance'
import Calender from './pages/calender'
import AddGeneral from './pages/addGeneral'
import EditGeneral from './pages/editGeneral'
import Redemption from './pages/redemption'
import InvestmentMore from './pages/InvestmentMore'
import Sidebar from "./components/Sidebar"
import Reports from "./pages/reports"

import { useThemeMode } from './context/ThemeContext';
import { getStyles } from './styles/themeStyles';

// import './App.css'

function App() {
  const { theme } = useThemeMode();
  const themeStyles = getStyles(theme);
  
  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, []);

  useEffect(() => {
    // Dynamically update body background color
    document.body.style.backgroundColor = themeStyles.body.backgroundColor;
  }, [theme]);

  return (
    <>
      <div className='App' >
        <Navbar/>
        <Sidebar/>
        <Routes>
          <Route path = "/" element={<Home/>} />
          <Route path = "/profile/:id" element={<Profile/>} />
          <Route path = "/myClient" element={<MyClient/>} />
          <Route path = "/signin" element={<SignIn/>} />
          <Route path = "/signup" element={<SignUp/>} />
          <Route path = "/addClient" element={<AddClient/>} />
          <Route path = "/addPolicy" element={<AddPolicy/>} />
          <Route path = "/addFixedDeposit" element={<AddFixedDeposit/>} />
          <Route path = "/addInsurance" element={<AddInsurance/>} />
          <Route path = "/Mutualfunds" element={<EditMutual/>} />
          <Route path = "/Insurance" element={<EditInsurance/>} />
          {/* <Route path = "/individualReport" element={<IndividualReports/>} />
          <Route path = "/groupReport" element={<GroupReports/>} />
          <Route path = "/monthlyCalender" element={<CalenderReports/>} /> */}
          <Route path = "/MutualfundsUpdate/:id" element={<UpdateScheme/>} />
          <Route path = "/DebtsUpdate/:id" element={<EditFixedDeposit/>} />
          <Route path = "/InsuranceUpdate/:id" element={<EditPolicy/>} />
          <Route path = "/calender" element={<Calender/>} />
          <Route path = "/addGeneral" element={<AddGeneral/>} />
          <Route path = "/GeneralUpdate/:id" element={<EditGeneral/>} />
          <Route path = '/redemption' element={<Redemption/>} />
          <Route path = '/investmentmore' element={<InvestmentMore/>} />
          <Route path = '/groupManagement' element={<GroupManagement/>} />
          <Route path = '/reports' element={<Reports/>} />
        </Routes>
      </div>
    </>
  )
}

export default App
