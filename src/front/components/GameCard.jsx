import { Link } from "react-router-dom";

export const GameCard = ({ userGame, isFavorite, onToggleFavorite, achievementsLink }) => {
    const { game, playtime_forever } = userGame;
    const hours = Math.round((playtime_forever / 60) * 10) / 10;

    return (
        <div className="col-6 col-md-4 col-lg-3">
            <div className="card sv-card h-100 position-relative">
                {onToggleFavorite && (
                    <button
                        className={`btn btn-sm position-absolute top-0 end-0 m-2 ${isFavorite ? "btn-warning" : "sv-btn-outline"}`}
                        onClick={() => onToggleFavorite(game.appid)}
                        title="Marcar favorito"
                    >
                        <i className={isFavorite ? "fa-solid fa-star" : "fa-regular fa-star"}></i>
                    </button>
                )}
                <img
                    src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`}
                    className="card-img-top"
                    alt={game.name}
                    loading="lazy"
                    onError={(e) => { e.target.style.opacity = 0; }}
                />
                <div className="card-body">
                    <h3 className="h6 card-title text-truncate" title={game.name}>{game.name}</h3>
                    <p className="card-text small sv-text-dim mb-0">
                        <i className="fa-regular fa-clock"></i> {hours} h jugadas
                    </p>
                    {achievementsLink && (
                        <Link to={achievementsLink} className="btn btn-sm sv-btn-outline mt-2">
                            <i className="fa-solid fa-trophy"></i> Ver logros
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};
