import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useFavorites from "../hooks/useFavorites";

const FILTERS = [
    {key: "all", label: "Todos"},
    {key: "favorites", label: "Favoritos"},
    {key: "recent", label: "Mas jugados"},
];

//extraemos el payload del JWT del compañero

function getUserIdFromToken (token) {
    try {
        return JSON.parse(atob(token.split(".")[1])).sub;
    }   catch{
        return null;
    }
}

//Endpoints para sacar los juegos del usuario

export const MyGames = () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const [ token, setToken ] = useState(null);
	const { favorites, toggleFavorite } = useFavorites(token);
    const [ userId, setUserId ] = useState(null);
    const [ userGames, setUserGames ] = useState([]);
    const [ loading, setLoading ] = useState( true );
    const [ error, setError ] = useState("");
    const [ filter, setFilter ] = useState("all");
    const [ search, setSearch ] = useState("");

    //almacenamos el token en el loalstorage

    useEffect (() => {
        const stored = localStorage.getItem ("token");
        setToken ( stored );
        setUserId ( stored ? getUserIdFromToken ( stored ) : null );
        }, []
    ); 

    const loadGames = () => {
		if (!token || !userId) return;
		setLoading(true);
		setError("");
		fetch(`${backendUrl}/api/users/${userId}/games`, {
			headers: { Authorization: `Bearer ${token}` },
		})
			.then((res) => res.json().then((data) => ({ ok: res.ok, data })))
			.then(({ ok, data }) => {
				if (!ok) throw new Error(data.error || "No se pudieron cargar los juegos");
				setUserGames(data.games || []);
			})
			.catch((err) => setError(err.message))
			.finally(() => setLoading(false));
	};

    useEffect(loadGames, [token, userId]);

    const filteredGames = useMemo(() => {
		let result = [...userGames].sort((a, b) => b.playtime_forever - a.playtime_forever);
		if ( filter === "recent" ) result = [...result].sort((a, b) => b.playtime_forever - a.playtime_forever);
		if ( search.trim()) {
			const q = search.trim().toLowerCase();
			result = result.filter((ug) => ug.game.name.toLowerCase().includes(q));
		}
		if (filter === "favorites") result = result.filter((ug) => favorites.includes(ug.game.appid));
		return result;
	}, [ userGames, filter, search, favorites ]);

	const stats = useMemo(() => {
		const totalMinutes = userGames.reduce(( sum, ug ) => sum + ( ug.playtime_forever || 0 ), 0 );
		return { games: userGames.length, hours: Math.round( totalMinutes / 60 ) };
	}, [ userGames ]);

	if (!token) {
		return (
			<div className="container text-center py-5">
				<p className="text-danger">Debes iniciar sesión para ver tus juegos.</p>
			</div>
		);
	}

    return (
		<div className="sv-page">
			<header className="container py-5">
				<p className="text-uppercase text-danger small mb-1">Biblioteca</p>
				<h1 className="display-5 fw-bold">Mis juegos</h1>

				<div className="row g-3 mt-3">
					<div className="col-6 col-md-3">
						<div className="sv-panel border rounded p-3 text-center">
							<div className="fs-3 fw-bold text-danger">{stats.games}</div>
							<div className="small text-uppercase sv-text-dim">Juegos</div>
						</div>
					</div>
					<div className="col-6 col-md-3">
						<div className="sv-panel border rounded p-3 text-center">
							<div className="fs-3 fw-bold text-danger">{stats.hours.toLocaleString("es-ES")}</div>
							<div className="small text-uppercase sv-text-dim">Horas jugadas</div>
						</div>
					</div>
				</div>
			</header>

			{/* get para los juegos */}

			<section className="container py-5">
				<div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
					<h2 className="h4 fw-bold mb-0">Tu biblioteca</h2>
					<div className="btn-group">
						{FILTERS.map((f) => (
							<button
								key={f.key}
								className={`btn btn-sm ${filter === f.key ? "btn-danger" : "sv-btn-outline"}`}
								onClick={() => setFilter(f.key)}
							>
								{f.label}
							</button>
						))}
					</div>
				</div>

				<input
					type="text"
					className="form-control sv-ach-select form-control-sm mb-4 ms-auto"
					style={{ maxWidth: 220 }}
					placeholder="Buscar juego..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>

				{loading && (
					<div className="text-center py-5">
						<div className="spinner-border text-danger" role="status"></div>
					</div>
				)}
				{error && <div className="alert alert-danger">{error}</div>}

				{!loading && !error && (
					<div className="row g-3">
						{filteredGames.map((ug) => (
							<div className="col-6 col-md-4 col-lg-3" key={ug.id}>
								<div className="card sv-card h-100 position-relative">

									{/*Añadido el boton de favorito*/}

									<button className={`btn btn-sm position-absolute top-0 end-0 m-2 ${favorites.includes(ug.game.appid) ? "btn-warning" : "sv-btn-outline"}`}
										onClick={() => toggleFavorite(ug.game.appid)} title="Marcar favorito">
										<i className={favorites.includes(ug.game.appid) ? "fa-solid fa-star" : "fa-regular fa-star"}></i>
									</button>

									<img
										src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${ug.game.appid}/header.jpg`}
										className="card-img-top"
										alt={ug.game.name}
										loading="lazy"
										onError={(e) => { e.target.style.opacity = 0; }}
									/>
									<div className="card-body">
										<h3 className="h6 card-title text-truncate" title={ug.game.name}>{ug.game.name}</h3>
										<p className="card-text small sv-text-dim mb-2">
											<i className="fa-regular fa-clock"></i> {Math.round((ug.playtime_forever / 60) * 10) / 10} h jugadas
										</p>

										{ug.achievements_total > 0 && (
											<>
												<div className="d-flex justify-content-between mb-1 small">
													<span className="sv-text-dim">
														{ug.achievements_unlocked}/{ug.achievements_total} logros
													</span>
													<span className="fw-bold">
														{Math.round(ug.achievement_percentage)}%
													</span>
												</div>
												<div
													className="sv-progress mb-2"
													role="progressbar"
													aria-valuenow={Math.round(ug.achievement_percentage)}
													aria-valuemin="0"
													aria-valuemax="100"
												>
													<div
														className="sv-progress-fill"
														style={{ width: `${ug.achievement_percentage}%` }}
													></div>
												</div>
											</>
										)}

										<Link to={`/achievements?appid=${ug.game.appid}`} className="btn btn-sm sv-btn-outline">
											<i className="fa-solid fa-trophy"></i> Ver logros
										</Link>
									</div>
								</div>
							</div>
						))}
					</div>
				)}

				{!loading && !error && filteredGames.length === 0 && (
					<p className="text-center sv-text-dim py-4">
						{userGames.length === 0 ? "Todavía no tienes juegos. Sincroniza tu cuenta de Steam desde tu perfil." : "No hay juegos que coincidan con este filtro."}
					</p>
				)}
			</section>
		</div>
	);
};
