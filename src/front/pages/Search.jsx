import { useState } from "react";
import { useNavigate } from "react-router-dom";

const EXAMPLES = ["76561198012345678", "gaben_demo", "nexus_player"];

export const Search = () => {
	const navigate = useNavigate();
	const [value, setValue] = useState("");

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!value.trim()) return;
		navigate(`/profile/${encodeURIComponent(value.trim())}`);
	};

	return (
		<section className="sv-hero">
			<div className="container">
				<div className="row justify-content-center">
					<div className="col-lg-7 text-center mb-5">
						<h1 className="sv-hero-title mb-3">Explora cualquier <span className="sv-outline">perfil</span></h1>
						<p className="sv-hero-sub mx-auto">
							Consulta la biblioteca de juegos, el progreso de logros y la lista de amigos
							de cualquier perfil, sin necesidad de cuenta.
						</p>
					</div>
				</div>

				<div className="row justify-content-center">
					<div className="col-lg-6">
						<div className="sv-search-box">
							<form onSubmit={handleSubmit}>
								<label className="form-label sv-hint mb-2">SteamID64 o nombre de perfil</label>
								<div className="input-group input-group-lg mb-3">
									<span className="input-group-text" style={{ background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text-dim)" }}>
										<i className="fa-solid fa-magnifying-glass"></i>
									</span>
									<input type="text" className="form-control" placeholder="76561198000000000 o mi_nombre_steam"
										value={value} onChange={(e) => setValue(e.target.value)} required />
								</div>
								<button type="submit" className="btn sv-btn-accent w-100">Ver perfil <i className="fa-solid fa-arrow-right ms-1"></i></button>
							</form>

							<div className="mt-3">
								<p className="sv-hint mb-1">Prueba con estos ejemplos:</p>
								{EXAMPLES.map((ex) => (
									<span key={ex} className="sv-example-chip" onClick={() => setValue(ex)}>{ex}</span>
								))}
							</div>
						</div>

						<p className="sv-auth-footer">¿Quieres guardar tu perfil? <a href="/register">Crea una cuenta</a></p>
					</div>
				</div>
			</div>
		</section>
	);
};
