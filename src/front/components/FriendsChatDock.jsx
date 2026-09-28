import { useCallback, useEffect, useRef, useState } from "react";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
const MAX_WINDOWS = 3;
const LIST_POLL_MS = 15000;
const CHAT_POLL_MS = 3000;

function getUserIdFromToken(token) {
    try {
        return Number(JSON.parse(atob(token.split(".")[1])).sub);
    } catch {
        return null;
    }
}

function defaultAvatar(nickname) {
    return `https://ui-avatars.com/api/?background=16161c&color=ff006a&name=${encodeURIComponent(nickname || "?")}`;
}

function avatarFallback(e, nickname) {
    e.currentTarget.onerror = null;
    e.currentTarget.src = defaultAvatar(nickname);
}

function timeAgo(dateStr) {
    if (!dateStr) return "";
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Hoy";
    if (days === 1) return "Ayer";
    return `Hace ${days} días`;
}

function formatTime(iso) {
    return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function apiFetch(path, token, options = {}) {
    return fetch(`${backendUrl}/api${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    }).then((res) => res.json().then((data) => ({ ok: res.ok, status: res.status, data })));
}

const ChatWindow = ({ friend, token, myId, minimized, onToggle, onClose, onRead }) => {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [error, setError] = useState("");
    const [sending, setSending] = useState(false);
    const [achievements, setAchievements] = useState([]);
    const [showAchievements, setShowAchievements] = useState(true);
    const lastIdRef = useRef(0);
    const bodyRef = useRef(null);
    const inputRef = useRef(null);

    const loadMessages = useCallback((initial) => {
        const after = initial ? 0 : lastIdRef.current;
        const query = after ? `?after=${after}` : "";

        return apiFetch(`/messages/${friend.id}${query}`, token)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.error || data.msg || "No se pudieron cargar los mensajes");

                const incoming = data.messages || [];

                if (incoming.length) {
                    lastIdRef.current = Math.max(lastIdRef.current, incoming[incoming.length - 1].id);
                    setMessages((prev) =>
                        initial ? incoming : [...prev, ...incoming.filter((m) => !prev.some((p) => p.id === m.id))]
                    );
                }

                if (initial || incoming.some((m) => m.sender_id === friend.id)) onRead();
                setError("");
            })
            .catch((err) => setError(err.message));
    }, [friend.id, token, onRead]);

    // mensajes y últimos logros del amigo al abrir la ventana
    useEffect(() => {
        loadMessages(true);

        apiFetch(`/friends/${friend.id}/achievements?limit=3`, token)
            .then(({ ok, data }) => setAchievements(ok ? data.achievements || [] : []))
            .catch(() => setAchievements([]));
    }, [friend.id, token, loadMessages]);

    // mensajes nuevos cada pocos segundos mientras la ventana está abierta
    useEffect(() => {
        if (minimized) return;
        const id = setInterval(() => {
            if (!document.hidden) loadMessages(false);
        }, CHAT_POLL_MS);
        return () => clearInterval(id);
    }, [minimized, loadMessages]);

    useEffect(() => {
        if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }, [messages.length, minimized]);

    const send = (e) => {
        e.preventDefault();
        const content = text.trim();
        if (!content || sending) return;

        setSending(true);
        apiFetch(`/messages/${friend.id}`, token, {
            method: "POST",
            body: JSON.stringify({ content }),
        })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.error || data.msg || "No se pudo enviar el mensaje");
                setText("");
                lastIdRef.current = Math.max(lastIdRef.current, data.message.id);
                setMessages((prev) => [...prev, data.message]);
                setError("");
            })
            .catch((err) => setError(err.message))
            .finally(() => setSending(false));
    };

    const congratulate = (ua) => {
        const name = ua.achievement.display_name || ua.achievement.name;
        setText(`¡Felicidades por "${name}" en ${ua.game_name}!`);
        inputRef.current?.focus();
    };

    return (
        <div className={`sv-fchat-card${minimized ? " minimized" : ""}`}>
            <div className="sv-fchat-card-header" onClick={onToggle}>
                <img
                    src={friend.avatar_url || defaultAvatar(friend.nickname)}
                    alt={friend.nickname}
                    onError={(e) => avatarFallback(e, friend.nickname)}
                />
                <span className="sv-fchat-name">{friend.nickname}</span>
                <button
                    type="button"
                    title={minimized ? "Abrir" : "Minimizar"}
                    onClick={(e) => { e.stopPropagation(); onToggle(); }}
                >
                    <i className={`fa-solid ${minimized ? "fa-chevron-up" : "fa-minus"}`}></i>
                </button>
                <button
                    type="button"
                    title="Cerrar"
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                >
                    <i className="fa-solid fa-xmark"></i>
                </button>
            </div>

            {!minimized && (
                <>
                    {achievements.length > 0 && (
                        <div className="sv-fchat-ach">
                            <button
                                type="button"
                                className="sv-fchat-ach-toggle"
                                onClick={() => setShowAchievements((v) => !v)}
                            >
                                <i className="fa-solid fa-trophy"></i> Últimos logros
                                <i className={`fa-solid ${showAchievements ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
                            </button>

                            {showAchievements && achievements.map((ua) => (
                                <div className="sv-fchat-achievement" key={ua.id}>
                                    {ua.achievement.image_url ? (
                                        <img className="sv-fchat-ach-icon" src={ua.achievement.image_url} alt="" />
                                    ) : (
                                        <span className="sv-fchat-ach-icon"><i className="fa-solid fa-trophy"></i></span>
                                    )}
                                    <div className="sv-fchat-ach-text">
                                        <div className="sv-fchat-achievement-name">
                                            {ua.achievement.display_name || ua.achievement.name}
                                        </div>
                                        <div className="sv-fchat-achievement-date">
                                            {ua.game_name} · {timeAgo(ua.unlocked_at)}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="sv-fchat-ach-cheer"
                                        onClick={() => congratulate(ua)}
                                    >
                                        Felicitar
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="sv-fchat-card-body" ref={bodyRef}>
                        {messages.length === 0 && !error && (
                            <p className="sv-fchat-empty">Todavía no hay mensajes. ¡Saluda!</p>
                        )}

                        {messages.map((m) => (
                            <div className={`sv-fchat-msg${m.sender_id === myId ? " mine" : ""}`} key={m.id}>
                                <div className="sv-fchat-bubble">{m.content}</div>
                                <div className="sv-fchat-time">{formatTime(m.created_at)}</div>
                            </div>
                        ))}
                    </div>

                    {error && <div className="sv-fchat-error">{error}</div>}

                    <form className="sv-fchat-form" onSubmit={send}>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Escribe un mensaje..."
                            maxLength={1000}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                        <button type="submit" title="Enviar" disabled={!text.trim() || sending}>
                            <i className="fa-solid fa-paper-plane"></i>
                        </button>
                    </form>
                </>
            )}
        </div>
    );
};

export const FriendsChatDock = () => {
    const [token] = useState(() => localStorage.getItem("token"));
    const myId = token ? getUserIdFromToken(token) : null;

    const [me, setMe] = useState(null);
    const [open, setOpen] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [unreadTotal, setUnreadTotal] = useState(0);
    const [loadingList, setLoadingList] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [notice, setNotice] = useState("");
    const [openChats, setOpenChats] = useState([]); // [{ friend, minimized }]
    const syncedRef = useRef(false);

    const loadConversations = useCallback(() => {
        if (!token) return Promise.resolve();
        return apiFetch("/conversations", token)
            .then(({ ok, data }) => {
                if (!ok) return;
                setConversations(data.conversations || []);
                setUnreadTotal(data.unread_total || 0);
            })
            .catch(() => {});
    }, [token]);

    const syncFriends = useCallback(() => {
        setSyncing(true);
        setNotice("");
        return apiFetch("/steam/friends/sync", token, { method: "POST" })
            .then(({ ok, status, data }) => {
                if (ok) return;
                if (status === 400) {
                    setNotice("Vincula tu cuenta de Steam desde tu perfil para chatear con tus amigos.");
                } else {
                    setNotice(data.error || "No se pudieron sincronizar tus amigos de Steam.");
                }
            })
            .catch(() => setNotice("No se pudo conectar con el servidor."))
            .finally(() => {
                setSyncing(false);
                loadConversations();
            });
    }, [token, loadConversations]);

    useEffect(() => {
        if (!token) return;
        apiFetch("/me", token)
            .then(({ ok, data }) => ok && setMe(data.user))
            .catch(() => {});
    }, [token]);

    // contador de no leídos, también con la barra plegada
    useEffect(() => {
        if (!token) return;
        loadConversations();
        const id = setInterval(() => {
            if (!document.hidden) loadConversations();
        }, LIST_POLL_MS);
        return () => clearInterval(id);
    }, [token, loadConversations]);

    if (!token) return null;

    // los amigos de Steam se sincronizan la primera vez que se abre la barra
    const toggleOpen = () => {
        const next = !open;
        setOpen(next);
        if (next && !syncedRef.current) {
            syncedRef.current = true;
            setLoadingList(true);
            syncFriends().finally(() => setLoadingList(false));
        }
    };

    const openChat = (friend) => {
        setOpenChats((prev) => {
            if (prev.some((c) => c.friend.id === friend.id)) {
                return prev.map((c) => (c.friend.id === friend.id ? { ...c, minimized: false } : c));
            }
            const next = [...prev, { friend, minimized: false }];
            return next.length > MAX_WINDOWS ? next.slice(next.length - MAX_WINDOWS) : next;
        });
    };

    const toggleChat = (friendId) => {
        setOpenChats((prev) => prev.map((c) => (c.friend.id === friendId ? { ...c, minimized: !c.minimized } : c)));
    };

    const closeChat = (friendId) => {
        setOpenChats((prev) => prev.filter((c) => c.friend.id !== friendId));
    };

    return (
        <div className="sv-fchat-dock">
            <div className={`sv-fchat-bar${open ? " open" : ""}`}>
                <div className="sv-fchat-bar-header" onClick={toggleOpen}>
                    <div className="sv-fchat-me">
                        <img
                            src={me?.avatar_url || defaultAvatar(me?.nickname)}
                            alt="Tu avatar"
                            onError={(e) => avatarFallback(e, me?.nickname)}
                        />
                        <span className="sv-fchat-online"></span>
                    </div>

                    <span className="sv-fchat-title">Mensajes</span>

                    {unreadTotal > 0 && (
                        <span className="sv-fchat-badge">{unreadTotal > 99 ? "99+" : unreadTotal}</span>
                    )}

                    <div className="sv-fchat-bar-actions">
                        <button
                            type="button"
                            title="Sincronizar amigos de Steam"
                            disabled={syncing}
                            onClick={(e) => { e.stopPropagation(); syncFriends(); }}
                        >
                            <i className={`fa-solid fa-rotate${syncing ? " fa-spin" : ""}`}></i>
                        </button>
                        <button
                            type="button"
                            title={open ? "Plegar" : "Desplegar"}
                            onClick={(e) => { e.stopPropagation(); toggleOpen(); }}
                        >
                            <i className={`fa-solid ${open ? "fa-chevron-down" : "fa-chevron-up"}`}></i>
                        </button>
                    </div>
                </div>

                {open && (
                    <div className="sv-fchat-list">
                        {notice && <p className="sv-fchat-notice">{notice}</p>}

                        {loadingList && <p className="sv-fchat-empty">Buscando a tus amigos de Steam...</p>}

                        {!loadingList && conversations.length === 0 && !notice && (
                            <p className="sv-fchat-empty">
                                Ninguno de tus amigos de Steam usa Trophy Hunter todavía. ¡Invítalos!
                            </p>
                        )}

                        {conversations.map((c) => (
                            <button
                                type="button"
                                className="sv-fchat-contact"
                                key={c.friend.id}
                                onClick={() => openChat(c.friend)}
                            >
                                <img
                                    src={c.friend.avatar_url || defaultAvatar(c.friend.nickname)}
                                    alt={c.friend.nickname}
                                    onError={(e) => avatarFallback(e, c.friend.nickname)}
                                />
                                <div className="sv-fchat-contact-text">
                                    <div className="sv-fchat-contact-name">{c.friend.nickname}</div>
                                    <div className="sv-fchat-contact-preview">
                                        {c.last_message
                                            ? `${c.last_message.sender_id === myId ? "Tú: " : ""}${c.last_message.content}`
                                            : "Empieza la conversación"}
                                    </div>
                                </div>
                                {c.unread > 0 && <span className="sv-fchat-badge">{c.unread}</span>}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {openChats.map((c) => (
                <ChatWindow
                    key={c.friend.id}
                    friend={c.friend}
                    token={token}
                    myId={myId}
                    minimized={c.minimized}
                    onToggle={() => toggleChat(c.friend.id)}
                    onClose={() => closeChat(c.friend.id)}
                    onRead={loadConversations}
                />
            ))}
        </div>
    );
};
