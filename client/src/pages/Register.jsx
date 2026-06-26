import { Link } from "react-router-dom";
import { useState } from "react";
import "../styles/pages/Register.css";

function getStrength(password) {
  const checks = {
    length: password.length >= 8,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password)
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return { checks, passed };
}

function StrengthBar({ passed }) {
  const labels = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];
  const colors = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"];
  return (
    <div className="strength-bar-container">
      <div className="strength-segments">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="strength-segment"
            style={{ background: i <= passed ? colors[passed] : "rgba(255,255,255,0.1)" }}
          />
        ))}
      </div>
      {passed > 0 && (
        <span className="strength-label" style={{ color: colors[passed] }}>
          {labels[passed]}
        </span>
      )}
    </div>
  );
}

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const { checks, passed } = getStrength(password);
  const isStrongEnough = passed === 5;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isStrongEnough) {
      setError("Please meet all password requirements before signing up.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirmPassword })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "EMAIL_EXISTS") {
          setError("This email is already in use.");
        } else if (data.error === "PASSWORDS_DO_NOT_MATCH") {
          setError("Passwords do not match.");
        } else if (data.error === "WEAK_PASSWORD") {
          setError("Password does not meet the strength requirements.");
        } else {
          setError("Something went wrong. Please try again later.");
        }
        return;
      }

      alert("Account created successfully!");
    } catch (err) {
      console.error(err);
      setError("Server error. Try again later.");
    }
  };

  return (
    <div className="register_page">
      <head>
        <title>Sign Up</title>
      </head>

      <h2 className="register-title">Sign Up</h2>

      <div className="register_form_container">
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

            {password.length > 0 && (
              <>
                <StrengthBar passed={passed} />
                <ul className="strength-checklist">
                  <li className={checks.length ? "check-pass" : "check-fail"}>
                    {checks.length ? "✓" : "✗"} At least 8 characters
                  </li>
                  <li className={checks.upper ? "check-pass" : "check-fail"}>
                    {checks.upper ? "✓" : "✗"} Uppercase letter (A–Z)
                  </li>
                  <li className={checks.lower ? "check-pass" : "check-fail"}>
                    {checks.lower ? "✓" : "✗"} Lowercase letter (a–z)
                  </li>
                  <li className={checks.number ? "check-pass" : "check-fail"}>
                    {checks.number ? "✓" : "✗"} Number (0–9)
                  </li>
                  <li className={checks.special ? "check-pass" : "check-fail"}>
                    {checks.special ? "✓" : "✗"} Special character (@$!%*?&)
                  </li>
                </ul>
              </>
            )}
          </div>

          <div className="register-info">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button className="register-button" type="submit">
            Sign Up
          </button>

          <p>
            Already have an account? Log in <Link to="/login">here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
