import { useEffect, useState, useCallback } from "react";

export default function useFavorites(token) {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
<<<<<<< HEAD
    const [ favorites, setFavorites ] =  useState([]);
=======
    const [ Favorites, setFavorites ] =  useState([]);
>>>>>>> 684bb2c0751350419ff909ef5965a90590cfa76d

    useEffect(() => {
        if (!token) {
            setFavorites ([]);
            return;
        }

<<<<<<< HEAD
        fetch(`${backendUrl}/api/favorites`, {
            headers: { Authorization: `Bearer ${token}` },
=======
        fetch('${backendURL¡¡rl}/api/favorites', {
            headers: { Authorization: 'Bearer ${token}' },
>>>>>>> 684bb2c0751350419ff909ef5965a90590cfa76d
        })
            .then((res) => res.json())
			.then((data) => setFavorites(data.favorites || []))
			.catch(() => {});
    }, [token]);

    const toggleFavorite = useCallback(async (appid) => {
		if (!token) return;
		const isFav = favorites.includes(appid);
		try {
			await fetch(`${backendUrl}/api/favorites/${appid}`, {
				method: isFav ? "DELETE" : "POST",
				headers: { Authorization: `Bearer ${token}` },
			});
            setFavorites((prev) => (isFav ? prev.filter((a) => a !== appid) : [...prev, appid]));
		} catch {
			// si falla la llamada, dejamos el estado como estaba
		}
	}, [favorites, token, backendUrl]);

	return { favorites, toggleFavorite };
}