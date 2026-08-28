from flask_sqlalchemy import SQLAlchemy
from datetime import date, datetime
from sqlalchemy import String, Boolean, Date, ForeignKey, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship
from flask_bcrypt import generate_password_hash, check_password_hash
from typing import List

db = SQLAlchemy()

friends_table = Table(
    "friends",
    db.metadata,
    Column("user_from_id", ForeignKey("user.id"), primary_key=True),
    Column("user_to_friend_id", ForeignKey("user.id"), primary_key=True)
)

# anadir el id y el steam_id
class User(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    steam_id: Mapped[str] = mapped_column(unique=True, nullable=False)
    email: Mapped[str] = mapped_column(
        String(120), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(nullable=False)
    nickname: Mapped[str] = mapped_column(String(40), nullable=False)
    avatar_url: Mapped[str] = mapped_column(String(500),nullable=False)
    profile_url: Mapped[str] = mapped_column(String(500),nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.now, nullable=False)
    friendships: Mapped[List["User"]] = relationship(
        "User",
        secondary="friends",
        primaryjoin="User.id == friends.c.user_from_id",
        secondaryjoin="User.id == friends.c.user_to_friend_id",
        back_populates="friends_of"
    )
    friends_of: Mapped[List["User"]] = relationship(
        "User",
        secondary="friends",
        primaryjoin="User.id == friends.c.user_to_friend_id",
        secondaryjoin="User.id == friends.c.user_from_id",
        back_populates="friendships"
    )
    games: Mapped[List["UserGame"]] = relationship("UserGame", back_populates="user")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def serialize(self):
        return {
            "id": self.id,
            "steam_id": self.steam_id,
            "email": self.email,
            "nickname": self.nickname,
            "avatar_url": self.avatar_url,
            "profile_url": self.profile_url,
            "created_at": self.created_at.isoformat(),
            "friendships": [user.id for user in self.friendships],
            "friends_of": [user.id for user in self.friends_of]
        }

class Game(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    appid: Mapped[int] = mapped_column(unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    img_icon_url: Mapped[str] = mapped_column(String(500), nullable=True)

    def serialize(self):
        return {
            "id": self.id,
            "appid": self.appid,
            "name": self.name,
            "img_icon_url": self.img_icon_url
    }

class UserGame(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)
    game_id: Mapped[int] = mapped_column(ForeignKey("game.id"), nullable=False)
    playtime_forever: Mapped[int] = mapped_column(nullable=False, default=0)
    playtime_2weeks: Mapped[int] = mapped_column(nullable=True)
    playtime_windows_forever: Mapped[int] = mapped_column(nullable=True, default=0)
    playtime_mac_forever: Mapped[int] = mapped_column(nullable=True, default=0)
    playtime_linux_forever: Mapped[int] = mapped_column(nullable=True, default=0)
    playtime_deck_forever: Mapped[int] = mapped_column(nullable=True, default=0)
    rtime_last_played: Mapped[int] = mapped_column(nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="games")
    game: Mapped["Game"] = relationship("Game")

    def serialize(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "playtime_forever": self.playtime_forever,
            "playtime_2weeks": self.playtime_2weeks,
            "rtime_last_played": self.rtime_last_played,
            "game": self.game.serialize()
    }
    