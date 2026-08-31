import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import useFavorites from "../hooks/useFavorites";
import { api } from "../services/api";
import { GameCard } from "../components/GameCard";

const FILTERS = [
	{ key: "all", label: "Todos" },
	{ key: "perfect", label: "100% logros" },
	{ key: "favorites", label: "Favoritos" },
	{ key: "recent", label: "Recientes" },
];

export const Games = () => {
	const { steamId } = useParams();
	const { store } = useGlobalReducer();
	const { favorites, toggleFavorite } = useFavorites(steamId, store.token);

	const [games, setGames] = useState([]);
	const [playerName, setPlayerName] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [filter, setFilter] = useState("all");
	const [search, setSearch] = useState("");

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		Promise.all([api.profile(steamId), api.games(steamId)]).then(([profile, gamesData]) => {
			if (cancelled) return;
			setPlayerName(profile.personaname);
			setGames(gamesData.games);
		}).catch((err) => {
			if (!cancelled) setError(err.message);
		}).finally(() => {
			if (!cancelled) setLoading(false);
		});
		return () => { cancelled = true; };
	}, [steamId]);

	const filteredGames = useMemo(() => {
		let result;
		switch (filter) {
			case "perfect": result = games.filter((g) => g.achievements.total > 0 && g.achievements.percentage === 100); break;
			case "favorites": result = games.filter((g) => favorites.includes(g.appid)); break;
			case "recent": result = games.filter((g) => g.playtime_2weeks > 0).sort((a, b) => b.playtime_2weeks - a.playtime_2weeks); break;
			default: result = games;
		}
		if (search.trim()) {
			const q = search.trim().toLowerCase();
			result = result.filter((g) => g.name.toLowerCase().includes(q));
		}
		return result;
	}, [games, filter, favorites, search]);

	if (loading) return <div className="sv-spinner"></div>;
	if (error) return <div className="sv-empty"><i className="fa-solid fa-triangle-exclamation"></i><p>{error}</p></div>;

	return (
		<>
			<header className="sv-overview" style={{ padding: "2.5rem 0" }}>
				<div className="container">
					<p className="sv-label">BIBLIOTECA</p>
					<h2 className="sv-h2">TODOS LOS <span style={{ color: "var(--accent)" }}>JUEGOS</span></h2>
					<p className="sv-hint mt-2">Perfil de {playerName} · {games.length} juegos</p>
				</div>
			</header>

			<div className="container" style={{ paddingTop: "2.5rem", paddingBottom: "2.5rem" }}>
				<div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
					<div className="sv-filter-group">
						{FILTERS.map((f) => (
							<button key={f.key} className={`sv-filter-btn${filter === f.key ? " active" : ""}`} onClick={() => setFilter(f.key)}>
								{f.label}
							</button>
						))}
					</div>
					<input
						type="text"
						className="form-control form-control-sm"
						style={{ maxWidth: 220, background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text)" }}
						placeholder="Buscar juego..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>

				<div className="row g-3">
					{filteredGames.map((g) => (
						<GameCard key={g.appid} game={g} isFavorite={favorites.includes(g.appid)} onToggleFavorite={toggleFavorite} />
					))}
				</div>
				{filteredGames.length === 0 && (
					<p className="sv-empty"><i className="fa-solid fa-gamepad"></i>No hay juegos que coincidan con este filtro.</p>
				)}
			</div>
		</>
	);
};
