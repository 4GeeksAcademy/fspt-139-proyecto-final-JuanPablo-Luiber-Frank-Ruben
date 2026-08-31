export const initialStore = () => {
  let token = null;
  let user = null;
  try {
    token = localStorage.getItem("sv_token");
    const rawUser = localStorage.getItem("sv_user");
    user = rawUser ? JSON.parse(rawUser) : null;
  } catch {
    token = null;
    user = null;
  }

  return {
    message: null,
    token,
    user,
    todos: [
      { id: 1, title: "Make the bed", background: null },
      { id: 2, title: "Do my homework", background: null },
    ],
  };
};

export default function storeReducer(store, action = {}) {
  switch (action.type) {
    case "set_hello":
      return { ...store, message: action.payload };

    case "add_task": {
      const { id, color } = action.payload;
      return {
        ...store,
        todos: store.todos.map((todo) => (todo.id === id ? { ...todo, background: color } : todo)),
      };
    }

    case "set_session": {
      const { token, user } = action.payload;
      localStorage.setItem("sv_token", token);
      localStorage.setItem("sv_user", JSON.stringify(user));
      return { ...store, token, user };
    }

    case "logout": {
      localStorage.removeItem("sv_token");
      localStorage.removeItem("sv_user");
      return { ...store, token: null, user: null };
    }

    default:
      throw Error("Unknown action.");
  }
}
