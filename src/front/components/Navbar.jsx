import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export const Navbar = () => {

	const navigate = useNavigate();
	const location = useLocation();
	const [token, setToken] = useState(() => localStorage.getItem("token"))

	useEffect(() => {
		setToken(localStorage.getItem("token"));
	}, [location]);

	const handleLogout = () => {
		localStorage.removeItem("token");
		setToken(null);
		navigate("/login");
	};

	const isActive = (path) => (location.pathname === path ? "active" : "");

	return (

		<nav className = "navbar navbar-expand-lg navbar-dar bg-dark">
			<div className = "container">
				
				<Link to={token ? "/profile" : "/login"} className="navbar-brand d-flex align-items-center gap-2">
					<i className="fa-solid fa-trophy"></i>
					<span>Trophy <strong className="text-primary">Hunter</strong></span>
				</Link>

				<button	className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
					aria-controls="navbarNav" aria-expanded="false" aria-label="Abrir menú">
					
					<span className="navbar-toggler-icon"></span>

				</button>

				<div className="collapse navbar-collapse" id="navbarNav">

					{token && (
						
						<ul className="navbar-nav me-auto">
							<li className="nav-item">
								<Link className={`nav-link ${isActive("/profile")}`} to="/profile">
								<i className="fa-solid fa-user me-1"></i> Perfil
								</Link>
							</li>
							<li className="nav-item">
								<Link className={`nav-link ${isActive("/games")}`} to="/games">
									<i className="fa-solid fa-gamepad me-1"></i> Mis juegos
								</Link>
							</li>
						</ul>
					)}

					<ul className="navbar-nav ms-auto">
						{token ? (
							<li className="nav-item">
								<button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
									<i className="fa-solid fa-arrow-right-from-bracket me-1"></i> Cerrar sesión
								</button>
							</li>
						) : (
							<>
								<li className="nav-item">
									<Link className={`nav-link ${isActive("/login")}`} to="/login">
										Iniciar sesión
									</Link>
								</li>
								<li className="nav-item">
									<Link className="btn btn-primary btn-sm ms-lg-2" to="/users">
										Crear cuenta
									</Link>
								</li>
							</>
						)}
					</ul>

				</div>
			</div>
		</nav>

	)

};