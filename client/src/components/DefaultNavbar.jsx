import { Link } from "react-router-dom";

import "../styles/components/DefaultNavbar.css"

function DefaultNavbar ()
{
    return (    
        <nav className="navigation">
            <nav className="left_bar">
                <h3>TextTales</h3>
            </nav>

            <nav className="right_bar">
                <Link to="/">Home</Link>
                <Link to="/explore">Explore</Link>
                <Link to="/login">Login</Link>
            </nav>
        </nav>
    );
}

export default DefaultNavbar