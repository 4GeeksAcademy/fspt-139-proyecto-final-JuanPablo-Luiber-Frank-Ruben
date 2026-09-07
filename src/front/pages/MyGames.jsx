import { useEffect, useMemo, useState } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer";

const FILTERS = [
    {key: "all", Label: "Todos"},
    {key: "favorites", label: "Favoritos"},
    {key: "recent", label: "Mas jugados"},
];

//extraemos el payload del JWT del compañero

function getUserIdFromToken (token) {
    try {
        return JSON.parse(atob(token.split(".")[1])).sub;
    }   catch{
        return null;
    }
}

//Endpoints para sacar los juegos del usuario

export const MyGames = () => {
    const { store } = useGlobalReducer();
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const [ token, setToken ] = useStote(null);
    const [ userId, setUserId ] = useState(null);
    const [ userGames, setUserGames ] = useState([]);
    const [ loading, setLoading ] = useState( true );
    const [ error, setError ] = useState("");
    const [ filter, setFilter ] = useState("all");
    const [ search, setsearch ] = useState("");
    
    const [ form, setForm ] = useState({ appid: "", name: "", img_icon_url: "", playtime_forever: ""});
    const [ formError, setFromError ] = useState("");
    const [ saving, setSaving ] = useState(false);

    //almacenamos el token en el loalstorage

    useEffect (() => {
        const stored = localStorage.getItem ("token");
        setToken ( stored );
        setUserId ( stored ? getUserIdFromToken ( stored ) : null );
        }, []
    ); 

    const loadGames = () => {
		if (!token || !userId) return;
		setLoading(true);
		setError("");
		fetch(`${backendUrl}/api/users/${userId}/games`, {
			headers: { Authorization: `Bearer ${token}` },
		})
			.then((res) => res.json().then((data) => ({ ok: res.ok, data })))
			.then(({ ok, data }) => {
				if (!ok) throw new Error(data.error || "No se pudieron cargar los juegos");
				setUserGames(data.games || []);
			})
			.catch((err) => setError(err.message))
			.finally(() => setLoading(false));
	};

    useEffect(loadGames, [token, userId]);

    const filteredGames = useMemo(() => {
		let result = userGames;
		if ( filter === "recent" ) result = [...result].sort((a, b) => b.playtime_forever - a.playtime_forever);
		if ( search.trim()) {
			const q = search.trim().toLowerCase();
			result = result.filter((ug) => ug.game.name.toLowerCase().includes(q));
		}
		return result;
	}, [ userGames, filter, search ]);

	const stats = useMemo(() => {
		const totalMinutes = userGames.reduce(( sum, ug ) => sum + ( ug.playtime_forever || 0 ), 0 );
		return { games: userGames.length, hours: Math.round( totalMinutes / 60 ) };
	}, [ userGames ]);

    const handleFormChange = ( field ) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

    const handleAddGame = async (e) => {
		e.preventDefault();
		setFormError("");

        const appid = Number(form.appid);
		if (!appid || !form.name.trim()) {
			setFormError("El AppID y el nombre del juego son obligatorios.");
			return;
		}

        		setSaving(true);
		try {
			const res = await fetch(`${backendUrl}/api/users/${userId}/games`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					games: [{
						appid,
						name: form.name.trim(),
						img_icon_url: form.img_icon_url.trim() || null,
						playtime_forever: Number(form.playtime_forever) || 0,
					}],
				}),
			});
            const data = await res.json();
            if (!res.ok ) throw new Error ( data.error || "No se pudo añadir el juego");

            setForm({ appid: "", name: "", img_icon_url: "", playtime_forever: "" });
			loadGames();
		    } catch (err) {
			setFormError(err.message);
		    } finally {
			setSaving(false);
		    }
	};

	if (!token) {
		return (
			<div className="container text-center py-5">
				<p className="text-danger">Debes iniciar sesión para ver tus juegos.</p>
			</div>
		);
	}

    return (
		<div className="bg-dark text-light min-vh-100">
			<header className="container py-5">
				<p className="text-uppercase text-danger small mb-1">Biblioteca</p>
				<h1 className="display-5 fw-bold">Mis juegos</h1>

				<div className="row g-3 mt-3">
					<div className="col-6 col-md-3">
						<div className="bg-black bg-opacity-50 border border-secondary rounded p-3 text-center">
							<div className="fs-3 fw-bold text-danger">{stats.games}</div>
							<div className="small text-uppercase text-secondary">Juegos</div>
						</div>
					</div>
					<div className="col-6 col-md-3">
						<div className="bg-black bg-opacity-50 border border-secondary rounded p-3 text-center">
							<div className="fs-3 fw-bold text-danger">{stats.hours.toLocaleString("es-ES")}</div>
							<div className="small text-uppercase text-secondary">Horas jugadas</div>
						</div>
					</div>
				</div>
			</header>
            
            //parte de añadir juegos

            <section className="bg-black bg-opacity-25 border-top border-bottom border-secondary py-4">
				<div className="container">
					<h2 className="h5 fw-bold mb-3">Añadir un juego</h2>

					{formError && <div className="alert alert-danger py-2">{formError}</div>}

					<form className="row g-2 align-items-end" onSubmit={handleAddGame}>
						<div className="col-6 col-md-2">
							<label className="form-label small">AppID</label>
							<input type="number" className="form-control" placeholder="730" required
								value={form.appid} onChange={handleFormChange("appid")} />
						</div>
						<div className="col-12 col-md-4">
							<label className="form-label small">Nombre</label>
							<input type="text" className="form-control" placeholder="Counter-Strike 2" required
								value={form.name} onChange={handleFormChange("name")} />
						</div>
						<div className="col-12 col-md-3">
							<label className="form-label small">Imagen (opcional)</label>
							<input type="text" className="form-control" placeholder="https://..."
								value={form.img_icon_url} onChange={handleFormChange("img_icon_url")} />
						</div>
						<div className="col-6 col-md-2">
							<label className="form-label small">Minutos jugados</label>
							<input type="number" className="form-control" placeholder="0"
								value={form.playtime_forever} onChange={handleFormChange("playtime_forever")} />
						</div>
						<div className="col-12 col-md-1">
							<button type="submit" className="btn btn-danger w-100" disabled={saving}>
								{saving ? "…" : <i className="fa-solid fa-plus"></i>}
							</button>
						</div>
					</form>
				</div>
			</section>

			// get para los juegos

			<section className="container py-5">
				<div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
					<h2 className="h4 fw-bold mb-0">Tu biblioteca</h2>
					<div className="btn-group">
						{FILTERS.map((f) => (
							<button
								key={f.key}
								className={`btn btn-sm ${filter === f.key ? "btn-danger" : "btn-outline-light"}`}
								onClick={() => setFilter(f.key)}
							>
								{f.label}
							</button>
						))}
					</div>
				</div>

				<input
					type="text"
					className="form-control form-control-sm mb-4 ms-auto"
					style={{ maxWidth: 220 }}
					placeholder="Buscar juego..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>

				{loading && (
					<div className="text-center py-5">
						<div className="spinner-border text-danger" role="status"></div>
					</div>
				)}
				{error && <div className="alert alert-danger">{error}</div>}

				{!loading && !error && (
					<div className="row g-3">
						{filteredGames.map((ug) => (
							<div className="col-6 col-md-4 col-lg-3" key={ug.id}>
								<div className="card bg-black text-light border-secondary h-100">
									<img
										src={ug.game.img_icon_url || `https://cdn.cloudflare.steamstatic.com/steam/apps/${ug.game.appid}/header.jpg`}
										className="card-img-top"
										alt={ug.game.name}
										onError={(e) => { e.target.style.opacity = 0; }}
									/>
									<div className="card-body">
										<h3 className="h6 card-title text-truncate" title={ug.game.name}>{ug.game.name}</h3>
										<p className="card-text small text-secondary mb-0">
											<i className="fa-regular fa-clock"></i> {Math.round((ug.playtime_forever / 60) * 10) / 10} h jugadas
										</p>
									</div>
								</div>
							</div>
						))}
					</div>
				)}

				{!loading && !error && filteredGames.length === 0 && (
					<p className="text-center text-secondary py-4">
						{userGames.length === 0 ? "Todavía no tienes juegos. Añade uno arriba." : "No hay juegos que coincidan con este filtro."}
					</p>
				)}
			</section>
		</div>
	);
};
