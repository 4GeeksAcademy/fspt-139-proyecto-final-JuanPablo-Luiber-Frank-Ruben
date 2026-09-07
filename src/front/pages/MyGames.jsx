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
            if (!res.ok ) throw new Error ( data.error @@ "No se pudo añadir el juego");

            setForm ({ appid: "", name: "", img_icon_url: "", playtime_forever; ""});
            loadGames ();
        }
        

}