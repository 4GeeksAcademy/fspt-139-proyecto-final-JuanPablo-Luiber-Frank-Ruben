"""
Generación determinista de datos de ejemplo (mock) para el visor de perfiles de Steam.
El mismo steam_id siempre produce los mismos juegos/logros, para que la demo sea consistente
sin necesitar una API key real de Steam.
"""
import math

GAME_CATALOG = [
    {"appid": 730, "name": "Counter-Strike 2"},
    {"appid": 570, "name": "Dota 2"},
    {"appid": 440, "name": "Team Fortress 2"},
    {"appid": 271590, "name": "Grand Theft Auto V"},
    {"appid": 1091500, "name": "Cyberpunk 2077"},
    {"appid": 1245620, "name": "ELDEN RING"},
    {"appid": 1174180, "name": "Red Dead Redemption 2"},
    {"appid": 292030, "name": "The Witcher 3: Wild Hunt"},
    {"appid": 578080, "name": "PUBG: BATTLEGROUNDS"},
    {"appid": 359550, "name": "Tom Clancy's Rainbow Six Siege"},
    {"appid": 1938090, "name": "Call of Duty"},
    {"appid": 1086940, "name": "Baldur's Gate 3"},
    {"appid": 620, "name": "Portal 2"},
    {"appid": 546560, "name": "Half-Life: Alyx"},
    {"appid": 105600, "name": "Terraria"},
    {"appid": 413150, "name": "Stardew Valley"},
    {"appid": 1145360, "name": "Hades"},
    {"appid": 1172470, "name": "Apex Legends"},
    {"appid": 1085660, "name": "Destiny 2"},
    {"appid": 550, "name": "Left 4 Dead 2"},
]

ACHIEVEMENT_NAMES = [
    "Primeros Pasos", "Explorador Novato", "Cazador de Sombras", "Maestro Táctico",
    "Sin Piedad", "Coleccionista", "Velocista", "Superviviente", "Leyenda Local",
    "Perfeccionista", "Estratega", "Invicto", "Rompe Récords", "El Elegido",
]


def hash_string(text: str) -> int:
    """Hash determinista simple (no depende de PYTHONHASHSEED, a diferencia de hash())."""
    h = 0
    for ch in text:
        h = (h * 31 + ord(ch)) & 0xFFFFFFFF
    return h


def seeded_random(seed: int):
    """Generador pseudoaleatorio determinista (Lehmer/Park-Miller)."""
    state = {"s": (seed % 2147483647) or 1}

    def rand():
        state["s"] = (state["s"] * 16807) % 2147483647
        return (state["s"] - 1) / 2147483646

    return rand


def game_header_img(appid: int) -> str:
    return f"https://cdn.cloudflare.steamstatic.com/steam/apps/{appid}/header.jpg"


STATUS_LABELS = ["Desconectado", "En línea", "Ocupado", "Ausente", "Durmiendo", "Buscando comerciar", "Buscando jugar"]
COUNTRIES = ["ES", "MX", "AR", "US", "CO"]


def build_profile_stub(steam_id: str) -> dict:
    """Campos 'de sabor' (nivel, estado, país...) que Steam no nos da sin API key real."""
    seed = hash_string(steam_id)
    rand = seeded_random(seed)
    return {
        "personastate": math.floor(rand() * 6),
        "loccountrycode": COUNTRIES[math.floor(rand() * len(COUNTRIES))],
        "level": math.floor(rand() * 60) + 1,
        "timecreated": 1420070400 + math.floor(rand() * 300000000),
    }


def build_games_with_achievements(steam_id: str) -> list:
    seed = hash_string(steam_id)
    games = []
    for idx, game in enumerate(GAME_CATALOG):
        g_rand = seeded_random(seed + game["appid"])
        total_achievements = 8 + math.floor(g_rand() * 6)
        unlocked = math.floor(g_rand() * (total_achievements + 1))
        # un par de juegos siempre al 100% para poder probar el filtro de completados
        if idx in (1, 5):
            unlocked = total_achievements
        playtime_forever = math.floor(g_rand() * 8000) + 30
        recently_played = g_rand() > 0.55
        playtime_2weeks = (math.floor(g_rand() * 1200) + 20) if recently_played else 0

        games.append({
            "appid": game["appid"],
            "name": game["name"],
            "header_image": game_header_img(game["appid"]),
            "playtime_forever": playtime_forever,
            "playtime_hours": round(playtime_forever / 60, 1),
            "playtime_2weeks": playtime_2weeks,
            "achievements": {
                "unlocked": unlocked,
                "total": total_achievements,
                "percentage": round((unlocked / total_achievements) * 100) if total_achievements else 0,
            },
        })
    return sorted(games, key=lambda g: g["playtime_forever"], reverse=True)


def build_achievements_for_game(steam_id: str, appid: int) -> dict:
    game = next((g for g in GAME_CATALOG if g["appid"] == int(appid)), None)
    seed = hash_string(steam_id)
    g_rand = seeded_random(seed + int(appid))
    total_achievements = 8 + math.floor(g_rand() * 6)

    achievements = []
    for i in range(total_achievements):
        unlocked = g_rand() > 0.4
        achievements.append({
            "apiname": f"ACH_{i}",
            "displayName": ACHIEVEMENT_NAMES[i % len(ACHIEVEMENT_NAMES)] + (f" {i}" if i >= len(ACHIEVEMENT_NAMES) else ""),
            "description": "Completa un desafío especial dentro del juego para desbloquear este logro.",
            "achieved": 1 if unlocked else 0,
            "unlocktime": (1650000000 + math.floor(g_rand() * 60000000)) if unlocked else 0,
            "globalPercentage": round(g_rand() * 9000, 2) / 100 + 0.5,
        })

    return {
        "appid": int(appid),
        "gameName": game["name"] if game else f"Juego {appid}",
        "achievements": achievements,
    }


def build_highlights(steam_id: str) -> dict:
    """Logros destacados (más raros) y más recientes, agregando todos los juegos del catálogo."""
    all_unlocked = []
    for game in GAME_CATALOG:
        data = build_achievements_for_game(steam_id, game["appid"])
        for a in data["achievements"]:
            if a["achieved"] == 1:
                all_unlocked.append({
                    "appid": game["appid"],
                    "gameName": game["name"],
                    "apiname": a["apiname"],
                    "displayName": a["displayName"],
                    "description": a["description"],
                    "unlocktime": a["unlocktime"],
                    "globalPercentage": a["globalPercentage"],
                })

    featured = sorted(all_unlocked, key=lambda a: a["globalPercentage"])[:8]
    recent = sorted(all_unlocked, key=lambda a: a["unlocktime"], reverse=True)[:8]
    return {"featuredAchievements": featured, "recentAchievements": recent}


def most_recent_achievement(steam_id: str):
    """Para la actividad de amigos: el logro más reciente de un usuario real, o None."""
    highlights = build_highlights(steam_id)
    recent = highlights["recentAchievements"]
    return recent[0] if recent else None
