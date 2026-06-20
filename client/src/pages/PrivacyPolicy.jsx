import React from "react";
import "../styles/pages/PrivacyPolicy.css"

export default function PrivacyPolicy() {
  return (
    <div className="privacy-container">
      <div className="privacy-card">
        <h1 className="privacy-title">Privacy Policy</h1>

        <hr className="privacy-divider" />

        <p className="privacy-date">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="privacy-section">
          <h2>1. Overview</h2>
          <p>
            TextTales respects your privacy and is committed to protecting your
            data. This application is designed to minimize data collection and
            only uses information necessary to provide its functionality.
          </p>

          <h2>2. Guest Usage</h2>
          <p>
            For non-registered users, TextTales uses a temporary, anonymized
            identifier derived from IP address data to enforce usage limits.
            This identifier is securely processed and is not used for tracking,
            advertising, or profiling.
          </p>

          <h2>3. Account Data</h2>
          <p>
            When you create an account, your information (such as email and login
            credentials) is used solely for authentication and access to your
            account. This information is not shared with third parties.
          </p>

          <h2>4. Cookies</h2>
          <p>
            TextTales uses essential cookies to maintain user sessions and enable
            login functionality. These cookies are required for the site to
            function properly and are not used for tracking or analytics.
          </p>

          <h2>5. Data Usage</h2>
          <p>Collected data is only used to:</p>
          <ul className="privacy-list">
            <li>Maintain account sessions</li>
            <li>Enforce fair usage limits for guest users</li>
            <li>Ensure the application operates correctly</li>
          </ul>

          <h2>6. Third-Party Services</h2>
          <p>
            TextTales may use trusted third-party services (such as hosting and
            email providers) to operate the application. These services only
            process data necessary to perform their functions.
          </p>

          <h2>7. Contact</h2>
          <p>
            If you have any questions about this Privacy Policy, you can contact
            us at:
          </p>
          <p>
            <strong>your-email@example.com</strong>
          </p>
        </div>

        <hr className="privacy-divider" />

        <p className="privacy-footer">
          TextTales © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
