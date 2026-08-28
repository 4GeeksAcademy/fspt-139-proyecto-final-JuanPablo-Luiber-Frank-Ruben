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
