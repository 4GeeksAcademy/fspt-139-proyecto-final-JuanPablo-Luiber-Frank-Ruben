const BASE = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "") + "/api";

async function request(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    throw new Error(data.error || data.msg || "Error de red");
  }
  return data;
}

export const api = {
  register: (payload) => request("/users", { method: "POST", body: payload }),
  login: (payload) => request("/login", { method: "POST", body: payload }),
  me: (token) => request("/me", { token }),
  searchUsers: (q, token) => request(`/users/search?q=${encodeURIComponent(q || "")}`, { token }),

  profile: (steamId) => request(`/profile/${encodeURIComponent(steamId)}`),
  games: (steamId) => request(`/games/${encodeURIComponent(steamId)}`),
  gameAchievements: (steamId, appid) => request(`/games/${encodeURIComponent(steamId)}/${appid}/achievements`),
  highlights: (steamId, token) => request(`/highlights/${encodeURIComponent(steamId)}`, { token }),

  favorites: (token) => request("/favorites", { token }),
  addFavorite: (appid, token) => request(`/favorites/${appid}`, { method: "POST", token }),
  removeFavorite: (appid, token) => request(`/favorites/${appid}`, { method: "DELETE", token }),

  friends: (token) => request("/friends", { token }),
  addFriend: (friendId, token) => request(`/friends/${friendId}`, { method: "POST", token }),
  removeFriend: (friendId, token) => request(`/friends/${friendId}`, { method: "DELETE", token }),
};
