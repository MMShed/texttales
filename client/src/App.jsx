import "./App.css"

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";

import DefaultNavbar from "./components/DefaultNavbar";
import DefaultFooter from "./components/DefaultFooter";
import LoggedInNavbar from "./components/LoggedInNavbar";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Explore from "./pages/Explore";
import Register from "./pages/Register";
import StoryPage from "./pages/StoryPage";
import PrivacyPolicy from "./pages/PrivacyPolicy"

import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";


function App() {
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/me`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        setLoggedIn(data.loggedIn);
      })
      .catch(() => {
        setLoggedIn(false);
      });
  }, []);

  return (
    <BrowserRouter>
      <div className="app-container">

        <header>
          {loggedIn ? (
            <LoggedInNavbar setLoggedIn={setLoggedIn} />
          ) : (
            <DefaultNavbar />
          )}
        </header>

        {/*  THIS is important */}
        <main className="app-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login setLoggedIn={setLoggedIn} />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/register" element={<Register />} />
            <Route path="/stories/:id" element={<StoryPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/privacypolicy" element={<PrivacyPolicy />} />
          </Routes>
        </main>

        <div className="footer">
          <DefaultFooter />
        </div>

      </div>
    </BrowserRouter>
  );
}

export default App;