import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

export default function AuthPage() {
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <h1>💬 Chat App</h1>

      <div className="auth-buttons">
        <button onClick={() => navigate("/login")}>Login</button>
        <button onClick={() => navigate("/register")}>Register</button>
      </div>
    </div>
  );
}