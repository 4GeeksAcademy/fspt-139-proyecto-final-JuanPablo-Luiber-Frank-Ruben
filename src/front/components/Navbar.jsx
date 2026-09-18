import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useTheme from "../hooks/useTheme";

function getUserFromToken(token) {
	try {
		const payload = JSON.parse(atob(token.split(".")[1]));
		return payload.nickname || payload.name || payload.email || null;
	} catch {
		return null;
	}
}

export const Navbar = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { theme, toggleTheme } = useTheme();
	const [token, setToken] = useState(() => localStorage.getItem("token"));
	const [scrolled, setScrolled] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);

	useEffect(() => {
		setToken(localStorage.getItem("token"));
	}, [location]);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 30);
		window.addEventListener("scroll", onScroll);
		onScroll();
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	const userName = token ? getUserFromToken(token) : null;
	const isActive = (path) => (location.pathname === path ? "active" : "");
	const closeMenu = () => setMenuOpen(false);

	const handleLogout = () => {
		localStorage.removeItem("token");
		setToken(null);
		closeMenu();
		navigate("/login");
	};

	return (
		<nav className={`sv-navbar${scrolled ? " scrolled" : ""}`}>
			<div className="container d-flex justify-content-between align-items-center">
				<Link to={token ? "/profile" : "/login"} className="sv-logo">
					<i className="fa-solid fa-gamepad"></i>STEAM<span>VIEW</span>
				</Link>

				<button
					className="sv-navbar-toggler d-flex d-lg-none"
					aria-label="Abrir menú"
					aria-expanded={menuOpen}
					onClick={() => setMenuOpen((v) => !v)}
				>
					<i className={`fa-solid ${menuOpen ? "fa-xmark" : "fa-bars"}`}></i>
				</button>

				<div className={`sv-nav-collapse${menuOpen ? " show" : ""}`}>
					{token && (
						<ul className="sv-nav-links">
							<li><Link className={isActive("/profile")} to="/profile" onClick={closeMenu}>Perfil</Link></li>
							<li><Link className={isActive("/games")} to="/games" onClick={closeMenu}>Mis juegos</Link></li>
							<li><Link className={isActive("#")} to="#" onClick={closeMenu}>Logros</Link></li> {/* TODO: crear ruta /achievements */}
							<li><Link className={isActive("#")} to="#" onClick={closeMenu}>Amigos</Link></li> {/* TODO: crear ruta /friends */}
						</ul>
					)}

					<div className="sv-nav-actions">
						<button className="sv-theme-toggle" onClick={toggleTheme} title="Cambiar tema">
							<i className={`fa-solid ${theme === "light" ? "fa-moon" : "fa-sun"}`}></i>
						</button>

						{token ? (
							<div className="sv-nav-user-area">
								<Link to="/profile" className="sv-user-name-sm d-none d-sm-inline" onClick={closeMenu}>
									{userName || "Mi cuenta"}
								</Link>
								<button className="btn btn-sm sv-btn-outline" onClick={handleLogout}>
									<i className="fa-solid fa-arrow-right-from-bracket"></i> <span className="d-lg-none d-xl-inline">Cerrar sesión</span>
								</button>
							</div>
						) : (
							<div className="sv-nav-user-area">
								<Link className={`btn btn-sm sv-btn-ghost ${isActive("/login")}`} to="/login" onClick={closeMenu}>
									<i className="fa-solid fa-right-to-bracket"></i> <span className="d-lg-none d-xl-inline">Iniciar sesión</span>
								</Link>
								<Link className="btn btn-sm sv-btn-outline" to="/users" onClick={closeMenu}>
									<span className="d-lg-none d-xl-inline">Crear cuenta</span>
								</Link>
							</div>
						)}
					</div>
				</div>
			</div>
		</nav>
	);
};
