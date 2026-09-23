import { Navigate, Outlet } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

// el JWT trae su caducidad (exp, en segundos) dentro del payload
function isTokenExpired(token) {
    try {
        const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const { exp } = JSON.parse(atob(base64));
        return exp ? exp * 1000 < Date.now() : false;
    } catch {
        return false;
    }
}

export const ProtectedRoutes = ()=>{
    const {store, dispatch} = useGlobalReducer();

    const token = localStorage.getItem("token");

    if (!token || isTokenExpired(token)) {
        localStorage.removeItem("token");
        return <Navigate to={"/login"} replace />
    }

    return < Outlet />
}
