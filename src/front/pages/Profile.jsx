import { useState, useEffect } from "react";


export const Profile = () => {

    const [steamMessage, setSteamMessage] = useState("");
    const [steamError, setSteamError] = useState("");


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

    const connectSteam = async () => {

        setSteamMessage("");
        setSteamError("");

        const token = localStorage.getItem("token");

        if (!token) {
            setSteamError("Debes iniciar sesión primero");
            return;
        }

        const url = `${import.meta.env.VITE_BACKEND_URL}/api/steam/login`

        try {
            const response = await fetch(url,
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
                    data.error || "No se pudo conectar con Steam"
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



    return (

        <div>
            <button onClick={connectSteam}>
                vincular Steam
            </button>

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

    )

}