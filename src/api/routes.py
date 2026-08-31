"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, Game, UserGame
from api.utils import generate_sitemap, APIException
from flask_cors import CORS
from flask_jwt_extended import create_access_token,jwt_required, get_jwt_identity

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
    return jsonify({"msg": "User created succesfully"}), 201



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
         return jsonify({"msg": "logeado correctamente", "token": access_token}), 200
    else:
         return jsonify({"msg": "invalid email or password"}), 401


@api.route("/users/<int:user_id>/games", methods=["POST"])
@jwt_required()
def sync_user_games(user_id):

    current_user_id = get_jwt_identity()

    if str(current_user_id) != str(user_id):
        return jsonify({"error": "You cannot modify another user's games"}), 403

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    games_list = data.get("games")

    if not games_list:
        return jsonify({"error": "games list is required"}), 400

    for game_data in games_list:
        appid = game_data.get("appid")
        name = game_data.get("name")

        if not appid or not name:
            continue

        game = db.session.execute(db.select(Game).where(
            Game.appid == appid)).scalar_one_or_none()

        if not game:
            game = Game(
                appid=appid,
                name=name,
                img_icon_url=game_data.get("img_icon_url")
            )
            db.session.add(game)
            db.session.flush()

        user_game = db.session.execute(db.select(UserGame).where(
            UserGame.user_id == user_id,
            UserGame.game_id == game.id
        )).scalar_one_or_none()

        if not user_game:
            user_game = UserGame(user_id=user_id, game_id=game.id)
            db.session.add(user_game)

        user_game.playtime_forever = game_data.get("playtime_forever", 0)

    db.session.commit()

    return jsonify({"msg": "Games synced successfully"}), 201    

@api.route("/users/<int:user_id>/games", methods=["GET"])
@jwt_required()
def get_user_games(user_id):

    current_user_id = get_jwt_identity()

    if str(current_user_id) != str(user_id):
        return jsonify({"error": "You cannot view another user's games"}), 403

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    user_games = db.session.execute(db.select(UserGame).where(
        UserGame.user_id == user_id)).scalars().all()

    return jsonify({
        "games": [user_game.serialize() for user_game in user_games]
    }), 200