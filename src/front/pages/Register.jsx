import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import useTheme from "../hooks/useTheme";
import { api } from "../services/api";

export const Register = () => {
	const { store, dispatch } = useGlobalReducer();
	const { theme, toggleTheme } = useTheme();
	const navigate = useNavigate();

	const [nickname, setNickname] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [steamId, setSteamId] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	if (store.user) {
		return <Navigate to={`/profile/${store.user.steam_id}`} replace />;
	}

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		if (password.length < 6) {
			setError("La contraseña debe tener al menos 6 caracteres.");
			return;
		}

		setLoading(true);
		try {
			const data = await api.register({ nickname, email, password, steam_id: steamId });
			dispatch({ type: "set_session", payload: { token: data.token, user: data.user } });
			navigate(`/profile/${data.user.steam_id}`);
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
				<h1 className="sv-auth-brand-title">Crea tu cuenta y <span className="sv-outline">empieza</span></h1>
				<p className="sv-auth-brand-sub">
					Vincula tu SteamID una sola vez. Cada vez que inicies sesión irás directo
					a tu perfil, sin tener que buscarlo de nuevo.
				</p>
				<ul className="sv-auth-brand-list list-unstyled">
					<li><i className="fa-solid fa-shield-halved"></i> Contraseña cifrada, nunca guardada en texto plano</li>
					<li><i className="fa-solid fa-bolt"></i> Acceso directo a tu perfil al iniciar sesión</li>
					<li><i className="fa-solid fa-star"></i> Guarda tus juegos favoritos y agrega amigos reales</li>
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

					<h2 className="sv-auth-title">Crear cuenta</h2>
					<p className="sv-auth-sub">Regístrate para vincular tu perfil de Steam.</p>

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
						<div className="mb-3">
							<label className="form-label">Contraseña</label>
							<input type="password" className="form-control" placeholder="Mínimo 6 caracteres" minLength={6} required
								value={password} onChange={(e) => setPassword(e.target.value)} />
						</div>
						<div className="mb-4">
							<label className="form-label">SteamID64 o vanity URL</label>
							<input type="text" className="form-control" placeholder="76561198000000000 o mi_nombre_steam" required
								value={steamId} onChange={(e) => setSteamId(e.target.value)} />
							<p className="sv-auth-hint">Es lo que buscaremos cada vez que inicies sesión. En modo demo puedes escribir lo que quieras.</p>
						</div>
						<button type="submit" className="btn sv-btn-accent w-100" disabled={loading}>
							{loading ? "Creando cuenta…" : <>Crear cuenta <i className="fa-solid fa-arrow-right ms-1"></i></>}
						</button>
					</form>

					<p className="sv-auth-footer">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
				</div>
			</div>
		</div>
	);
};
