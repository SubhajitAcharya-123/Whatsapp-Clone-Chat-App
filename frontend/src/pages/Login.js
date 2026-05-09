import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/auth.css";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    
    const goBack = () => {
        navigate("/");
    };
    const handleLogin = async () => {
        const res = await fetch("http://localhost:8080/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
            alert("Invalid credentials");
            return;
        }

        const data = await res.json();
        
        localStorage.setItem("token", data.token);
        //  store user
        localStorage.setItem("user", JSON.stringify(data));

        navigate("/chat");
    };

    return (
        <div className="auth-container">
            <div className="back-arrow" onClick={goBack}>←</div>
            <h2>Login</h2>

            <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />

            <button onClick={handleLogin}>Login</button>
            <div className="register">
                <Link to="/register">Register</Link>
            </div>
        </div>
    );
}