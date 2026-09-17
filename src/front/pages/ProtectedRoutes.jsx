import { Navigate, Outlet } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const ProtectedRoutes = ()=>{
    const {store, dispatch} = useGlobalReducer();

    if (!localStorage.getItem("token")) {
        return <Navigate to={"/404"} replace />
    }

    return < Outlet />
}