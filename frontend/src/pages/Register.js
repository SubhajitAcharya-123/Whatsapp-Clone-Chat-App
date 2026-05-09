import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/auth.css";

export default function Register() {
    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const navigate = useNavigate();
    const goBack = () => {
        navigate("/");
    };
    const handleRegister = async () => {
        if (form.password !== form.confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        const res = await fetch("http://localhost:8080/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(form)
        });

        if (!res.ok) {
            alert("Registration failed");
            return;
        }

        alert("Registered successfully");
        navigate("/login");
    };

    return (
        <div className="auth-container">
            <div className="back-arrow" onClick={goBack}>←</div>
            <h2>Register</h2>

            <input placeholder="Username" onChange={e => setForm({ ...form, username: e.target.value })} />
            <input placeholder="Email" onChange={e => setForm({ ...form, email: e.target.value })} />
            <input type="password" placeholder="Password" onChange={e => setForm({ ...form, password: e.target.value })} />
            <input type="password" placeholder="Confirm Password" onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />

            <button onClick={handleRegister}>Register</button>
            <div className="haveAccount">
                <h6>Already have an account?</h6>
                <Link to="/login">Login</Link>
            </div>
        </div>
    );
}