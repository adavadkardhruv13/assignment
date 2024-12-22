import "./signin.css";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); // useNavigate hook to handle navigation

  async function apiCall(event) {
    event.preventDefault();

    try {
      // Create FormData object
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      // Send the data as multipart/form-data to the backend
      const response = await axios.post(
        "http://127.0.0.1:8000/login", // Your FastAPI backend URL
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const { access_token } = response.data;
      alert("Login successful!");
      console.log("Token:", access_token);

      // Store the token in localStorage
      localStorage.setItem("token", access_token);

      // Redirect to /chat page after login
      navigate("/chat");
    } catch (err) {
      if (err.response && err.response.status === 401) {
        alert("Invalid username or password. Please try again.");
      } else {
        alert("An error occurred. Please try again later.");
        console.error(err);
      }
    }
  }

  return (
    <div className="login-container">
      <div className="login-form">
        <h1>Sign In</h1>
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
          <button type="submit" className="login-button" onClick={apiCall}>
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Signin;
