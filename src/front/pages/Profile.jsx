import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import useFavorites from "../hooks/useFavorites";
import { api } from "../services/api";
import { GameCard } from "../components/GameCard";
import { STATUS_LABELS, timeAgoShort, timeAgoYears } from "../utils/format";

const FILTERS = [
	{ key: "all", label: "Todos" },
	{ key: "perfect", label: "100% logros" },
	{ key: "favorites", label: "Favoritos" },
	{ key: "recent", label: "Recientes" },
];

function filterGames(games, filter, favorites) {
	switch (filter) {
		case "perfect": return games.filter((g) => g.achievements.total > 0 && g.achievements.percentage === 100);
		case "favorites": return games.filter((g) => favorites.includes(g.appid));
		case "recent": return games.filter((g) => g.playtime_2weeks > 0).sort((a, b) => b.playtime_2weeks - a.playtime_2weeks);
		default: return games;
	}
}

export const Profile = () => {
	const { steamId } = useParams();
	const { store } = useGlobalReducer();
	const { favorites, toggleFavorite } = useFavorites(steamId, store.token);

	const [profile, setProfile] = useState(null);
	const [games, setGames] = useState([]);
	const [highlights, setHighlights] = useState({ featuredAchievements: [], recentAchievements: [], friendsAchievements: [] });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [filter, setFilter] = useState("all");

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError("");

		Promise.all([
			api.profile(steamId),
			api.games(steamId),
			api.highlights(steamId, store.token),
		]).then(([profileData, gamesData, highlightsData]) => {
			if (cancelled) return;
			setProfile(profileData);
			setGames(gamesData.games);
			setHighlights(highlightsData);
		}).catch((err) => {
			if (!cancelled) setError(err.message);
		}).finally(() => {
			if (!cancelled) setLoading(false);
		});

		return () => { cancelled = true; };
	}, [steamId, store.token]);

	const stats = useMemo(() => ({
		games: games.length,
		hours: Math.round(games.reduce((sum, g) => sum + g.playtime_hours, 0)),
		achievements: games.reduce((sum, g) => sum + g.achievements.unlocked, 0),
	}), [games]);

	const filteredGames = useMemo(() => filterGames(games, filter, favorites).slice(0, 8), [games, filter, favorites]);
	const mostPlayed = games[0];

	if (loading) return <div className="sv-spinner"></div>;
	if (error || !profile) {
		return (
			<div className="sv-empty">
				<i className="fa-solid fa-triangle-exclamation"></i>
				<p>{error || "No se pudo cargar el perfil."}</p>
				<Link to="/search" className="btn sv-btn-accent mt-2">Volver a buscar</Link>
			</div>
		);
	}

	const isMock = profile.source !== "registered";
	const tickerItems = [
		`👤 ${stats.games} JUEGOS EN LA BIBLIOTECA`,
		`⏱ ${stats.hours.toLocaleString("es-ES")} HORAS JUGADAS EN TOTAL`,
		`🏆 ${stats.achievements} LOGROS DESBLOQUEADOS`,
		mostPlayed ? `🔥 MÁS JUGADO: ${mostPlayed.name.toUpperCase()}` : null,
	].filter(Boolean);

	return (
		<>
			<header className="sv-overview" id="overview">
				<div className="container">
					<div className="row align-items-center g-4">
						<div className="col-auto">
							<img src={profile.avatarfull} alt="Avatar" className="sv-avatar" />
						</div>
						<div className="col">
							<div className="d-flex align-items-center gap-2 flex-wrap mb-1">
								<h1 className="sv-player-name mb-0">{profile.personaname}</h1>
								<span className="sv-level-badge">Nivel {profile.level ?? "—"}</span>
								<span className={`sv-badge-source ${isMock ? "mock" : "registered"}`}>
									{isMock ? "Datos de ejemplo" : "Cuenta registrada"}
								</span>
							</div>
							<p className="sv-player-meta mb-1">
								<span className={`sv-status-dot ${profile.personastate > 0 ? "sv-status-online" : ""}`}></span>
								{STATUS_LABELS[profile.personastate ?? 0] || "Desconocido"}
								&nbsp;·&nbsp; SteamID: {profile.steamid}
							</p>
							<p className="sv-player-meta mb-0">
								<i className="fa-solid fa-calendar-days"></i> Miembro desde {timeAgoYears(profile.timecreated)}
								&nbsp;·&nbsp; <i className="fa-solid fa-location-dot"></i> {profile.loccountrycode || "—"}
							</p>
						</div>
					</div>

					<div className="sv-stats-row">
						<div className="sv-stat-tile"><div className="sv-stat-value">{stats.games}</div><div className="sv-stat-label">Juegos</div></div>
						<div className="sv-stat-tile"><div className="sv-stat-value">{stats.hours.toLocaleString("es-ES")}</div><div className="sv-stat-label">Horas jugadas</div></div>
						<div className="sv-stat-tile"><div className="sv-stat-value">{stats.achievements}</div><div className="sv-stat-label">Logros desbloqueados</div></div>
						<div className="sv-stat-tile"><div className="sv-stat-value">{profile.friendsCount ?? "—"}</div><div className="sv-stat-label">Amigos</div></div>
					</div>
				</div>
			</header>

			<div className="sv-ticker">
				<div className="sv-ticker-track">
					{[...tickerItems, ...tickerItems].map((t, i) => (
						<span key={i}>{t}<span className="sv-sep">✦</span></span>
					))}
				</div>
			</div>

			<section className="sv-section" id="achievements">
				<div className="container">
					<div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
						<div>
							<p className="sv-label">HALL OF FAME</p>
							<h2 className="sv-h2">LOGROS <span style={{ color: "var(--accent)" }}>DESTACADOS</span></h2>
						</div>
						<Link to={`/profile/${steamId}/achievements`} className="btn sv-btn-outline">Ver todos los logros <i className="fa-solid fa-arrow-right ms-1"></i></Link>
					</div>

					<div className="row g-3">
						{highlights.featuredAchievements.length === 0 && (
							<div className="sv-empty"><i className="fa-solid fa-trophy"></i><p>Todavía no hay logros desbloqueados.</p></div>
						)}
						{highlights.featuredAchievements.map((a) => (
							<div className="col-6 col-md-4 col-lg-3" key={`${a.appid}-${a.apiname}`}>
								<div className="sv-featured-card">
									<div className="sv-featured-icon"><i className="fa-solid fa-trophy"></i></div>
									<div>
										<div className="sv-featured-name">{a.displayName}</div>
										<div className="sv-featured-game">{a.gameName}</div>
										<div className="sv-featured-rarity">{a.globalPercentage != null ? `${a.globalPercentage.toFixed(1)}% de los jugadores` : ""}</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="sv-section" id="games" style={{ background: "var(--bg-2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
				<div className="container">
					<div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
						<div>
							<p className="sv-label">BIBLIOTECA</p>
							<h2 className="sv-h2">MIS <span style={{ color: "var(--accent)" }}>JUEGOS</span></h2>
						</div>
						<div className="sv-filter-group">
							{FILTERS.map((f) => (
								<button key={f.key} className={`sv-filter-btn${filter === f.key ? " active" : ""}`} onClick={() => setFilter(f.key)}>
									{f.label}
								</button>
							))}
						</div>
					</div>

					<div className="row g-3">
						{filteredGames.map((g) => (
							<GameCard key={g.appid} game={g} isFavorite={favorites.includes(g.appid)} onToggleFavorite={toggleFavorite} />
						))}
					</div>
					{filteredGames.length === 0 && (
						<p className="sv-empty"><i className="fa-solid fa-gamepad"></i>No hay juegos que coincidan con este filtro.</p>
					)}

					<div className="text-center mt-4">
						<Link to={`/profile/${steamId}/games`} className="btn sv-btn-outline">Ver más juegos <i className="fa-solid fa-arrow-right ms-1"></i></Link>
					</div>
				</div>
			</section>

			<section className="sv-section" id="activity">
				<div className="container">
					<p className="sv-label">ACTIVIDAD</p>
					<h2 className="sv-h2 mb-4">ÚLTIMOS <span style={{ color: "var(--accent)" }}>MOVIMIENTOS</span></h2>
					<div className="row g-4">
						<div className="col-lg-6">
							<div className="sv-activity-col-title"><i className="fa-solid fa-trophy me-2"></i>Mis últimos logros</div>
							{highlights.recentAchievements.length === 0 && (
								<div className="sv-empty"><i className="fa-solid fa-trophy"></i><p>Sin actividad reciente.</p></div>
							)}
							{highlights.recentAchievements.map((a) => (
								<div className="sv-activity-item" key={`${a.appid}-${a.apiname}`}>
									<div className="sv-activity-icon"><i className="fa-solid fa-trophy"></i></div>
									<div className="sv-activity-text">
										<div className="sv-activity-title">{a.displayName}</div>
										<div className="sv-activity-sub">{a.gameName}</div>
									</div>
									<div className="sv-activity-time">{timeAgoShort(a.unlocktime)}</div>
								</div>
							))}
						</div>
						<div className="col-lg-6">
							<div className="sv-activity-col-title"><i className="fa-solid fa-users me-2"></i>Logros de tus amigos</div>
							{highlights.friendsAchievements.length === 0 && (
								<div className="sv-empty"><i className="fa-solid fa-users"></i><p>{store.user ? "Todavía no tienes amigos añadidos." : "Inicia sesión para ver la actividad de tus amigos."}</p></div>
							)}
							{highlights.friendsAchievements.map((f, i) => (
								<div className="sv-activity-item" key={i}>
									<img src={f.friendAvatar} alt={f.friendName} className="sv-activity-avatar" onError={(e) => { e.target.style.opacity = 0; }} />
									<div className="sv-activity-text">
										<div className="sv-activity-title">{f.friendName} <span style={{ color: "var(--text-dim)", fontWeight: 400 }}>desbloqueó</span> {f.achievementName}</div>
										<div className="sv-activity-sub">{f.gameName}</div>
									</div>
									<div className="sv-activity-time">{timeAgoShort(f.unlocktime)}</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>
		</>
	);
};
