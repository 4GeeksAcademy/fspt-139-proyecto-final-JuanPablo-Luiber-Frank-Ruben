"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, Favorite
from api.utils import generate_sitemap, APIException
from api import mock_data
from flask_cors import CORS
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)


@api.route("/users", methods=["POST"])
def create_user():

    data = request.get_json()
    steam_id = data.get("steam_id")
    email = data.get("email")
    password = data.get("password")
    nickname = data.get("nickname")
    avatar_url = data.get("avatar_url")
    profile_url = data.get("profile_url")

    if not steam_id or not email or not password or not nickname:
        return jsonify({
            "error": "steam_id, email, password and nickname are required"
        }), 400

    existing_user = db.session.execute(db.select(User).where(
        User.email == email)).scalar_one_or_none()
    if existing_user:
        return jsonify({"error": "User whith this email already exist"}), 400

    # avatar/profile url son opcionales: generamos unos por defecto si no llegan
    if not avatar_url:
        avatar_url = f"https://i.pravatar.cc/184?u={steam_id}"
    if not profile_url:
        profile_url = f"https://steamcommunity.com/profiles/{steam_id}/"

    new_user = User(
        steam_id=steam_id,
        email=email,
        nickname=nickname,
        avatar_url=avatar_url,
        profile_url=profile_url
    )

    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()

    access_token = create_access_token(identity=str(new_user.id))
    return jsonify({"msg": "User created succesfully", "token": access_token, "user": new_user.serialize()}), 201


@api.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.serialize()}), 200


@api.route("/users/search", methods=["GET"])
@jwt_required()
def search_users():
    q = request.args.get("q", "").strip()
    user_id = get_jwt_identity()

    query = db.select(User).where(User.id != int(user_id))
    if q:
        like = f"%{q}%"
        query = query.where(db.or_(User.nickname.ilike(like), User.steam_id.ilike(like)))

    users = db.session.execute(query.limit(20)).scalars().all()
    return jsonify({"users": [u.serialize() for u in users]}), 200



@api.route("/friends/<int:friend_id>", methods=["POST"])
@jwt_required() # vigilante, sin pulsera no entras
def add_friend(friend_id):

    user_id = get_jwt_identity()

    user = db.session.get(User, user_id)
    friend = db.session.get(User, friend_id)

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    if not friend:
        return jsonify({
            "error": "Friend not found"
        }), 404

    if user.id == friend.id:
        return jsonify({
            "error": "You cannot add yourself as a friend"
        }), 400

    if friend in user.friendships:
        return jsonify({
            "error": "User is already your friend"
        }), 400

    user.friendships.append(friend)

    db.session.commit()

    return jsonify({
        "msg": "Friend added successfully"
    }), 201


@api.route("/friends/<int:friend_id>", methods=["DELETE"])
@jwt_required()
def remove_friend(friend_id):

    user_id = get_jwt_identity()

    user = db.session.get(User, user_id)
    friend = db.session.get(User, friend_id)

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    if not friend:
        return jsonify({
            "error": "Friend not found"
        }), 404

    if friend not in user.friendships:
        return jsonify({
            "error": "This user is not your friend"
        }), 404

    user.friendships.remove(friend)

    db.session.commit()

    return jsonify({
        "msg": "Friend removed successfully"
    }), 200


@api.route("/friends", methods=["GET"])
@jwt_required()
def get_friends():

    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    return jsonify({
        "friendships": [friend.serialize() for friend in user.friendships]
    }), 200


@api.route("/friends-of", methods=["GET"])
@jwt_required()
def get_friends_of():

    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    return jsonify({
        "friends_of": [friend.serialize() for friend in user.friends_of]
    }), 200


@api.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
            return jsonify({"error": "email and password are required"}), 400
    
    existing_user = db.session.execute(db.select(User).where(
            User.email == email)).scalar_one_or_none()
    if existing_user is None:
         return jsonify({"error": "invalid email or password"}), 401

    if existing_user.check_password(password):
         access_token = create_access_token(identity=str(existing_user.id))
         return jsonify({"msg": "logeado correctamente", "token": access_token, "user": existing_user.serialize()}), 200
    else:
         return jsonify({"msg": "invalid email or password"}), 401


# ============ PERFIL / JUEGOS / LOGROS (datos de ejemplo deterministas) ============

def _find_registered_user(steam_id):
    return db.session.execute(db.select(User).where(User.steam_id == steam_id)).scalar_one_or_none()


def _optional_current_user():
    """Devuelve el User autenticado si hay un JWT válido en la petición, o None si no."""
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if user_id is None:
            return None
        return db.session.get(User, int(user_id))
    except Exception:
        return None


@api.route("/profile/<steam_id>", methods=["GET"])
def get_profile(steam_id):
    stub = mock_data.build_profile_stub(steam_id)
    registered = _find_registered_user(steam_id)

    if registered:
        profile = {
            "steamid": registered.steam_id,
            "personaname": registered.nickname,
            "avatarfull": registered.avatar_url,
            "profileurl": registered.profile_url,
            "source": "registered",
            "friendsCount": len(registered.friendships),
        }
    else:
        profile = {
            "steamid": steam_id,
            "personaname": f"Player_{steam_id[-4:] if len(steam_id) >= 4 else steam_id}",
            "avatarfull": f"https://i.pravatar.cc/184?u={steam_id}",
            "profileurl": f"https://steamcommunity.com/profiles/{steam_id}/",
            "source": "mock",
            "friendsCount": 0,
        }

    profile.update(stub)
    return jsonify(profile), 200


@api.route("/games/<steam_id>", methods=["GET"])
def get_games(steam_id):
    games = mock_data.build_games_with_achievements(steam_id)
    return jsonify({"games": games}), 200


@api.route("/games/<steam_id>/<int:appid>/achievements", methods=["GET"])
def get_game_achievements(steam_id, appid):
    data = mock_data.build_achievements_for_game(steam_id, appid)
    return jsonify(data), 200


@api.route("/highlights/<steam_id>", methods=["GET"])
def get_highlights(steam_id):
    highlights = mock_data.build_highlights(steam_id)

    friends_achievements = []
    viewer = _optional_current_user()
    if viewer and viewer.steam_id == steam_id:
        for friend in viewer.friendships:
            recent = mock_data.most_recent_achievement(friend.steam_id)
            if recent:
                friends_achievements.append({
                    "friendSteamId": friend.steam_id,
                    "friendName": friend.nickname,
                    "friendAvatar": friend.avatar_url,
                    "appid": recent["appid"],
                    "gameName": recent["gameName"],
                    "achievementName": recent["displayName"],
                    "unlocktime": recent["unlocktime"],
                })
        friends_achievements.sort(key=lambda f: f["unlocktime"], reverse=True)

    highlights["friendsAchievements"] = friends_achievements[:8]
    return jsonify(highlights), 200


# ============ FAVORITOS ============

@api.route("/favorites", methods=["GET"])
@jwt_required()
def get_favorites():
    user_id = get_jwt_identity()
    favs = db.session.execute(db.select(Favorite).where(Favorite.user_id == int(user_id))).scalars().all()
    return jsonify({"favorites": [f.appid for f in favs]}), 200


@api.route("/favorites/<int:appid>", methods=["POST"])
@jwt_required()
def add_favorite(appid):
    user_id = int(get_jwt_identity())
    existing = db.session.execute(db.select(Favorite).where(
        Favorite.user_id == user_id, Favorite.appid == appid)).scalar_one_or_none()
    if existing:
        return jsonify({"msg": "Already a favorite"}), 200

    fav = Favorite(user_id=user_id, appid=appid)
    db.session.add(fav)
    db.session.commit()
    return jsonify({"msg": "Added to favorites"}), 201


@api.route("/favorites/<int:appid>", methods=["DELETE"])
@jwt_required()
def remove_favorite(appid):
    user_id = int(get_jwt_identity())
    existing = db.session.execute(db.select(Favorite).where(
        Favorite.user_id == user_id, Favorite.appid == appid)).scalar_one_or_none()
    if not existing:
        return jsonify({"error": "Favorite not found"}), 404

    db.session.delete(existing)
    db.session.commit()
    return jsonify({"msg": "Removed from favorites"}), 200