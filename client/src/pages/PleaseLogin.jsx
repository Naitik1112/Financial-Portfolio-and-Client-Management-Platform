// src/pages/PleaseLogin.jsx
import React from 'react';

const PleaseLogin = () => {
  return (
    <div style={{
      color: 'white',
      textAlign: 'center',
      padding: '100px',
      fontSize: '24px'
    }}>
      You are not authorized. Please <a href="/signin" style={{ color: '#1976D2' }}>login</a>.
    </div>
  );
};

export default PleaseLogin;
