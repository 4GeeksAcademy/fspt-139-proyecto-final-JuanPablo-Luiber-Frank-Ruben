import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            const response = await fetch(backendUrl + "/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Something went wrong");
                return;
            }


            localStorage.setItem("token", data.token);


            navigate("/profile");

        } catch (err) {
            setError("Could not connect to the backend");
        }
    };

    return (
        <div className="container mt-5" style={{ maxWidth: "400px" }}>
            <h1 className="mb-4">Log in</h1>

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                        type="password"
                        className="form-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <button type="submit" className="btn btn-primary w-100">Log in</button>
            </form>

            <p className="mt-3 text-center">
                Don't have an account? <Link to="/users">Sign up</Link>
            </p>
        </div>
    );
};