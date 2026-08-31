"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, SteamAccount
from api.utils import generate_sitemap, APIException
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import requests
from urllib.parse import urlencode
from flask import redirect
import os
from flask import session

api = Blueprint('api', __name__)


@api.route("/users", methods=["POST"])
def create_user():

    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    nickname = data.get("nickname")
    avatar_url = data.get("avatar_url")
    profile_url = data.get("profile_url")

    if not email or not password or not nickname:
        return jsonify({
            "error": "email, password and nickname are required"
        }), 400

    existing_user = db.session.execute(db.select(User).where(
        User.email == email)).scalar_one_or_none()
    if existing_user:
        return jsonify({"error": "User whith this email already exist"}), 400

    new_user = User(
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
@jwt_required()  # vigilante, sin pulsera no entras
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


@api.route("/steam/login", methods=["GET"])
@jwt_required()
def steam_login():

    user_id = get_jwt_identity()

    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    session["steam_link_user_id"] = user_id

    return_url = os.getenv('STEAM_RETURN_URL')

    params = {
        "openid.ns": "http://specs.openid.net/auth/2.0",
        "openid.mode": "checkid_setup",
        "openid.return_to": return_url,
        "openid.realm": return_url.rsplit("/api", 1)[0] + "/",
        "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select"
    }

    steam_url = "https://steamcommunity.com/openid/login?"

    steam_login_url = steam_url + urlencode(params)

    return jsonify({
        "steam_login_url": steam_login_url
    }), 200


@api.route("/steam/callback", methods=["GET"])
def steam_callback():

    user_id = session.get("steam_link_user_id")

    if not user_id:
        return jsonify({
            "error": "Steam linking session not found"
        }), 400

    steam_data = request.args.to_dict()

    verification_data = steam_data.copy()
    verification_data["openid.mode"] = "check_authentication"

    response = requests.post(
        "https://steamcommunity.com/openid/login",
        data=verification_data
    )

    if response.status_code != 200:
        return jsonify({
            "error": "Could not verify Steam authentication"
        }), 400

    if "is_valid:true" not in response.text:
        return jsonify({
            "error": "Invalid Steam authentication"
        }), 400

    claimed_id = steam_data.get("openid.claimed_id")

    if not claimed_id:
        return jsonify({
            "error": "Steam ID not received"
        }), 400

    steam_id = claimed_id.rsplit("/", 1)[-1]

    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    existing_steam_account = db.session.execute(
        db.select(SteamAccount).where(
            SteamAccount.steam_id == steam_id
        )
    ).scalar_one_or_none()

    if existing_steam_account:
        return jsonify({
            "error": "This Steam account is already linked"
        }), 400

    steam_account = SteamAccount(
        steam_id=steam_id,
        user_id=user.id
    )

    db.session.add(steam_account)
    db.session.commit()

    session.pop("steam_link_user_id", None)

    frontend_url = os.getenv("VITE_FRONTEND_URL")

    return redirect(
        f"{frontend_url}/profile?steam=connected"
    )


@api.route("/steam/account", methods=["GET"])
@jwt_required()
def get_steam_account():

    user_id = get_jwt_identity()

    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    steam_account = user.steam_account

    if not steam_account:
        return jsonify({
            "linked": False,
            "steam_account": None
        }), 200

    return jsonify({
        "linked": True,
        "steam_account": steam_account.serialize()
    }), 200


@api.route("/steam/profile", methods=["GET"])
@jwt_required()
def get_steam_profile():

    user_id = get_jwt_identity()

    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    steam_account = user.steam_account

    if not steam_account:
        return jsonify({
            "error": "Steam account not linked"
        }), 404

    steam_id = steam_account.steam_id

    api_key = os.getenv("API_KEY")

    response = requests.get(

        f"https://api.steamapis.com/v2/steam/users/{steam_id}",

        headers={
            "x-api-key": api_key
        }
    )

    if response.status_code != 200:
        return jsonify({
            "error": "Could not get Steam profile",
            "details": response.json()
        }), response.status_code

    data = response.json()

    return jsonify({
        "linked": True,
        "steam_account": steam_account.serialize(),
        "steam_profile": data
    }), 200
