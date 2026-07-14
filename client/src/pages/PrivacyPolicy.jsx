import React from "react";
import "../styles/pages/PrivacyPolicy.css";

const LAST_UPDATED = "June 25, 2026";

export default function PrivacyPolicy() {
  return (
    <div className="privacy-container">
      <div className="privacy-card">

        <div className="privacy-header">
          <h1 className="privacy-title">Privacy Policy</h1>
          <p className="privacy-subtitle">Last updated: {LAST_UPDATED}</p>
        </div>

        <nav className="privacy-toc" aria-label="Table of contents">
          <p className="privacy-toc-title">Contents</p>
          <ol>
            <li><a href="#overview">Overview</a></li>
            <li><a href="#guest-usage">Guest Usage</a></li>
            <li><a href="#account-data">Account Data</a></li>
            <li><a href="#cookies">Cookies &amp; Sessions</a></li>
            <li><a href="#data-usage">How We Use Your Data</a></li>
            <li><a href="#third-parties">Third-Party Services</a></li>
            <li><a href="#data-retention">Data Retention</a></li>
            <li><a href="#contact">Contact</a></li>
          </ol>
        </nav>

        <div className="privacy-section">

          <div className="privacy-clause" id="overview">
            <h2>1. Overview</h2>
            <p>
              TextTales ("we," "us," or "our") is committed to protecting your privacy.
              This Privacy Policy explains what information we collect, how we use it,
              and the choices you have regarding your data. By using TextTales, you
              agree to the practices described in this policy.
            </p>
            <p>
              We collect only the minimum information required to operate the platform
              and will never sell your personal data to third parties.
            </p>
          </div>

          <div className="privacy-clause" id="guest-usage">
            <h2>2. Guest Usage</h2>
            <p>
              Non-registered visitors may access a limited number of stories per day.
              To enforce this limit fairly, TextTales derives a temporary, anonymized
              identifier from your IP address. This identifier is processed using a
              one-way cryptographic hash — it cannot be reversed to obtain your original
              IP address.
            </p>
            <p>
              This identifier is used solely to track usage quota within a 24-hour
              window. It is not linked to any personal profile and is not used for
              advertising, behavioral tracking, or any other purpose.
            </p>
          </div>

          <div className="privacy-clause" id="account-data">
            <h2>3. Account Data</h2>
            <p>
              When you create an account, we collect and store:
            </p>
            <ul className="privacy-list">
              <li>Your email address (used for login and account communications)</li>
              <li>A hashed version of your password (we never store passwords in plain text)</li>
              <li>The date your account was created</li>
            </ul>
            <p>
              This information is used exclusively for authentication and to provide
              account features. It is not shared with, sold to, or disclosed to any
              third party except as required by law.
            </p>
          </div>

          <div className="privacy-clause" id="cookies">
            <h2>4. Cookies &amp; Sessions</h2>
            <p>
              TextTales uses a single, essential session cookie to keep you logged in
              across page visits. This cookie:
            </p>
            <ul className="privacy-list">
              <li>Is set only after a successful login</li>
              <li>Expires after 24 hours</li>
              <li>Is marked <code>HttpOnly</code> and <code>Secure</code> to protect against interception</li>
              <li>Is not used for advertising or analytics</li>
            </ul>
            <p>
              We do not use tracking cookies, third-party advertising cookies, or
              persistent analytics cookies.
            </p>
          </div>

          <div className="privacy-clause" id="data-usage">
            <h2>5. How We Use Your Data</h2>
            <p>Data collected on TextTales is used only to:</p>
            <ul className="privacy-list">
              <li>Authenticate registered users and maintain login sessions</li>
              <li>Enforce fair usage limits for guest visitors</li>
              <li>Send transactional emails (account creation confirmation, password resets)</li>
              <li>Ensure the platform operates correctly and securely</li>
            </ul>
            <p>
              We do not use your data for advertising, profiling, or any purpose
              beyond what is listed above.
            </p>
          </div>

          <div className="privacy-clause" id="third-parties">
            <h2>6. Third-Party Services</h2>
            <p>
              To operate TextTales, we rely on a small number of trusted third-party
              providers. Each provider processes only the data necessary for its
              specific function:
            </p>
            <ul className="privacy-list">
              <li><strong>Hosting &amp; infrastructure</strong> — servers and deployment</li>
              <li><strong>Database</strong> — secure storage of account data</li>
              <li><strong>Email delivery</strong> — sending account and password reset emails</li>
              <li><strong>Media storage</strong> — hosting story images</li>
            </ul>
            <p>
              These providers are bound by their own privacy policies and are not
              permitted to use your data for purposes beyond what we have contracted.
            </p>
          </div>

          <div className="privacy-clause" id="data-retention">
            <h2>7. Data Retention</h2>
            <p>
              Account data is retained for as long as your account exists. You may
              permanently delete your account at any time from the Account page, which
              will remove your email and credentials from our systems.
            </p>
            <p>
              Anonymized guest usage records are automatically reset after 24 hours
              and are not retained beyond that window.
            </p>
          </div>

          <div className="privacy-clause" id="contact">
            <h2>8. Contact</h2>
            <p>
              If you have questions, concerns, or requests regarding this Privacy
              Policy or your personal data, please reach out to us at:
            </p>
            <p>
              <a href="mailto:texttalesapp@gmail.com" className="privacy-contact-link">
                texttalesapp@gmail.com
              </a>
            </p>
            <p>
              We aim to respond to all privacy-related inquiries within 5 business days.
            </p>
          </div>

        </div>

        <div className="privacy-footer-bar">
          <p>TextTales &copy; {new Date().getFullYear()}. All rights reserved.</p>
          <p>This policy is subject to change. Continued use of the platform constitutes acceptance.</p>
        </div>

      </div>
    </div>
  );
}
