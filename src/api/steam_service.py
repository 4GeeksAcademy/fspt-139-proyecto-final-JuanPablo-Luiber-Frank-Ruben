import requests
import os


def get_steam_games(steam_id):

    api_key = os.getenv("API_KEY")

    if not api_key:
        return None, "Steam API key is not configured"

    url = f"https://api.steamapis.com/v2/steam/users/{steam_id}/games"

    try:
        response = requests.get(url, headers={"x-api-key": api_key})
    except requests.exceptions.RequestException:
        return None, "Could not connect to SteamApis"

    if response.status_code != 200:
        return None, f"SteamApis returned an error: {response.status_code}"

    data = response.json()

    return data, None


def map_steam_game(steam_game):
    game = steam_game.get("game", {})
    return {
        "appid": game.get("id"),
        "name": game.get("name"),
        "img_icon_url": game.get("icon"),
        "playtime_forever": steam_game.get("minutes", 0)
    }

def get_steam_achievements(steam_id, appid):

    api_key = os.getenv("API_KEY")

    if not api_key:
        return None, "Steam API key is not configured"

    user_url = f"https://api.steamapis.com/v2/steam/users/{steam_id}/achievements/{appid}"
    schema_url = f"https://api.steamapis.com/v2/steam/apps/{appid}/schema"

    try:
        user_response = requests.get(user_url, headers={"x-api-key": api_key})
        schema_response = requests.get(schema_url, headers={"x-api-key": api_key})
    except requests.exceptions.RequestException:
        return None, "Could not connect to SteamApis"

    if user_response.status_code != 200:
        return None, f"SteamApis returned an error: {user_response.status_code}"

    if schema_response.status_code != 200:
        return None, f"SteamApis returned an error: {schema_response.status_code}"

    user_achievements = user_response.json().get("result", {}).get("achievements", [])
    schema_achievements = schema_response.json().get(
        "result", {}).get("availableGameStats", {}).get("achievements", [])

    schema_by_name = {a.get("name"): a for a in schema_achievements}

    combined = []
    for user_achievement in user_achievements:
        name = user_achievement.get("name")
        definition = schema_by_name.get(name, {})
        combined.append({**definition, **user_achievement})

    return combined, None


def map_steam_achievement(achievement):
    return {
        "name": achievement.get("name"),
        "display_name": achievement.get("displayName"),
        "description": achievement.get("description"),
        "icon": achievement.get("icon"),
        "unlocked": achievement.get("unlocked", False),
        "unlocked_at": achievement.get("unlockedTimestamp") or None
    }
