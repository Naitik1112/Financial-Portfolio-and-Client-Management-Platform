import { useEffect } from 'react';
import axios from 'axios';
import { Routes, Route } from 'react-router-dom';

import Home from './pages/Home/Home';
import Navbar from './components/Navbar/Navbar';
import MyClient from './pages/MyClient/MyClient';
import SignIn from './pages/SignIn/Signin';
// import SignUp from './pages/SignUp/SignUp';
import Profile from './pages/Profile/Profile';
import AddClient from './pages/addClient';
import AddInsurance from './pages/addInsurance';
import AddPolicy from './pages/addScheme';
import EditMutual from './pages/editMutual';
import EditInsurance from './pages/editInsurance';
import UpdateScheme from './pages/updateScheme';
import GroupManagement from './pages/groupManagement';
import AddFixedDeposit from './pages/addDebt';
import EditFixedDeposit from './pages/editDebt';
import EditPolicy from './pages/editInsurance';
import Calender from './pages/calender';
import AddGeneral from './pages/addGeneral';
import EditGeneral from './pages/editGeneral';
import Redemption from './pages/redemption';
import InvestmentMore from './pages/InvestmentMore';
import Sidebar from "./components/Sidebar";
import Reports from "./pages/reports";
import ProtectedRoute from './components/ProtectedRoute';
import PleaseLogin from './pages/PleaseLogin';

import { useThemeMode } from './context/ThemeContext';
import { getStyles } from './styles/themeStyles';

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
    document.body.style.backgroundColor = themeStyles.body.backgroundColor;
  }, [theme]);

  return (
    <>
      <div className='App'>
        <Navbar />
        <Sidebar />
        <Routes>
          {/* Public Routes */}
          <Route path="/signin" element={<SignIn />} />
          {/* <Route path="/signup" element={<SignUp />} /> */}
          <Route path="/please-login" element={<PleaseLogin />} />

          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/myClient" element={<ProtectedRoute><MyClient /></ProtectedRoute>} />
          <Route path="/addClient" element={<ProtectedRoute><AddClient /></ProtectedRoute>} />
          <Route path="/addPolicy" element={<ProtectedRoute><AddPolicy /></ProtectedRoute>} />
          <Route path="/addFixedDeposit" element={<ProtectedRoute><AddFixedDeposit /></ProtectedRoute>} />
          <Route path="/addInsurance" element={<ProtectedRoute><AddInsurance /></ProtectedRoute>} />
          <Route path="/Mutualfunds" element={<ProtectedRoute><EditMutual /></ProtectedRoute>} />
          <Route path="/Insurance" element={<ProtectedRoute><EditInsurance /></ProtectedRoute>} />
          <Route path="/MutualfundsUpdate/:id" element={<ProtectedRoute><UpdateScheme /></ProtectedRoute>} />
          <Route path="/DebtsUpdate/:id" element={<ProtectedRoute><EditFixedDeposit /></ProtectedRoute>} />
          <Route path="/InsuranceUpdate/:id" element={<ProtectedRoute><EditPolicy /></ProtectedRoute>} />
          <Route path="/calender" element={<ProtectedRoute><Calender /></ProtectedRoute>} />
          <Route path="/addGeneral" element={<ProtectedRoute><AddGeneral /></ProtectedRoute>} />
          <Route path="/GeneralUpdate/:id" element={<ProtectedRoute><EditGeneral /></ProtectedRoute>} />
          <Route path="/redemption" element={<ProtectedRoute><Redemption /></ProtectedRoute>} />
          <Route path="/investmentmore" element={<ProtectedRoute><InvestmentMore /></ProtectedRoute>} />
          <Route path="/groupManagement" element={<ProtectedRoute><GroupManagement /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        </Routes>
      </div>
    </>
  );
}

export default App;
