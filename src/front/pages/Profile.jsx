import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { AlmostCompletedGames } from "../components/AlmostCompletedGames";
import { GameCard } from "../components/GameCard";
import useFavorites from "../hooks/useFavorites";
import "./profile.css";

const FILTERS = [
    { key: "all", label: "Todos" },
    { key: "favorites", label: "Favoritos" },
    { key: "recent", label: "Más jugados" },
];

export const Profile = () => {

    const [steamAccount, setSteamAccount] = useState(null);
    const [steamMessage, setSteamMessage] = useState("");
    const [steamError, setSteamError] = useState("");
    const [syncing, setSyncing] = useState(false);
    const [games, setGames] = useState([]);
    const [checkingSteam, setCheckingSteam] = useState(true);
    const [authToken] = useState(() => localStorage.getItem("token"));
    const { favorites, toggleFavorite } = useFavorites(authToken);
    const [me, setMe] = useState(null);
    const [steamPersona, setSteamPersona] = useState(null);
    const [friends, setFriends] = useState([]);
    const [filter, setFilter] = useState("all");
    const [almostKey, setAlmostKey] = useState(0);



    const loadGames = async () => {

        const token = localStorage.getItem("token");

        if (!token) {
            setCheckingSteam(false);
            return;
        }

        try {

            const payload = JSON.parse(
                atob(token.split(".")[1])
            );

            const userId = payload.sub;

            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/users/${userId}/games`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || data.msg || "No se pudieron cargar los juegos"
                );
            }

            setGames(data.games || []);

        } catch (error) {

            console.error("Error cargando juegos:", error);

        }
    };


    useEffect(() => {

        const getSteamProfile = async () => {

            const token = localStorage.getItem("token");

            if (!token) {
                return;
            }

            try {

                const response = await fetch(
                    `${import.meta.env.VITE_BACKEND_URL}/api/steam/profile`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (response.ok && data.linked) {
                    setSteamAccount(data.steam_account);
                    setSteamPersona(data.steam_profile?.result || null);

                    loadGames();
                }

            } catch (error) {

                console.error(error);

            } finally {

                setCheckingSteam(false);

            }
        };

        getSteamProfile();

    }, []);


    // datos del usuario (nombre, email) y contador de amigos
    useEffect(() => {

        if (!authToken) {
            return;
        }

        const headers = { Authorization: `Bearer ${authToken}` };
        const backendUrl = import.meta.env.VITE_BACKEND_URL;

        fetch(`${backendUrl}/api/me`, { headers })
            .then((res) => res.json())
            .then((data) => setMe(data.user || null))
            .catch(() => {});

        fetch(`${backendUrl}/api/friends`, { headers })
            .then((res) => res.json())
            .then((data) => setFriends(data.friendships || []))
            .catch(() => {});

    }, [authToken]);


    useEffect(() => {

        const params = new URLSearchParams(window.location.search);

        if (params.get("steam") === "connected") {

            setSteamMessage(
                "¡Cuenta de Steam conectada correctamente!"
            );

            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );
        }

    }, []);


    // ==========================================
    // VINCULAR STEAM
    // ==========================================
    const connectSteam = async () => {

        setSteamMessage("");
        setSteamError("");

        const token = localStorage.getItem("token");

        if (!token) {
            setSteamError("Debes iniciar sesión primero");
            return;
        }

        const url = `${import.meta.env.VITE_BACKEND_URL}/api/steam/login`;

        try {

            const response = await fetch(
                url,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    credentials: "include"
                }
            );

            const data = await response.json();

            if (!response.ok) {

                setSteamError(
                    data.error || data.msg || "No se pudo conectar con Steam"
                );

                return;
            }

            window.location.href = data.steam_login_url;

        } catch (error) {

            console.error(error);

            setSteamError(
                "No se pudo conectar con el servidor"
            );
        }
    };


    // ==========================================
    // DESVINCULAR STEAM
    // ==========================================
    const unlinkSteam = async () => {

        setSteamMessage("");
        setSteamError("");

        const token = localStorage.getItem("token");

        if (!token) {

            setSteamError(
                "Debes iniciar sesión primero"
            );

            return;
        }

        try {

            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/steam/account`,
                {
                    method: "DELETE",

                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {

                setSteamError(
                    data.error || data.msg ||
                    "No se pudo desvincular Steam"
                );

                return;
            }

            setSteamAccount(null);
            setGames([]);

            setSteamMessage(
                "Cuenta de Steam desvinculada correctamente"
            );

        } catch (error) {

            console.error(error);

            setSteamError(
                "No se pudo conectar con el servidor"
            );
        }
    };


    // ==========================================
    // SINCRONIZAR STEAM
    // ==========================================
    const syncSteam = async () => {

        setSteamMessage("");
        setSteamError("");
        setSyncing(true);

        const token = localStorage.getItem("token");

        if (!token) {

            setSteamError(
                "Debes iniciar sesión primero"
            );

            setSyncing(false);
            return;
        }

        try {

            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/steam/sync`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {

                setSteamError(
                    data.error || data.msg ||
                    "No se pudieron sincronizar los juegos"
                );

                return;
            }

            // Actualizar los juegos en la interfaz
            setGames(data.games || []);

            // recargar "Casi completados" con los porcentajes nuevos
            setAlmostKey((key) => key + 1);

            setSteamMessage(
                "¡Juegos de Steam sincronizados correctamente!"
            );

        } catch (error) {

            console.error(error);

            setSteamError(
                "No se pudo conectar con el servidor"
            );

        } finally {

            setSyncing(false);
        }
    };


    // ==========================================
    // OCULTAR STEAM ID
    // ==========================================
    const hideSteamId = (steamId) => {

        if (!steamId) {
            return "";
        }

        return `********${steamId.slice(-4)}`;
    };


    // ==========================================
    // RESUMEN Y FILTROS
    // ==========================================
    const stats = useMemo(() => {

        const totalMinutes = games.reduce(
            (sum, userGame) => sum + (userGame.playtime_forever || 0),
            0
        );

        return {
            games: games.length,
            hours: Math.round(totalMinutes / 60),
            friends: friends.length,
        };

    }, [games, friends]);

    const filteredGames = useMemo(() => {

        let result = games;

        if (filter === "favorites") {
            result = result.filter((userGame) => favorites.includes(userGame.game.appid));
        }

        if (filter === "recent") {
            result = [...result].sort((a, b) => b.playtime_forever - a.playtime_forever);
        }

        return result.slice(0, 8);

    }, [games, filter, favorites]);


    return (
        <div className="profile-page">

            {/* CABECERA */}
            <header className="sv-overview">

                <div className="container">

                    <div className="profile-label">TROPHY HUNTER</div>

                    <div className="row align-items-center g-4">

                        <div className="col-auto">
                            <img
                                src={
                                    steamPersona?.avatar?.large ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(me?.nickname || "TH")}`
                                }
                                alt="Avatar"
                                className="sv-avatar"
                            />
                        </div>

                        <div className="col">

                            <div className="d-flex align-items-center gap-2 flex-wrap mb-1">

                                <h1 className="sv-player-name mb-0">
                                    {me?.nickname || steamPersona?.nickname || "Mi perfil"}
                                </h1>

                                <span className={`sv-badge-source ${steamAccount ? "registered" : "mock"}`}>
                                    {steamAccount ? "Steam vinculado" : "Steam sin vincular"}
                                </span>

                            </div>

                            <p className="sv-player-meta mb-0">
                                {me?.email}
                            </p>

                        </div>

                    </div>

                    {/* TARJETAS DE RESUMEN */}
                    <div className="sv-stats-row">

                        <div className="sv-stat-tile">
                            <div className="sv-stat-value">{stats.games}</div>
                            <div className="sv-stat-label">Juegos</div>
                        </div>

                        <div className="sv-stat-tile">
                            <div className="sv-stat-value">{stats.hours.toLocaleString("es-ES")}</div>
                            <div className="sv-stat-label">Horas jugadas</div>
                        </div>

                        <div className="sv-stat-tile">
                            <div className="sv-stat-value">{stats.friends}</div>
                            <div className="sv-stat-label">Amigos</div>
                        </div>

                    </div>

                </div>

            </header>


            <div className="container py-5">

                {/* MENSAJE DE ÉXITO */}

                {steamMessage && (

                    <div className="profile-message profile-message-success mb-3">

                        <i className="fa-solid fa-circle-check me-2"></i>
                        {steamMessage}

                    </div>

                )}


                {/* MENSAJE DE ERROR */}

                {steamError && (

                    <div className="profile-message profile-message-error mb-3">

                        <i className="fa-solid fa-circle-exclamation me-2"></i>
                        {steamError}

                    </div>

                )}


                {checkingSteam ? (

                    /* ==============================
                       COMPROBANDO STEAM
                    ============================== */

                    <div className="profile-card text-center">
                        <div className="profile-spinner"></div>

                        <p className="profile-info">
                            Comprobando conexión con Steam...
                        </p>
                    </div>


                ) : !steamAccount ? (

                    /* ==============================
                       STEAM NO CONECTADO
                    ============================== */

                    <div className="profile-card">

                        <div className="profile-section-title">
                            <i className="fa-brands fa-steam me-2"></i>
                            Steam
                        </div>

                        <p className="profile-info">
                            Tu cuenta de Steam no está vinculada.
                        </p>

                        <button
                            className="profile-btn"
                            onClick={connectSteam}
                        >
                            <i className="fa-brands fa-steam me-2"></i>
                            Vincular Steam
                        </button>

                    </div>


                ) : (

                    /* ==============================
                       STEAM CONECTADO
                    ============================== */

                    <>

                        {/* INFORMACIÓN STEAM */}

                        <div className="sv-steam-card linked mb-4">

                            <div className="sv-steam-icon">
                                <i className="fa-brands fa-steam"></i>
                            </div>

                            <div className="flex-grow-1">

                                <div className="sv-game-title">
                                    Cuenta de Steam vinculada
                                </div>

                                <p className="profile-info mb-0">
                                    Steam ID:{" "}
                                    <span className="profile-steam-id">
                                        {hideSteamId(
                                            steamAccount.steam_id
                                        )}
                                    </span>
                                </p>

                            </div>


                            <div className="d-flex gap-2 flex-wrap sv-steam-actions">

                                {/* SINCRONIZAR */}

                                <button
                                    className="profile-btn"
                                    onClick={syncSteam}
                                    disabled={syncing}
                                >
                                    <i className={`fa-solid fa-rotate me-2${syncing ? " fa-spin" : ""}`}></i>
                                    {syncing
                                        ? "Sincronizando..."
                                        : games.length === 0
                                            ? "Sincronizar Steam"
                                            : "Actualizar juegos"
                                    }
                                </button>


                                {/* DESVINCULAR */}

                                <button
                                    className="profile-btn-outline"
                                    onClick={unlinkSteam}
                                    disabled={syncing}
                                >
                                    Desvincular Steam
                                </button>

                            </div>

                        </div>


                        {/* CASI COMPLETADOS */}

                        <div className="profile-card mb-4">

                            <div className="profile-section-title">
                                <i className="fa-solid fa-trophy me-2"></i>
                                Casi completados
                            </div>

                            <AlmostCompletedGames key={almostKey} />

                        </div>


                        {/* JUEGOS */}

                        <div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mt-5 mb-4">

                            <div>

                                <p className="sv-label">BIBLIOTECA</p>

                                <h2 className="sv-h2">
                                    MIS <span style={{ color: "var(--accent)" }}>JUEGOS</span>
                                </h2>

                            </div>

                            <div className="sv-filter-group">

                                {FILTERS.map((item) => (

                                    <button
                                        key={item.key}
                                        className={`sv-filter-btn${filter === item.key ? " active" : ""}`}
                                        onClick={() => setFilter(item.key)}
                                    >
                                        {item.label}
                                    </button>

                                ))}

                            </div>

                        </div>


                        {filteredGames.length === 0 && (

                            <p className="sv-empty">
                                <i className="fa-solid fa-gamepad"></i>
                                {games.length === 0
                                    ? "Todavía no has sincronizado tu biblioteca. Usa el botón de arriba."
                                    : "No hay juegos que coincidan con este filtro."}
                            </p>

                        )}


                        <div className="row g-3">

                            {filteredGames.map((userGame) => (

                                <GameCard
                                    key={userGame.id}
                                    userGame={userGame}
                                    isFavorite={favorites.includes(userGame.game.appid)}
                                    onToggleFavorite={toggleFavorite}
                                    achievementsLink={`/achievements?appid=${userGame.game.appid}`}
                                />

                            ))}

                        </div>


                        {games.length > 8 && (

                            <div className="text-center mt-4">

                                <Link to="/games" className="btn sv-btn-outline">
                                    Ver todos los juegos <i className="fa-solid fa-arrow-right ms-1"></i>
                                </Link>

                            </div>

                        )}

                    </>

                )}

            </div>

        </div>
    );
};