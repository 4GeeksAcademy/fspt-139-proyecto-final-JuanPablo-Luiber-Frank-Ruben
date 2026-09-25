// Import necessary components and functions from react-router-dom.

import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
} from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Single } from "./pages/Single";
import { Demo } from "./pages/Demo";
import { Achievements } from "./pages/Achievements";
import { Navbar } from "./components/Navbar";
import { Profile } from "./pages/Profile";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { MyGames } from "./pages/MyGames";
import { ProtectedRoutes } from "./pages/ProtectedRoutes";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter(
    createRoutesFromElements(
      // CreateRoutesFromElements function allows you to build route elements declaratively.
      // Create your routes here, if you want to keep the Navbar and Footer in all views, add your new routes inside the containing Route.
      // Root, on the contrary, create a sister Route, if you have doubts, try it!
      // Note: keep in mind that errorElement will be the default page when you don't get a route, customize that page to make your project more attractive.
      // Note: The child paths of the Layout element replace the Outlet component with the elements contained in the "element" attribute of these child paths.
      <>
        {/* Auth routes: kept outside the Layout so the Navbar/Footer never render on login/registro. */}
        <Route path="/" element={<Login />} errorElement={<h1>Not found!</h1>} />
        <Route path="/login" element={<Login />} />
        <Route path="/users" element={<Signup />} />
        {/* Root Route: The rest of the app keeps the Navbar and Footer through the Layout. */}
        <Route element={<Layout />} errorElement={<h1>Not found!</h1>} >
          <Route path="/single/:theId" element={ <Single />} />  {/* Dynamic route for single items */}
          <Route path="/demo" element={<Demo />} />
          <Route element={<ProtectedRoutes />} >
            <Route path="/profile" element={<Profile />} />
            <Route path="/games" element={<MyGames />} />
            <Route path="/achievements" element={<Achievements />} />
          </Route>
          <Route path="/404" element={<NotFound />} />
        </Route>
      </>
    )
);