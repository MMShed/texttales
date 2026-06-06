import { Link } from "react-router-dom";
import { useState } from "react";
import "../styles/pages/Register.css";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // ✅ Password match check
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await res.json();

      // ✅ Handle backend error
      if (!res.ok) {
        if (data.error === "EMAIL_EXISTS") {
          setError("This email is already in use.");
        } else {
          setError("Something went wrong. Please try again.");
        }
        return;
      }

      // ✅ success
      alert("Account created successfully!");

    } catch (err) {
      console.error(err);
      setError("Server error. Try again later.");
    }
  };

  return (
    <div className="register_page">

      <h2 className="register-title">Sign Up</h2>

      <div className="register_form_container">

        {/* ✅ ERROR MESSAGE */}
        {error && <p className="error-text">{error}</p>}

        <form onSubmit={handleSubmit}>

          <div className="register-info">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="register-info">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="register-info">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Enter password"
              required
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
            />
          </div>

          <button className="register-button" type="submit">
            Sign Up
          </button>

          <p>
            Already have an account? Log in{" "}
            <Link to="/login">here</Link>
          </p>

        </form>

      </div>

    </div>
  );
}

export default Register;