import  { useState } from "react";
import "./../SignIn/Signin.css"; // Ensure you have the appropriate CSS file

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setMail] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add your login logic here
    console.log("Username:", username);
    console.log("Password:", password);
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit}>
        <h1>Login</h1>

        <div className="input-box">
          <input
            type="text"
            placeholder="Username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          {/* <i className="bx bxs-user"></i> */}
        </div>

        <div className="input-box">
          <input
            type="text"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setMail(e.target.value)}
          />
          {/* <i className="bx bxs-user"></i> */}
        </div>

        <div className="input-box">
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {/* <i className="bx bxs-lock-alt"></i> */}
        </div>

        <div className="input-box">
          <input
            type="password"
            placeholder="Password Confirm"
            required
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
          />
          {/* <i className="bx bxs-lock-alt"></i> */}
        </div>

        <button type="submit" className="btn">
          Sign Up
        </button>

        <div className="register-link">
          <p>
            Do you have an account? <a href="/signin">login here!</a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
