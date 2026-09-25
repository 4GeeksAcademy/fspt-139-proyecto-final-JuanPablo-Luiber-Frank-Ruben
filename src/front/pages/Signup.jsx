import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useTheme from "../hooks/useTheme";

export const Signup = () => {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [nickname, setNickname] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL;

            const response = await fetch(backendUrl + "/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, nickname, password })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Something went wrong");
                return;
            }

            navigate("/login");

        } catch (err) {
            setError("Could not connect to the backend");
        }
    };

    return (
        <div className="sv-auth-split">
            <button className="sv-theme-toggle sv-theme-toggle-fixed d-none d-lg-flex" onClick={toggleTheme}>
                <i className={`fa-solid ${theme === "light" ? "fa-moon" : "fa-sun"}`}></i>
            </button>

            <div className="sv-auth-brand d-none d-lg-flex">
                <Link to="/login" className="sv-logo sv-auth-logo"><i className="fa-solid fa-gamepad"></i>TROPHY<span>HUNTER</span></Link>
                <h1 className="sv-auth-brand-title">Crea tu cuenta y <span className="sv-outline">empieza</span></h1>
                <p className="sv-auth-brand-sub">
                    Regístrate primero con tu email; una vez dentro podrás vincular tu
                    cuenta real de Steam con un solo clic.
                </p>
                <ul className="sv-auth-brand-list list-unstyled">
                    <li><i className="fa-solid fa-shield-halved"></i> Contraseña cifrada, nunca guardada en texto plano</li>
                    <li><i className="fa-solid fa-bolt"></i> Vinculación con Steam en un clic desde tu perfil</li>
                    <li><i className="fa-solid fa-star"></i> Guarda tus juegos favoritos y agrega amigos reales</li>
                </ul>
            </div>

            <div className="sv-auth-panel">
                <div className="sv-auth-card">
                    <div className="d-flex justify-content-between align-items-center d-lg-none sv-auth-logo">
                        <Link to="/login" className="sv-logo mb-0"><i className="fa-solid fa-gamepad"></i>TROPHY<span>HUNTER</span></Link>
                        <button className="sv-theme-toggle" onClick={toggleTheme}>
                            <i className={`fa-solid ${theme === "light" ? "fa-moon" : "fa-sun"}`}></i>
                        </button>
                    </div>

                    <h2 className="sv-auth-title">Crear cuenta</h2>
                    <p className="sv-auth-sub">Regístrate para empezar. Vincularás Steam en el siguiente paso.</p>

                    {error && <div className="sv-auth-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label">Nombre</label>
                            <input type="text" className="form-control" placeholder="Tu nombre" required
                                value={nickname} onChange={(e) => setNickname(e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Email</label>
                            <input type="email" className="form-control" placeholder="tu@email.com" required
                                value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="mb-4">
                            <label className="form-label">Contraseña</label>
                            <input type="password" className="form-control" placeholder="Mínimo 6 caracteres" minLength={6} required
                                value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                        <button type="submit" className="btn sv-btn-accent w-100">
                            Crear cuenta <i className="fa-solid fa-arrow-right ms-1"></i>
                        </button>
                    </form>

                    <p className="sv-auth-footer">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
                </div>
            </div>
        </div>
    );
};
