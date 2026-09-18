import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

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
			<div className="sv-navbar-inner">
				<Link to={token ? "/profile" : "/login"} className="sv-logo">
					<i className="fa-solid fa-gamepad"></i>
					STEAM<span>VIEW</span>
				</Link>

				<button
					className="sv-navbar-toggler"
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
							<li><Link className={isActive("#")} to="#" onClick={closeMenu}>Juegos</Link></li> {/* TODO: crear ruta de exploración de juegos */}
							<li><Link className={isActive("/games")} to="/games" onClick={closeMenu}>Mis juegos</Link></li>
							<li><Link className={isActive("#")} to="#" onClick={closeMenu}>Logros</Link></li> {/* TODO: crear ruta /achievements */}
							<li><Link className={isActive("#")} to="#" onClick={closeMenu}>Amigos</Link></li> {/* TODO: crear ruta /friends */}
						</ul>
					)}

					<div className="sv-nav-actions">
						{token ? (
							<>
								<Link to="/profile" className="sv-user-badge" onClick={closeMenu}>
									<i className="fa-solid fa-gear"></i>
									<span>{userName || "Mi cuenta"}</span>
								</Link>
								<button className="btn-sv btn-sv-outline" onClick={handleLogout}>
									<i className="fa-solid fa-arrow-right-from-bracket"></i> Cerrar sesión
								</button>
							</>
						) : (
							<>
								<Link className={`btn-sv btn-sv-ghost ${isActive("/login")}`} to="/login" onClick={closeMenu}>
									Iniciar sesión
								</Link>
								<Link className="btn-sv btn-sv-solid" to="/users" onClick={closeMenu}>
									Crear cuenta
								</Link>
							</>
						)}
					</div>
				</div>
			</div>
		</nav>
	);
}