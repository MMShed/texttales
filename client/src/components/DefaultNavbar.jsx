import { Link } from "react-router-dom";
import logo from "../assets/logo.png"

import "../styles/components/DefaultNavbar.css"

function DefaultNavbar ()
{
    return (    
        <nav className="navigation">
            <nav className="left_bar">
                <img src={logo} alt="logo" />
            </nav>

            <nav className="right_bar">
                <Link to="/">Home</Link>
                <Link to="/privacypolicy">Privacy Policy</Link>
                <Link to="/explore">Explore</Link>
                <Link to="/login">Login</Link>
            </nav>
        </nav>
    );
}

export default DefaultNavbar