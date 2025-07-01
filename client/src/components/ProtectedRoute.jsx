import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const ProtectedRoute = ({ children }) => {
  const [status, setStatus] = useState('loading'); // 'loading', 'unauthenticated', 'unauthorized', 'authorized'
  const [role, setRole] = useState(null); // Store user's role if needed

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('jwt');

      if (!token) {
        setStatus('unauthenticated');
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const isExpired = decoded.exp * 1000 < Date.now();

        if (isExpired) {
          setStatus('unauthenticated');
          return;
        }

        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/getme`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });

        const user = res.data?.data;
        setRole(user?.role);

        if (user && user.role === 'admin') {
          setStatus('authorized');
        } else {
          setStatus('unauthorized');
        }
      } catch (err) {
        setStatus('unauthenticated');
      }
    };

    checkAuth();
  }, []);

  if (status === 'loading') {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '100px' }}>Checking authorization...</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div style={{
        color: 'white',
        textAlign: 'center',
        padding: '100px',
        fontSize: '24px'
      }}>
        Please login to access the page as admin. <br /><br />
        <a href="/signin" style={{ color: '#1976D2' }}>Go to Login</a>
      </div>
    );
  }

  if (status === 'unauthorized') {
    return (
      <div style={{
        color: 'white',
        textAlign: 'center',
        padding: '100px',
        fontSize: '24px'
      }}>
        As <strong>{role}</strong>, you don't have access to view this page.
        <h4 style={{marginTop:'5px'}}>Login as Admin <a href="/signin" style={{ color: '#1976D2' }}>Go to Login</a></h4>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
