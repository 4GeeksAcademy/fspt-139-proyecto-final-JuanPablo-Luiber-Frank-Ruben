import { useEffect, useState, useCallback } from "react";
import { api } from "../services/api";

export default function useFavorites(steamId, token) {
  const [favorites, setFavorites] = useState([]);
  const localKey = `sv_favorites_${steamId}`;

  useEffect(() => {
    let cancelled = false;
    if (token) {
      api.favorites(token).then((data) => {
        if (!cancelled) setFavorites(data.favorites || []);
      }).catch(() => {});
    } else {
      try {
        setFavorites(JSON.parse(localStorage.getItem(localKey)) || []);
      } catch {
        setFavorites([]);
      }
    }
    return () => { cancelled = true; };
  }, [steamId, token]);

  const toggleFavorite = useCallback(async (appid) => {
    const isFav = favorites.includes(appid);
    if (token) {
      try {
        if (isFav) await api.removeFavorite(appid, token);
        else await api.addFavorite(appid, token);
        setFavorites((prev) => (isFav ? prev.filter((a) => a !== appid) : [...prev, appid]));
      } catch {
        // no-op: si falla la llamada, dejamos el estado como estaba
      }
    } else {
      const next = isFav ? favorites.filter((a) => a !== appid) : [...favorites, appid];
      setFavorites(next);
      localStorage.setItem(localKey, JSON.stringify(next));
    }
  }, [favorites, token, localKey]);

  return { favorites, toggleFavorite };
}
