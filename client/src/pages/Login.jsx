import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/pages/Login.css";

function Login({setLoggedIn}) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        // ✅ Handle errors
        if (data.error === "EMAIL_NOT_FOUND") {
          setError("No account found with that email.");
        } else if (data.error === "INVALID_PASSWORD") {
          setError("Incorrect password.");
        } else {
          setError("Something went wrong.");
        }
        return;
      }

      // ✅ Success → go to explore
      setLoggedIn(true);   // ✅ THIS IS THE FIX
      navigate("/explore");

    } catch (err) {
      console.error(err);
      setError("Server error. Try again later.");
    }
  };

  return (
    <div className="login_page">

      <h2 className="login-title">Log In</h2>

      {/* ✅ ERROR MESSAGE */}
      {error && <p className="error-text">{error}</p>}

      <div className="login_form_container">

        <form onSubmit={handleSubmit}>

          <div className="login-info">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="login-info">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="login-button" type="submit">
            Log In
          </button>

          <p>
            Don't have an account?{" "}
            <Link to="/register">Sign up</Link>
          </p>

        </form>

      </div>

    </div>
  );
}

export default Login;
