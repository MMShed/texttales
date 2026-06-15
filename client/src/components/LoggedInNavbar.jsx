
import { Link, useNavigate } from "react-router-dom";

import "../styles/components/LoggedInNavbar.css";

function LoggedInNavbar({ setLoggedIn }) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/logout`, {
            method: "POST",
            credentials: "include"
        });

        const text = await res.text();
        console.log(text);

        setLoggedIn(false);  
        navigate("/login");
    };

    return (    
        <nav className="navigation">
            <nav className="left_bar">
                <h3>TextTales</h3>
            </nav>

            <nav className="right_bar">
                <Link to="/explore">Explore</Link>

                
                <button onClick={handleLogout} className="logout-link">
                    Log Out
                </button>

                <Link to="/account">Account</Link>
            </nav>
        </nav>
    );
}

export default LoggedInNavbar;
