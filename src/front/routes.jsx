// Import necessary components and functions from react-router-dom.

import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
    Navigate,
} from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Search } from "./pages/Search";
import { Profile } from "./pages/Profile";
import { Games } from "./pages/Games";
import { Achievements } from "./pages/Achievements";

export const router = createBrowserRouter(
    createRoutesFromElements(
      // Login y Register van sin Navbar/Footer (pantalla split a pantalla completa).
      <>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>} >
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/search" element={<Search />} />
          <Route path="/profile/:steamId" element={<Profile />} />
          <Route path="/profile/:steamId/games" element={<Games />} />
          <Route path="/profile/:steamId/achievements" element={<Achievements />} />
        </Route>
      </>
    )
);
