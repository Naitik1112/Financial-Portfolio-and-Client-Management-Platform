// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
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

// import './App.css'

function App() {

  return (
    <>
      <div className='App' >
        <Navbar/>
        <Routes>
          <Route path = "/" element={<Home/>} />
          <Route path = "/myClient" element={<MyClient/>} />
          <Route path = "/profile" element={<Profile/>} />
          <Route path = "/signin" element={<SignIn/>} />
          <Route path = "/signup" element={<SignUp/>} />
          <Route path = "/addClient" element={<AddClient/>} />
          <Route path = "/addPolicy" element={<AddPolicy/>} />
          <Route path = "/addInsurance" element={<AddInsurance/>} />
          <Route path = "/Mutualfunds" element={<EditMutual/>} />
          <Route path = "/Insurance" element={<EditInsurance/>} />
        </Routes>
      </div>
    </>
  )
}

export default App
