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
    return {
        "appid": steam_game.get("id"),
        "name": steam_game.get("name"),
        "img_icon_url": steam_game.get("icon"),
        "playtime_forever": steam_game.get("minutes", 0)
    }