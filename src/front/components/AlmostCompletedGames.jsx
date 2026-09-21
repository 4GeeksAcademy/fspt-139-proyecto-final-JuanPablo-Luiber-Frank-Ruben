import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const AlmostCompletedGames = () => {

    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const getAlmostCompletedGames = async () => {

        const token = localStorage.getItem("token");
        console.log("TOKEN:", token);

        if (!token) {
            setError("Debes iniciar sesión");
            setLoading(false);
            return;
        }

        try {
            console.log("AUTH HEADER:", `Bearer ${token}`);
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


    if (loading) {
        return (
            <section className="container py-5">

                <h2 className="h4 fw-bold mb-4">
                    🎯 Casi completados
                </h2>

                <div className="text-center py-4">
                    <div
                        className="spinner-border text-danger"
                        role="status"
                    >
                    </div>
                </div>

            </section>
        );
    }


    if (error) {
        return (
            <section className="container py-5">

                <h2 className="h4 fw-bold mb-4">
                    🎯 Casi completados
                </h2>

                <div className="alert alert-danger">
                    ❌ {error}
                </div>

            </section>
        );
    }


    if (games.length === 0) {
        return (
            <section className="container py-5">

                <h2 className="h4 fw-bold mb-4">
                    🎯 Casi completados
                </h2>

                <p className="text-secondary">
                    No tienes juegos casi completados.
                </p>

            </section>
        );
    }


    return (
        <section className="container py-5">

            <h2 className="h4 fw-bold mb-4">
                🎯 Casi completados
            </h2>

            <div className="row g-3">

                {games.map((game) => (

                    <div
                        className="col-12 col-md-6 col-lg-4"
                        key={game.appid}
                    >

                        <div className="card bg-black text-light border-secondary h-100">

                            <div className="card-body">

                                <h3 className="h5 card-title">
                                    {game.name}
                                </h3>

                                <p className="small text-secondary">
                                    {game.achievements_unlocked} /{" "}
                                    {game.achievements_total} logros
                                </p>
                                <p className="small text-secondary">
                                    Tiempo jugado: {(game.playtime_forever / 60).toFixed(1)} horas
                                </p>


                                <div className="d-flex justify-content-between mb-1">

                                    <span>
                                        Progreso
                                    </span>

                                    <span className="fw-bold">
                                        {game.percentage}%
                                    </span>

                                </div>


                                <div
                                    className="progress"
                                    role="progressbar"
                                    aria-valuenow={game.percentage}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                >

                                    <div
                                        className="progress-bar bg-danger"
                                        style={{
                                            width: `${game.percentage}%`
                                        }}
                                    >
                                        {game.percentage}%
                                    </div>

                                </div>


                                <button
                                    className="btn btn-danger mt-3"
                                    onClick={() =>
                                        navigate(`/achievements?appid=${game.appid}`)
                                    }
                                >
                                    Ver juego
                                </button>

                            </div>

                        </div>

                    </div>

                ))}

            </div>

        </section>
    );
};