import "./signup.css";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
function SignUp() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  async function apiCall(event) {
    event.preventDefault();

    try {
      const response = await axios.post("http://localhost:3000/register", {
        username,
        email,
        password,
      });
      if (response.status === 201) {
        
        alert("Registration successful! Redirecting to login page...");
        navigate("/login"); 
      }
    } catch (err) {
      if (err.response && err.response.status === 400) {
        alert("User already exists or invalid data. Please try again.");
      } else {
        alert("An error occurred during registration. Please try again later.");
        console.error(err);
      }
    }
  }
  return (
    <div className="signup-container">
      <div className="signup-form">
        <h1>Signup</h1>
        <form>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="signup-button" onClick={apiCall}>
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}

export default SignUp;
