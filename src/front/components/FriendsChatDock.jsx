import { useEffect, useState } from "react";

function timeAgo(dateStr) {
    if (!dateStr) return "";
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Hoy";
    if (days === 1) return "Ayer";
    return `Hace ${days} días`;
}

export const FriendsChatDock = () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const token = localStorage.getItem("token");

    const [listOpen, setListOpen] = useState(false);
    const [friends, setFriends] = useState([]);
    const [openChats, setOpenChats] = useState([]); // [{ id, nickname, avatar_url }]
    const [achievementsByFriend, setAchievementsByFriend] = useState({}); // { [id]: { loading, error, items } }

    useEffect(() => {
        if (!token) return;
        fetch(`${backendUrl}/api/friends`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => setFriends(data.friendships || []))
            .catch(() => {});
    }, [token]);

    if (!token) return null;

    const openChat = (friend) => {
        setListOpen(false);
        setOpenChats((prev) => (prev.some((f) => f.id === friend.id) ? prev : [...prev, friend]));

        setAchievementsByFriend((prev) => ({
            ...prev,
            [friend.id]: { loading: true, error: "", items: prev[friend.id]?.items || [] },
        }));

        fetch(`${backendUrl}/api/friends/${friend.id}/achievements`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.error || data.msg || "No se pudieron cargar los logros");
                setAchievementsByFriend((prev) => ({
                    ...prev,
                    [friend.id]: { loading: false, error: "", items: data.achievements || [] },
                }));
            })
            .catch((err) => {
                setAchievementsByFriend((prev) => ({
                    ...prev,
                    [friend.id]: { loading: false, error: err.message, items: [] },
                }));
            });
    };

    const closeChat = (friendId) => {
        setOpenChats((prev) => prev.filter((f) => f.id !== friendId));
    };

    return (
        <div className="sv-fchat-dock">
            <div className="sv-fchat-launcher-wrap">
                <button className="sv-fchat-launcher" onClick={() => setListOpen((v) => !v)}>
                    <i className="fa-solid fa-comment-dots"></i>
                </button>

                {listOpen && (
                    <div className="sv-fchat-list">
                        <div className="sv-fchat-list-header">Amigos</div>
                        {friends.length === 0 && (
                            <p className="sv-fchat-empty">Todavía no tienes amigos añadidos.</p>
                        )}
                        <ul>
                            {friends.map((friend) => (
                                <li key={friend.id} onClick={() => openChat(friend)}>
                                    <img
                                        src={friend.avatar_url || "https://api.dicebear.com/7.x/identicon/svg?seed=" + friend.id}
                                        alt={friend.nickname}
                                    />
                                    <span>{friend.nickname}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {openChats.map((friend) => {
                const state = achievementsByFriend[friend.id] || { loading: true, error: "", items: [] };
                return (
                    <div className="sv-fchat-card" key={friend.id}>
                        <div className="sv-fchat-card-header">
                            <img
                                src={friend.avatar_url || "https://api.dicebear.com/7.x/identicon/svg?seed=" + friend.id}
                                alt={friend.nickname}
                            />
                            <span>{friend.nickname}</span>
                            <button onClick={() => closeChat(friend.id)}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <div className="sv-fchat-card-body">
                            {state.loading && <p className="sv-fchat-empty">Cargando logros...</p>}
                            {state.error && <p className="sv-fchat-empty">{state.error}</p>}
                            {!state.loading && !state.error && state.items.length === 0 && (
                                <p className="sv-fchat-empty">Aún no tiene logros recientes.</p>
                            )}
                            {state.items.map((ua) => (
                                <div className="sv-fchat-achievement" key={ua.id}>
                                    <img
                                        src={ua.achievement.image_url || "https://via.placeholder.com/40"}
                                        alt={ua.achievement.name}
                                    />
                                    <div>
                                        <p className="sv-fchat-achievement-name">{ua.achievement.name}</p>
                                        <p className="sv-fchat-achievement-date">{timeAgo(ua.unlocked_at)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
