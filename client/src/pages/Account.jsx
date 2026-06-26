import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/pages/Account.css";

function Account({ setLoggedIn }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/account`, {
          credentials: "include"
        });

        if (res.status === 401) {
          navigate("/login");
          return;
        }

        const data = await res.json();
        setEmail(data.email);
        setCreatedAt(data.createdAt);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, [navigate]);

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/account`, {
        method: "DELETE",
        credentials: "include"
      });

      if (res.ok) {
        setLoggedIn(false);
        navigate("/");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const memberSince = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    : "—";

  const initials = email ? email[0].toUpperCase() : "?";

  if (loading) return <div className="account-page"><p className="account-loading">Loading...</p></div>;

  return (
    <div className="account-page">
      <head>
        <title>Account</title>
      </head>

      {/* PROFILE */}
      <div className="account-profile">
        <div className="account-avatar">{initials}</div>
        <p className="account-email">{email}</p>
        <p className="account-since">Member since {memberSince}</p>
      </div>

      {/* DETAILS */}
      <div className="account-card">
        <h2 className="account-card-title">Account Details</h2>
        <div className="account-row">
          <span className="account-label">Email</span>
          <span className="account-value">{email}</span>
        </div>
        <div className="account-row">
          <span className="account-label">Member Since</span>
          <span className="account-value">{memberSince}</span>
        </div>
        <div className="account-row">
          <span className="account-label">Account Type</span>
          <span className="account-value">Registered</span>
        </div>
      </div>

      {/* SECURITY */}
      <div className="account-card">
        <h2 className="account-card-title">Security</h2>
        <p className="account-card-desc">
          Need to update your password? We'll send a reset link to your email.
        </p>
        <button
          className="account-btn-secondary"
          onClick={() => navigate("/forgot-password")}
        >
          Change Password
        </button>
      </div>

      {/* DANGER ZONE */}
      <div className="account-card account-danger-card">
        <h2 className="account-card-title danger-title">Danger Zone</h2>
        <p className="account-card-desc">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>

        {!deleteConfirm ? (
          <button
            className="account-btn-danger"
            onClick={() => setDeleteConfirm(true)}
          >
            Delete Account
          </button>
        ) : (
          <div className="delete-confirm">
            <p className="delete-confirm-text">Are you sure? This is permanent.</p>
            <div className="delete-confirm-buttons">
              <button className="account-btn-danger" onClick={handleDeleteAccount}>
                Yes, delete my account
              </button>
              <button className="account-btn-secondary" onClick={() => setDeleteConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Account;
