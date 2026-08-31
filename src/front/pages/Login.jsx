import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import useTheme from "../hooks/useTheme";
import { api } from "../services/api";

export const Login = () => {
	const { store, dispatch } = useGlobalReducer();
	const { theme, toggleTheme } = useTheme();
	const navigate = useNavigate();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	if (store.user) {
		return <Navigate to={`/profile/${store.user.steam_id}`} replace />;
	}

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			const loginData = await api.login({ email, password });
			const me = await api.me(loginData.token);
			dispatch({ type: "set_session", payload: { token: loginData.token, user: me.user } });
			navigate(`/profile/${me.user.steam_id}`);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="sv-auth-split">
			<button className="sv-theme-toggle sv-theme-toggle-fixed d-none d-lg-flex" onClick={toggleTheme}>
				<i className={`fa-solid ${theme === "light" ? "fa-moon" : "fa-sun"}`}></i>
			</button>

			<div className="sv-auth-brand">
				<Link to="/login" className="sv-logo sv-auth-logo"><i className="fa-solid fa-gamepad"></i>STEAM<span>VIEW</span></Link>
				<h1 className="sv-auth-brand-title">Tu perfil de <span className="sv-outline">Steam</span>, a fondo</h1>
				<p className="sv-auth-brand-sub">
					Conecta tu cuenta y consulta tu biblioteca de juegos, el progreso de tus logros
					y la actividad de tus amigos, todo en un solo lugar.
				</p>
				<ul className="sv-auth-brand-list list-unstyled">
					<li><i className="fa-solid fa-gamepad"></i> Tu biblioteca completa con horas jugadas</li>
					<li><i className="fa-solid fa-trophy"></i> Logros destacados y % de rareza global</li>
					<li><i className="fa-solid fa-users"></i> Actividad reciente de tus amigos</li>
				</ul>
			</div>

			<div className="sv-auth-panel">
				<div className="sv-auth-card">
					<div className="d-flex justify-content-between align-items-center d-lg-none sv-auth-logo">
						<Link to="/login" className="sv-logo mb-0"><i className="fa-solid fa-gamepad"></i>STEAM<span>VIEW</span></Link>
						<button className="sv-theme-toggle" onClick={toggleTheme}>
							<i className={`fa-solid ${theme === "light" ? "fa-moon" : "fa-sun"}`}></i>
						</button>
					</div>

					<h2 className="sv-auth-title">Iniciar sesión</h2>
					<p className="sv-auth-sub">Bienvenido de nuevo. Introduce tus datos para continuar.</p>

					{error && <div className="sv-auth-error">{error}</div>}

					<form onSubmit={handleSubmit}>
						<div className="mb-3">
							<label className="form-label">Email</label>
							<input type="email" className="form-control" placeholder="tu@email.com" required
								value={email} onChange={(e) => setEmail(e.target.value)} />
						</div>
						<div className="mb-4">
							<label className="form-label">Contraseña</label>
							<input type="password" className="form-control" placeholder="••••••••" required
								value={password} onChange={(e) => setPassword(e.target.value)} />
						</div>
						<button type="submit" className="btn sv-btn-accent w-100" disabled={loading}>
							{loading ? "Entrando…" : <>Entrar <i className="fa-solid fa-arrow-right ms-1"></i></>}
						</button>
					</form>

					<p className="sv-auth-footer">¿No tienes cuenta? <Link to="/register">Regístrate</Link></p>
					<p className="sv-auth-footer"><Link to="/search">Explorar sin cuenta →</Link></p>
				</div>
			</div>
		</div>
	);
};
