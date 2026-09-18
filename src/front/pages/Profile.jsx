import { useState, useEffect } from "react";
import { AlmostCompletedGames } from "../components/AlmostCompletedGames";


export const Profile = () => {

    const [steamAccount, setSteamAccount] = useState(null);
    const [steamMessage, setSteamMessage] = useState("");
    const [steamError, setSteamError] = useState("");
    const [syncing, setSyncing] = useState(false);
    const [games, setGames] = useState([]);
    const [checkingSteam, setCheckingSteam] = useState(true);



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


    return (
        <div>

            <h1>Mi perfil</h1>

            {checkingSteam ? (

                <div>
                    <p>⏳ Comprobando conexión con Steam...</p>
                </div>

            ) : !steamAccount ? (

                <div>

                    <h3>🎮 Steam</h3>

                    <p>
                        Tu cuenta de Steam no está vinculada.
                    </p>

                    <button onClick={connectSteam}>
                        🎮 Vincular Steam
                    </button>

                </div>

            ) : (

                <div>

                    <h3>
                        ✅ Steam conectada
                    </h3>

                    <p>
                        Steam ID:{" "}
                        {hideSteamId(
                            steamAccount.steam_id
                        )}
                    </p>

                    {/* BOTÓN SINCRONIZAR */}
                    <button
                        onClick={syncSteam}
                        disabled={syncing}
                    >
                        {syncing
                            ? "⏳ Sincronizando..."
                            : games.length === 0
                                ? "🔄 Sincronizar Steam"
                                : "🔄 Actualizar juegos"
                        }
                    </button>

                    {" "}

                    <button
                        onClick={unlinkSteam}
                        disabled={syncing}
                    >
                        ❌ Desvincular Steam
                    </button>

                    {/* CASI COMPLETADOS */}

                    <AlmostCompletedGames />

                    {/* JUEGOS */}
                    {games.length > 0 && (

                        <div>

                            <h3>
                                🎮 Mis juegos
                            </h3>

                            <p>
                                Juegos sincronizados: {games.length}
                            </p>

                            {games.map((userGame) => (

                                <div key={userGame.id}>

                                    <h4>
                                        {userGame.game.name}
                                    </h4>

                                    <p>
                                        Tiempo jugado:{" "}
                                        {Math.floor(userGame.playtime_forever / 60)} horas
                                    </p>

                                </div>

                            ))}

                        </div>

                    )}

                </div>

            )}

            {steamMessage && (

                <p>
                    ✅ {steamMessage}
                </p>

            )}

            {steamError && (

                <p>
                    ❌ {steamError}
                </p>

            )}

        </div>
    );
};