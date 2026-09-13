import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export const Navbar = () => {

	const navigate = useNavigate();
	const location = useLocation();
	const [Token, setToken] = useState(localStorage.getItem)

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
				
				<link to = {token ? "/profile" : "/login"} className="navbar-brand d-flex align-items-center gap-2">
					<i className="fa-solid fa-gamepad"></i>
					<span>Steam<stron className ="text-primary">View</stron></span>
				</link>

				<button	className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
					aria-controls="navbarNav" aria-expanded="false" aria-label="Abrir menú">
					
					<span className="navbar-toggler-icon"></span>

				</button>

				<div className="collapse navbar-collapse" id="navbarNav">

					{token && (
						
					)
					
					}

				</div>
			</div>
		</nav>

	)

/* 	return (
		<nav className="navbar navbar-light bg-light">
			<div className="container">
				<Link to="/">
					<span className="navbar-brand mb-0 h1">React Boilerplate</span>
				</Link>
				<div className="ml-auto">
					<Link to="/demo">
						<button className="btn btn-primary">Check the Context in action</button>
					</Link>
				</div>
			</div>
		</nav>
	); */
};