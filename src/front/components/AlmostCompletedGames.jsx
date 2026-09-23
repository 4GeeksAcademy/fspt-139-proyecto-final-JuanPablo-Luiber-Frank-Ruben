import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const AlmostCompletedGames = () => {

    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const getAlmostCompletedGames = async () => {

        const token = localStorage.getItem("token");

        if (!token) {
            setError("Debes iniciar sesión");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/steam/games/almost-completed`,
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
                    data.error ||
                    "No se pudieron obtener los juegos casi completados"
                );
            }

            setGames(data.games || []);

        } catch (error) {

            console.error(error);

            setError(error.message);

        } finally {

            setLoading(false);

        }
    };


    useEffect(() => {
        getAlmostCompletedGames();
    }, []);


    // El título de la sección lo pone la página que usa este componente (Perfil)

    if (loading) {
        return (
            <div className="text-center py-3">
                <div className="profile-spinner"></div>
            </div>
        );
    }


    if (error) {
        return (
            <div className="profile-message profile-message-error">
                <i className="fa-solid fa-circle-exclamation me-2"></i>
                {error}
            </div>
        );
    }


    if (games.length === 0) {
        return (
            <>
                <p className="profile-info mb-1">
                    Todavía no tienes juegos casi completados.
                </p>
                <p className="sv-hint mb-0">
                    Aparecen aquí los juegos con más de 10 horas y al menos un 80% de logros.
                </p>
            </>
        );
    }


    return (
        <div className="row g-3">

            {games.map((game) => (

                <div
                    className="col-12 col-md-6 col-lg-4"
                    key={game.appid}
                >

                    <div className="card sv-card h-100">

                        <img
                            src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`}
                            className="card-img-top"
                            alt={game.name}
                            loading="lazy"
                            onError={(e) => { e.target.style.opacity = 0; }}
                        />

                        <div className="card-body">

                            <h3 className="h6 card-title text-truncate" title={game.name}>
                                {game.name}
                            </h3>

                            <p className="card-text small sv-text-dim mb-3">
                                {game.achievements_unlocked} / {game.achievements_total} logros
                                {" · "}
                                {(game.playtime_forever / 60).toFixed(1)} h
                            </p>

                            <div className="d-flex justify-content-between mb-1 small">

                                <span className="sv-text-dim">
                                    Progreso
                                </span>

                                <span className="fw-bold">
                                    {Math.round(game.percentage)}%
                                </span>

                            </div>

                            <div
                                className="sv-progress"
                                role="progressbar"
                                aria-valuenow={Math.round(game.percentage)}
                                aria-valuemin="0"
                                aria-valuemax="100"
                            >
                                <div
                                    className="sv-progress-fill"
                                    style={{
                                        width: `${game.percentage}%`
                                    }}
                                ></div>
                            </div>

                            <button
                                className="btn btn-sm sv-btn-outline mt-3"
                                onClick={() =>
                                    navigate(`/achievements?appid=${game.appid}`)
                                }
                            >
                                <i className="fa-solid fa-trophy me-1"></i>
                                Ver logros
                            </button>

                        </div>

                    </div>

                </div>

            ))}

        </div>
    );
};
