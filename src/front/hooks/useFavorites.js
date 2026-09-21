import { useEffect, useState, useCallback } from "react";

export default function useFavorites(token) {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [ favorites, setFavorites ] =  useState([]);

    useEffect(() => {
        if (!token) {
            setFavorites ([]);
            return;
        }

        fetch(`${backendUrl}/api/favorites`, {
            headers: { Authorization: `Bearer ${token}` },
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