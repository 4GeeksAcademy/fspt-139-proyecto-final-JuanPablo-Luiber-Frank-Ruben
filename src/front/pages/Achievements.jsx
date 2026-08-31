import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";

export const Achievements = () => {
	const { steamId } = useParams();
	const [games, setGames] = useState([]);
	const [selectedAppid, setSelectedAppid] = useState(null);
	const [detail, setDetail] = useState(null);
	const [playerName, setPlayerName] = useState("");
	const [loading, setLoading] = useState(true);
	const [detailLoading, setDetailLoading] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		Promise.all([api.profile(steamId), api.games(steamId)]).then(([profile, gamesData]) => {
			if (cancelled) return;
			setPlayerName(profile.personaname);
			setGames(gamesData.games);
			if (gamesData.games.length) setSelectedAppid(gamesData.games[0].appid);
		}).catch((err) => {
			if (!cancelled) setError(err.message);
		}).finally(() => {
			if (!cancelled) setLoading(false);
		});
		return () => { cancelled = true; };
	}, [steamId]);

	useEffect(() => {
		if (!selectedAppid) return;
		let cancelled = false;
		setDetailLoading(true);
		api.gameAchievements(steamId, selectedAppid).then((data) => {
			if (!cancelled) setDetail(data);
		}).catch((err) => {
			if (!cancelled) setError(err.message);
		}).finally(() => {
			if (!cancelled) setDetailLoading(false);
		});
		return () => { cancelled = true; };
	}, [steamId, selectedAppid]);

	if (loading) return <div className="sv-spinner"></div>;
	if (error) return <div className="sv-empty"><i className="fa-solid fa-triangle-exclamation"></i><p>{error}</p></div>;

	const total = detail?.achievements.length || 0;
	const unlocked = detail?.achievements.filter((a) => a.achieved === 1).length || 0;
	const pct = total ? Math.round((unlocked / total) * 100) : 0;
	const sorted = detail ? [...detail.achievements].sort((a, b) => b.achieved - a.achieved) : [];

	return (
		<>
			<header className="sv-overview" style={{ padding: "2.5rem 0" }}>
				<div className="container">
					<p className="sv-label">LOGROS</p>
					<h2 className="sv-h2">TODOS LOS <span style={{ color: "var(--accent)" }}>LOGROS</span></h2>
					<p className="sv-hint mt-2">Perfil de {playerName}</p>
				</div>
			</header>

			<div className="container" style={{ paddingTop: "2.5rem", paddingBottom: "2.5rem" }}>
				<div className="row mb-3">
					<div className="col-md-5">
						<select className="form-select sv-game-select" value={selectedAppid || ""} onChange={(e) => setSelectedAppid(Number(e.target.value))}>
							{games.map((g) => <option key={g.appid} value={g.appid}>{g.name}</option>)}
						</select>
					</div>
				</div>

				{detailLoading && <div className="sv-spinner"></div>}

				{!detailLoading && detail && (
					<>
						<div className="sv-ach-summary">
							<div className="sv-ach-ring" style={{ "--pct": pct }} data-pct={pct}></div>
							<div className="sv-ach-summary-text">
								<div className="sv-game-title" style={{ fontSize: "1.2rem" }}>{detail.gameName}</div>
								<div className="sv-hint">{unlocked} de {total} logros desbloqueados</div>
							</div>
						</div>

						{sorted.map((a) => (
							<div className={`sv-ach-item${a.achieved ? " unlocked" : ""}`} key={a.apiname}>
								<div className="sv-ach-icon"><i className={`fa-solid ${a.achieved ? "fa-trophy" : "fa-lock"}`}></i></div>
								<div className="sv-ach-text">
									<div className="sv-ach-name">{a.displayName}</div>
									<div className="sv-ach-desc">{a.description || (a.achieved ? "Logro desbloqueado" : "Logro bloqueado")}</div>
								</div>
								<div className="sv-ach-rarity">
									{a.globalPercentage != null && <><strong>{a.globalPercentage.toFixed(1)}%</strong>de los jugadores</>}
								</div>
							</div>
						))}
					</>
				)}
			</div>
		</>
	);
};
