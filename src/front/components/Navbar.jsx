import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useTheme from "../hooks/useTheme";

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
				<div className="sv-brand">
					<Link to={token ? "/profile" : "/login"} className="sv-logo">
						<i className="fa-solid fa-gamepad"></i>TROPHY<span>HUNTER</span>
					</Link>
					<button
						className="sv-theme-toggle"
						onClick={toggleTheme}
						title={theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
					>
						<i className={`fa-solid ${theme === "light" ? "fa-moon" : "fa-sun"}`}></i>
					</button>
				</div>

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
							<li><Link className={isActive("/achievements")} to="/achievements" onClick={closeMenu}>Logros</Link></li>
						</ul>
					)}

					<div className="sv-nav-actions">
						{token ? (
							<div className="sv-nav-user-area">
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
