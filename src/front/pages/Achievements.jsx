import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./achievements.css"

function getUserIdFromToken(token) {
    try {
        return JSON.parse(atob(token.split(".")[1])).sub;
    } catch {
        return null;
    }
}

function formatDate(unixSeconds) {
    return new Date(unixSeconds * 1000).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

export const Achievements = () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [searchParams, setSearchParams] = useSearchParams();

    const [token] = useState(() => localStorage.getItem("token"));
    const userId = token ? getUserIdFromToken(token) : null;

    const [userGames, setUserGames] = useState([]);
    const [selectedAppid, setSelectedAppid] = useState(searchParams.get("appid") || "");
    const [achievements, setAchievements] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [error, setError] = useState("");

    // juegos más jugados primero: es más probable que tengan logros
    const sortedGames = useMemo(
        () => [...userGames].sort((a, b) => b.playtime_forever - a.playtime_forever),
        [userGames]
    );

    useEffect(() => {
        if (!token || !userId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        fetch(`${backendUrl}/api/users/${userId}/games`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.error || data.msg || "No se pudieron cargar tus juegos");
                setUserGames(data.games || []);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [token, userId, backendUrl]);

    useEffect(() => {
        if (!selectedAppid && sortedGames.length) {
            setSelectedAppid(String(sortedGames[0].game.appid));
        }
    }, [sortedGames, selectedAppid]);

    useEffect(() => {
        if (!selectedAppid || !token) return;
        let cancelled = false;
        setSearchParams({ appid: selectedAppid }, { replace: true });
        setDetailLoading(true);
        setError("");
        setAchievements(null);
        fetch(`${backendUrl}/api/steam/achievements/${selectedAppid}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json().then((data) => ({ status: res.status, ok: res.ok, data })))
            .then(({ status, ok, data }) => {
                if (cancelled) return;
                if (!ok) {
                    if (status === 400) throw new Error("Vincula tu cuenta de Steam desde tu perfil para ver tus logros.");
                    if (status === 502) throw new Error("Este juego no tiene logros, o Steam no devolvió datos para tu cuenta (el perfil debe ser público).");
                    throw new Error(data.error || data.msg || "No se pudieron cargar los logros");
                }
                setAchievements(data.achievements || []);
            })
            .catch((err) => {
                if (!cancelled) setError(err.message);
            })
            .finally(() => {
                if (!cancelled) setDetailLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [selectedAppid, token, backendUrl]);


    if (loading) return <div className="sv-spinner"></div>;

    const selectedGame = userGames.find((ug) => String(ug.game.appid) === selectedAppid);
    const total = achievements ? achievements.length : 0;
    const unlocked = achievements ? achievements.filter((a) => a.unlocked).length : 0;
    const pct = total ? Math.round((unlocked / total) * 100) : 0;
    const sorted = achievements
        ? [...achievements].sort((a, b) => Number(b.unlocked) - Number(a.unlocked))
        : [];

    return (
        <>
            <header className="sv-overview" style={{ padding: "2.5rem 0" }}>
                <div className="container">
                    <p className="sv-label">LOGROS</p>
                    <h2 className="sv-h2">TUS <span style={{ color: "var(--accent)" }}>LOGROS</span></h2>
                    <p className="sv-hint mt-2">Logros reales obtenidos en Steam</p>
                </div>
            </header>

            <div className="container" style={{ paddingTop: "2.5rem", paddingBottom: "2.5rem" }}>
                {userGames.length === 0 && (
                    <p className="sv-empty">
                        <i className="fa-solid fa-trophy"></i>
                        Sincroniza tu biblioteca de juegos desde tu perfil para ver logros.
                    </p>
                )}

                {userGames.length > 0 && (
                    <div className="row mb-3">
                        <div className="col-md-5">
                            <select
                                className="form-select sv-ach-select"
                                value={selectedAppid}
                                onChange={(e) => setSelectedAppid(e.target.value)}
                            >
                                {sortedGames.map((ug) => (
                                    <option key={ug.game.appid} value={ug.game.appid}>{ug.game.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {detailLoading && <div className="sv-spinner"></div>}

                {!detailLoading && error && (
                    <p className="sv-empty">
                        <i className="fa-solid fa-triangle-exclamation"></i>
                        {error}
                    </p>
                )}

                {!detailLoading && !error && achievements && (
                    total === 0 ? (
                        <p className="sv-empty">
                            <i className="fa-solid fa-trophy"></i>
                            Este juego no tiene logros.
                        </p>
                    ) : (
                        <>
                            <div className="sv-ach-summary">
                                <div className="sv-ach-ring" style={{ "--pct": pct }} data-pct={pct}></div>
                                <div className="sv-ach-summary-text">
                                    <div className="sv-ach-game">{selectedGame ? selectedGame.game.name : "Juego"}</div>
                                    <div className="sv-hint">{unlocked} de {total} logros desbloqueados</div>
                                </div>
                            </div>

                            {sorted.map((a) => (
                                <div className={`sv-ach-item${a.unlocked ? " unlocked" : ""}`} key={a.name}>
                                    <div className="sv-ach-icon">
                                        {a.icon && <img src={a.icon} alt={a.display_name || a.name} loading="lazy" />}
                                    </div>
                                    <div className="sv-ach-text">
                                        <div className="sv-ach-name">{a.display_name || a.name}</div>
                                        <div className="sv-ach-desc">{a.description || "Logro oculto"}</div>

                                        {/* ==================================
                                                PORCENTAJE GLOBAL
                                            ================================== */}

                                            {a.global_percentage !== null &&
                                                a.global_percentage !== undefined && (

                                                    <div className="sv-ach-global">

                                                        <i className="fa-thin fa-earth-americas" style={{color: "rgb(255, 0, 106);"}}></i>{" "}
                                                        {a.global_percentage}%
                                                        {" "}
                                                        de jugadores lo han conseguido

                                                    </div>
                                                )}
                                    </div>
                                    {a.unlocked && a.unlocked_at && (
                                        <div className="sv-ach-date">Desbloqueado el {formatDate(a.unlocked_at)}</div>
                                    )}
                                </div>
                            ))}
                        </>
                    )
                )}
            </div>
        </>
    );
};
