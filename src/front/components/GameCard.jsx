export const GameCard = ({ game, isFavorite, onToggleFavorite }) => (
	<div className="col-6 col-md-4 col-lg-3">
		<div className="sv-game-card">
			<button
				className={`sv-fav-btn${isFavorite ? " active" : ""}`}
				title="Marcar favorito"
				onClick={() => onToggleFavorite(game.appid)}
			>
				<i className={isFavorite ? "fa-solid fa-star" : "fa-regular fa-star"}></i>
			</button>
			<img src={game.header_image} alt={game.name} loading="lazy" onError={(e) => { e.target.style.opacity = 0; }} />
			<div className="sv-game-body">
				<div className="sv-game-title" title={game.name}>{game.name}</div>
				<div className="sv-game-hours"><i className="fa-regular fa-clock"></i> {game.playtime_hours} h jugadas</div>
				<div className="sv-progress"><div className="sv-progress-bar" style={{ width: `${game.achievements.percentage}%` }}></div></div>
				<div className="sv-progress-label">
					<span>{game.achievements.unlocked}/{game.achievements.total} logros</span>
					<span>{game.achievements.percentage}%</span>
				</div>
			</div>
		</div>
	</div>
);
